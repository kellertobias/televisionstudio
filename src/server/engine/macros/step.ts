import { MacroAction, MacroActionDefinition } from './action';
import promiseChain from '../../helpers/promise-serial';
import { Macro } from './macro';
import colors from 'colors';

type tTrigger = 'GO' | number;

export interface MacroStepDefinition {
	stepNumber: number;
	name: string;
	duration: number;
	trigger: tTrigger;
	actions: MacroActionDefinition[];
}

export class MacroStep {
	name: string;
	stepNumber: number;
	running: boolean = false;
	done: boolean = false;
	duration: number;
	started: Date | undefined = undefined;
	triggerAt: Date | undefined = undefined;
	cancelled: boolean = false;
	trigger: tTrigger;
	actions: MacroAction[];
	macro: Macro;

	onCancel?: () => void;

	prev?: MacroStep;

	private triggerTimeout: NodeJS.Timeout | undefined = undefined;

	constructor(
		stepNumber: number,
		name: string,
		duration: number,
		trigger: tTrigger,
		actions: MacroActionDefinition[],
		macro: Macro,
	) {
		this.name = name;
		this.stepNumber = stepNumber;
		this.trigger = trigger;
		this.macro = macro;

		this.actions = actions.map((action) => {
			return new MacroAction(
				action.mod,
				action.modName,
				action.path,
				action.params,
				this,
			);
		});

		const actionDuration = this.actions.reduce(
			(sum, action) => sum + action.getDuration(),
			0,
		);
		this.duration = Math.max(duration, actionDuration);
	}

	async destroy() {
		this.reset();
		//@ts-ignore
		this.macro = null;
		//@ts-ignore
		this.prev = null;
		//@ts-ignore
		this.actions = [];
		//@ts-ignore
		this.onCancel = null;
	}

	reset() {
		const cancelled = this.onCancel !== undefined ? true : false;
		if (this.onCancel) {
			this.onCancel();
		}

		if (this.running) {
			console.log(
				colors.yellow(
					`[STEP] ${this.macro.executor} STEP ${this.stepNumber} CANCELLING ACTIONS`,
				),
			);
			this.actions.forEach((action) => action.cancel());
		}

		this.started = undefined;
		this.triggerAt = undefined;
		this.running = false;
		this.done = false;

		if (this.triggerTimeout !== undefined) {
			clearTimeout(this.triggerTimeout);
		}

		return Promise.resolve(cancelled);
	}

	getExecuter() {
		this.running = true;
		this.done = false;
		this.started = new Date();
		return () => {
			return promiseChain(
				false,
				this.actions.map((action, index) => {
					return (cancelled) => action.execute(cancelled);
				}),
			).then((_cancelled: boolean) => {
				this.running = false;
				this.cancelled = false;
				this.done = true;
				this.started = undefined;

				return Promise.resolve(() => {
					this.started = undefined;
					this.triggerAt = undefined;
					this.running = false;
					this.done = false;
				});
			});
		};
	}

	getTrigger(isManual: boolean): false | (() => Promise<boolean>) {
		if (this.done) {
			console.log('>>> Step was already done. Cannot trigger');
			return false;
		}

		if (this.trigger == 'GO' && !isManual) {
			return false;
		}

		if (this.trigger == 'GO' || isManual) {
			return () => Promise.resolve(false);
		}

		if (this.triggerAt) {
			console.log('>>> Step was already triggered. Cannot trigger again.');
			return false;
		}

		if (this.triggerTimeout !== undefined) {
			console.log('>>> Timeout already exists, aborting');
			return false;
		}

		const triggerTime = this.trigger;

		this.triggerAt = new Date(new Date().getTime() + 1000 * this.trigger);

		return () => {
			return new Promise<boolean>((resolve, _reject) => {
				this.onCancel = () => {
					if (this.triggerTimeout != undefined) {
						clearTimeout(this.triggerTimeout);
						this.triggerTimeout = undefined;
					}
					resolve(true);
				};

				this.triggerTimeout = setTimeout(() => {
					return resolve(false);
				}, triggerTime * 1000);
			}).then((cancelled) => {
				if (this.triggerTimeout != undefined) {
					clearTimeout(this.triggerTimeout);
					this.triggerTimeout = undefined;
				}
				if (this.onCancel && cancelled) {
					console.log(
						colors.yellow(
							`[STEP] ${this.macro.executor} STEP ${this.stepNumber} TRIGGER-TIMER CANCELLED`,
						),
					);
				}
				this.onCancel = undefined;

				return Promise.resolve(cancelled);
			});
		};
	}
}
