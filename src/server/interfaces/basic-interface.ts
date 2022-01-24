import { ConfigBackend } from '../engine/config';
import { MacroEngine } from '../engine/macros';
import { Observable } from '../../shared/observable';
import { IModules } from '../modules';

export abstract class BasicInterface extends Observable {
	modules: IModules;
	macros: MacroEngine;

	constructor(config: ConfigBackend, modules: IModules, macros: MacroEngine) {
		super();
		this.modules = modules;
		this.macros = macros;
	}

	abstract connect(): Promise<void>;
	abstract shutdown(): Promise<void>;
	abstract setup(): Promise<void>;
}
