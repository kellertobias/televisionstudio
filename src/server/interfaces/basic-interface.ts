import { ConfigBackend } from '../engine/config';
import { MacroEngine } from '../engine/macros';
import { Observable } from '../../shared/observable';
import { IModules } from '../modules';
import { MicroWebsocketServer } from '../engine/websocket-server';

export abstract class BasicInterface extends Observable {
	modules: IModules;
	macros: MacroEngine;
	protected ws: MicroWebsocketServer;

	constructor(
		config: ConfigBackend,
		modules: IModules,
		macros: MacroEngine,
		ws: MicroWebsocketServer,
	) {
		super();
		this.ws = ws;
		this.modules = modules;
		this.macros = macros;
	}

	abstract connect(): Promise<void>;
	abstract shutdown(): Promise<void>;
	abstract setup(): Promise<void>;
}
