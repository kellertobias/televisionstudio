import { Express } from 'express';

import { MicroWebsocketServer } from '../engine/websocket-server';
import { MacroEngine } from '../engine/macros';
import { ConfigBackend } from '../engine/config';
import { IModules } from '../modules';

import { BasicInterface } from './basic-interface';

export class WebApi extends BasicInterface {
	public server: MicroWebsocketServer;
	constructor(
		config: ConfigBackend,
		modules: IModules,
		macros: MacroEngine,
		app: Express,
	) {
		super(config, modules, macros);
		this.server = new MicroWebsocketServer(app);
	}

	connect(): Promise<void> {
		this.server.start();
		return Promise.resolve();
	}
	shutdown(): Promise<void> {
		this.server.stop();
		return Promise.resolve();
	}
	setup(): Promise<void> {
		return Promise.resolve();
	}
}
