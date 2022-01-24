import colors from 'colors';

import { AnyModule } from '../../modules';

import { MacroStep } from './step';

type TMacroActionParams =
	| { [key: string]: number | boolean | string | null }
	| number
	| boolean
	| string
	| null;

export interface MacroActionDefinition {
	mod: AnyModule;
	modName: string;
	path: string[];
	params: TMacroActionParams;
}

export class MacroAction {
	mod: any;
	modName: string;
	path: string[];
	actionName: string;
	params: TMacroActionParams;
	step: MacroStep;
	execute: (cancelled: boolean) => Promise<boolean>;
	fn: (...args: any) => Promise<void>;
	onCancel?: (...args: any) => void;
	cancelled = false;

	constructor(
		mod: AnyModule,
		modName: string,
		path: string[],
		params: TMacroActionParams,
		step: MacroStep,
	) {
		this.mod = mod;
		this.modName = modName;
		this.path = path;
		this.params = params;
		this.step = step;
		this.actionName = `${this.modName}::${this.path.join('::')}`;

		let fn = this.mod;
		for (const pathPart of this.path) {
			if (fn === undefined) {
				throw new Error(
					`[MACROS] ${this.actionName} - Step Action Path did not resolve to a Module`,
				);
			}
			fn = fn[pathPart];
		}

		this.fn = fn;

		this.execute = this._execute.bind(this);
	}

	getDuration() {
		if (this.modName == 'sleep' && this.path[0] == 'wait') {
			return this.params as number;
		}
		return 0;
	}

	cancel() {
		if (this.onCancel) {
			this.cancelled = true;
			this.onCancel(true);
			this.onCancel = undefined;
		}
	}

	_execute(cancelled: boolean) {
		if (cancelled) {
			return Promise.resolve(true);
		}

		return new Promise<boolean>((resolve) => {
			const resolved = false;
			this.fn(this.params)
				.catch((error) => {
					console.log(
						colors.red.bold(
							`[MACRO] EXEC ${this.step.macro.executor}:${
								this.step.stepNumber
							} ERROR IN ACTION ${
								this.actionName
							} \n        PARAMS: ${JSON.stringify(
								this.params,
							)}\n        ${String(error)}\n`,
						),
					);
					Promise.reject(`Macro Exec Error: ${String(error)}`);
					return Promise.resolve();
				})
				.then(() => {
					if (!resolved) {
						resolve(cancelled || this.cancelled);
					}
					this.cancelled = false;
				});

			this.onCancel = () => {
				if (!resolved) {
					resolve(cancelled || this.cancelled);
				}
				this.cancelled = false;
			};
		}).then();
	}
}
