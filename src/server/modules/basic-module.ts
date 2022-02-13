import { ConfigBackend } from '../engine/config';
import { Observable } from '../../shared/observable';
import { MicroWebsocketServer } from '../engine/websocket-server';

export abstract class BasicModule extends Observable {
	protected config: ConfigBackend;
	abstract connected: boolean;
	protected ws: MicroWebsocketServer;
	public moduleError = 'DISCONNECT';
	constructor(config: ConfigBackend, ws?: MicroWebsocketServer) {
		super();
		this.ws = ws;
		this.config = config;
	}

	/**
	 * Connect this Module to its Service
	 */
	abstract connect(): Promise<void>;
	abstract readonly defaultAction: string[];

	public setModuleError(error: string | null): void {
		this.moduleError = error;
	}
}
