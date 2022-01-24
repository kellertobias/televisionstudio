import { ConfigBackend } from './config';
import { MacroEngine, MacroStore } from './macros';
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

	stop() {
		console.log('[ENGINE] Stopping Engine');
		this.servers.web.shutdown();
		Object.values(this.interfaces.desk).forEach((inter) => inter.shutdown());
	}

	start() {
		console.log(
			'========================================================================',
		);
		console.log('[ENGINE] Starting Engine');
		console.log(
			'========================================================================',
		);

		Promise.resolve()
			.then(() => {
				return this.config.init();
			})
			.then(() => {
				return this.macros.init();
			})
			.then(() => {
				Object.values(this.modules).forEach((inter) => inter.connect());
			})
			.then(() => {
				console.log('[ENGINE] Starting User Interfaces');
				//Initialize Interfaces
				this.servers.web.connect();
			})
			.then(() => {
				Object.values(this.interfaces.desk).forEach((inter) => inter.connect());
			})
			.then(() => {
				Object.values(this.interfaces.desk).forEach((inter) => inter.setup());
			})
			.then(() => {
				console.log(
					'========================================================================',
				);
				console.log('[ENGINE] DONE LOADING...');
				console.log(
					'========================================================================',
				);
			});
	}
}
