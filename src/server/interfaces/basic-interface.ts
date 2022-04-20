import { Observable } from '../../shared/observable';
import { ConfigBackend } from '../engine/config';
import { MacroEngine } from '../engine/macros';
import { MicroWebsocketServer } from '../engine/websocket-server';
import { IModules } from '../modules';

export abstract class BasicInterface extends Observable {
	modules: IModules;
	macros: MacroEngine;
	protected ws: MicroWebsocketServer;
	public moduleError: string | null = 'DISCONNECT';

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

	public setModuleError(error: string | null): void {
		this.moduleError = error;
	}
	abstract connect(): Promise<void>;
	abstract shutdown(): Promise<void>;
	abstract setup(): Promise<void>;
}
