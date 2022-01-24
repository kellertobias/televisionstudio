import { ConfigBackend } from '../engine/config';
import { Observable } from '../../shared/observable';

export abstract class BasicModule extends Observable {
	protected config: ConfigBackend;
	abstract connected: boolean;
	constructor(config: ConfigBackend) {
		super();
		this.config = config;
	}

	/**
	 * Connect this Module to its Service
	 */
	abstract connect(): Promise<void>;
	abstract readonly defaultAction: string[];
}
