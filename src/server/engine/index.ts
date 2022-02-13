import { Express } from 'express';

import {
	IModules,
	AtemModule,
	ObsModule,
	SleepModule,
	TextgenModule,
	AudioModule,
	SystemStateModule,
} from '../modules';
import { DeskWebInterface } from '../interfaces/desk/web';
import { DeskTallyInterface } from '../interfaces/desk/tally';

import { ConfigBackend } from './config';
import { MacroEngine } from './macros';
import { MicroWebsocketServer } from './websocket-server';

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
	server: MicroWebsocketServer;

	constructor(app: Express) {
		this.config = new ConfigBackend(
			process.env.SETTINGS_PATH ? process.env.SETTINGS_PATH : './config',
			process.env.SHOWDATA_PATH
				? process.env.SHOWDATA_PATH
				: './config/flashdrives',
		);

		this.server = new MicroWebsocketServer(app);

		this.modules = {
			atem: new AtemModule(this.config, this.server),
			obs: new ObsModule(this.config, this.server),
			sleep: new SleepModule(this.config),
			text: new TextgenModule(this.config, this.server),
			audio: new AudioModule(this.config, this.server),
			status: new SystemStateModule(this.config, this.server),
		};

		this.macros = new MacroEngine(this.config, this.modules, this.server);

		this.interfaces = {
			desk: {
				web: new DeskWebInterface(
					this.config,
					this.modules,
					this.macros,
					this.server,
				),
				tally: new DeskTallyInterface(
					this.config,
					this.modules,
					this.macros,
					this.server,
				),
			},
		};

		this.modules.status.registerStateModule('atem', this.modules.atem);
		this.modules.status.registerStateModule('text', this.modules.text);
		this.modules.status.registerStateModule('obs', this.modules.obs);
		this.modules.status.registerStateModule(
			'tally',
			this.interfaces.desk.tally,
		);
		this.modules.status.registerStateModule(
			'serial',
			this.interfaces.desk.web.getKeyboardModule().getSerialInterface(),
		);
	}

	public stop(): void {
		console.log('[ENGINE] Stopping Engine');
		this.server.stop();
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
		Object.values(this.modules).map((inter) => inter.connect());
		console.log('=== [ENGINE] Starting User Interfaces');

		// Initialize Interfaces
		await this.server.start();
		await Promise.all(
			Object.values(this.interfaces.desk).map((inter) => inter.connect()),
		);
		await Promise.all(
			Object.values(this.interfaces.desk).map((inter) => inter.setup()),
		);

		console.log(
			'========================================================================',
		);
		console.log('[ENGINE] Startup Finished...');
		console.log(
			'========================================================================',
		);
	}
}
