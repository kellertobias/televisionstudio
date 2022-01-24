import {
	IModules,
	AtemModule,
	ObsModule,
	SleepModule,
	TextgenModule,
	AudioModule,
	SystemStateModule,
} from '../modules';
import { WebApi } from '../interfaces/web-api';
import { DeskWebInterface } from '../interfaces/desk/web';
import { DeskTallyInterface } from '../interfaces/desk/tally';

import { ConfigBackend } from './config';
import { MacroEngine } from './macros';

export class Engine {
	config: ConfigBackend;
	macros: MacroEngine;
	modules: IModules;
	interfaces: {
		desk: {
			web: DeskWebInterface;
			tally: DeskTallyInterface;
		};
	};
	servers: {
		web: WebApi;
	};

	constructor() {
		this.config = new ConfigBackend(
			process.env.SETTINGS_PATH ? process.env.SETTINGS_PATH : './config',
			process.env.SHOWDATA_PATH
				? process.env.SHOWDATA_PATH
				: './config/flashdrives',
		);

		this.modules = {
			atem: new AtemModule(this.config),
			obs: new ObsModule(this.config),
			sleep: new SleepModule(this.config),
			text: new TextgenModule(this.config),
			audio: new AudioModule(this.config),
			status: new SystemStateModule(this.config),
		};

		this.macros = new MacroEngine(this.config, this.modules);
		this.servers = {
			web: new WebApi(this.config, this.modules, this.macros),
		};

		this.interfaces = {
			desk: {
				web: new DeskWebInterface(
					this.config,
					this.modules,
					this.macros,
					this.servers.web.server,
				),
				tally: new DeskTallyInterface(this.config, this.modules, this.macros),
			},
		};
	}

	public stop(): void {
		console.log('[ENGINE] Stopping Engine');
		this.servers.web.shutdown();
		Object.values(this.interfaces.desk).forEach((inter) => inter.shutdown());
	}

	public async start(): Promise<void> {
		console.log(
			'========================================================================',
		);
		console.log('[ENGINE] Starting Engine');
		console.log(
			'========================================================================',
		);

		await this.config.init();
		await this.macros.init();
		await Promise.all(
			Object.values(this.modules).map((inter) => inter.connect()),
		);
		console.log('[ENGINE] Starting User Interfaces');

		// Initialize Interfaces
		await this.servers.web.connect();
		await Promise.all(
			Object.values(this.interfaces.desk).map((inter) => inter.connect()),
		);
		await Promise.all(
			Object.values(this.interfaces.desk).map((inter) => inter.setup()),
		);

		console.log(
			'========================================================================',
		);
		console.log('[ENGINE] DONE LOADING...');
		console.log(
			'========================================================================',
		);
	}
}
