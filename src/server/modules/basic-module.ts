import { ConfigBackend } from '../engine/config';
import { Observable } from '../helpers/observable';

export abstract class BasicModule extends Observable {
	config: ConfigBackend;
	constructor(config: ConfigBackend) {
		super();
		this.config = config;
	}
	abstract connect(): Promise<void>;
	abstract connected: boolean;
	abstract defaultAction: string[];
}
