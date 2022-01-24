import colors from 'colors';

import promiseChain from '../../../shared/promise-serial';

import type { Macro } from './macro';
import { MacroAction, MacroActionDefinition } from './action';

type TTrigger = 'GO' | number;

export interface MacroStepDefinition {
	stepNumber: number;
	name: string;
	duration: number;
	trigger: TTrigger;
	actions: MacroActionDefinition[];
}

export class MacroStep {
	name: string;
	stepNumber: number;
	running = false;
	done = false;
	duration: number;
	started: Date | undefined = undefined;
	triggerAt: Date | undefined = undefined;
	cancelled = false;
	trigger: TTrigger;
	actions: MacroAction[];
	macro: Macro;

	onCancel?: () => void;

	prev?: MacroStep;

	private triggerTimeout: NodeJS.Timeout | undefined = undefined;

	constructor(
		stepNumber: number,
		name: string,
		duration: number,
		trigger: TTrigger,
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

	public async destroy(): Promise<void> {
		this.reset();

		this.macro = null;
		this.prev = null;
		this.actions = [];
		this.onCancel = null;
	}

	public reset(): Promise<boolean> {
		const cancelled = this.onCancel !== undefined;
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

	public async getExecutor(): Promise<() => Promise<() => void>> {
		this.running = true;
		this.done = false;
		this.started = new Date();
		return async () => {
			await promiseChain(
				false,
				this.actions.map((action) => {
					return (cancelled) => action.execute(cancelled);
				}),
			);
			this.running = false;
			this.cancelled = false;
			this.done = true;
			this.started = undefined;

			return () => {
				this.started = undefined;
				this.triggerAt = undefined;
				this.running = false;
				this.done = false;
			};
		};
	}

	public getTrigger(isManual: boolean): false | (() => Promise<boolean>) {
		if (this.done) {
			console.log('>>> Step was already done. Cannot trigger');
			return false;
		}

		if (this.trigger === 'GO' && !isManual) {
			return false;
		}

		if (this.trigger === 'GO' || isManual) {
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

		this.triggerAt = new Date(Date.now() + 1000 * this.trigger);

		return async () => {
			const cancelled = await new Promise<boolean>((resolve) => {
				this.onCancel = () => {
					if (this.triggerTimeout !== undefined) {
						clearTimeout(this.triggerTimeout);
						this.triggerTimeout = undefined;
					}
					resolve(true);
				};

				this.triggerTimeout = setTimeout(() => {
					return resolve(false);
				}, triggerTime * 1000);
			});

			if (this.triggerTimeout !== undefined) {
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
			return cancelled;
		};
	}
}
