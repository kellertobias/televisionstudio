import colors from 'colors';

import { sleep } from '@/shared/helpers';

import { MacroStep, MacroStepDefinition } from './step';

export class Macro {
	name?: string;
	currentStepNumber = 0; // 0=Not started, 1 = First Index
	currentTriggeredStepNumber = 0;
	currentStep?: MacroStep;
	loop: boolean;
	steps: MacroStep[];
	index = -1;
	executor: [number, number] = [0, 0];
	isMaster = false;
	running = false;
	waiting = false;

	earliestStepRunning = 0;
	latestStepRunning = 0;

	runningSteps: { [key: string]: 'trig' | 'run' } = {};

	private updateHandlers: ((...params: unknown[]) => void)[] = [];

	constructor(name: string, loop: boolean, steps: MacroStepDefinition[]) {
		this.name = name;
		this.loop = loop;

		this.steps = steps.map((step) => {
			return new MacroStep(
				step.stepNumber,
				step.name,
				step.duration,
				step.trigger,
				step.actions,
				this,
			);
		});
		let prevStep = loop ? this.steps[this.steps.length - 1] : undefined;
		this.steps.forEach((step) => {
			step.prev = prevStep;
			prevStep = step;
		});
	}

	public async destroy(): Promise<void> {
		const cancelled = await Promise.all(
			this.steps.map((step) => step.destroy()),
		);

		if (cancelled.some((x) => x)) {
			await sleep(20);
		}

		this.steps = [];
		this.executeUpdate();
		this.currentStep = null;
		this.isMaster = false;

		this.updateHandlers = [];
	}

	public onUpdate(handler: (macro: Macro) => void): void {
		this.updateHandlers.push(handler);
	}

	public executeUpdate(str?: string): void {
		if (str) {
			console.log(str);
		}
		this.updateHandlers.forEach((handler) => {
			handler(this);
		});
	}

	public setMaster(isMaster: boolean): void {
		this.isMaster = isMaster;
	}

	public async reset(): Promise<void> {
		console.log('[MACRO] RESET');
		this.currentStepNumber = 0;
		this.currentStep = undefined;
		await Promise.all(this.steps.map((step) => step.reset()));
		this.executeUpdate('RESET');
	}

	private getStep(stepNumber: number) {
		return this.steps[(stepNumber - 1) % this.steps.length];
	}

	updateMacroState(): void {
		this.running = this.steps.some((step) => step.running);
		this.waiting =
			!this.running && this.steps.some((step) => step.triggerAt !== undefined);

		const stepIndexes = Object.keys(this.runningSteps);
		const fallBackIndex = 0;
		if (stepIndexes.length > 0) {
			this.earliestStepRunning = 999999;
			this.latestStepRunning = 0;

			for (const stepIndexStr of stepIndexes) {
				const stepIndex = Number.parseInt(stepIndexStr, 10);

				if (stepIndex <= this.earliestStepRunning) {
					this.earliestStepRunning = stepIndex;
				}
				if (stepIndex >= this.latestStepRunning) {
					this.latestStepRunning = stepIndex;
				}
			}
			if (this.earliestStepRunning === 999999) {
				this.earliestStepRunning = Math.max(fallBackIndex, 0);
			}
			if (this.latestStepRunning === 999999) {
				this.latestStepRunning = Math.max(fallBackIndex, 0);
			}
		}
	}

	private async cancelRunningIfManual(isManual: boolean) {
		if (isManual) {
			const cancelStepsPromise: Promise<boolean>[] = this.steps.map((step) =>
				step.reset(),
			);
			const cancelled = await Promise.all(cancelStepsPromise);
			if (cancelled.some((x) => x)) {
				return sleep(20);
			}
		}
	}

	async execute(
		stepNumber: number,
		isManual: boolean,
	): Promise<false | number> {
		// Check if this step exists
		const triggerStepNumber = stepNumber;
		if (stepNumber > this.steps.length && !this.loop) {
			if (isManual) {
				throw new Error(`No Such Step: ${stepNumber} / ${this.steps.length}`);
			} else {
				return Promise.resolve(false);
			}
		}

		// If we execute manually, we abort all running steps
		this.cancelRunningIfManual(isManual);

		// Get the Step to execute
		const stepCandidate = this.getStep(triggerStepNumber);

		// Get the Trigger timer
		const willTrigger = stepCandidate.getTrigger(isManual);
		if (!willTrigger) {
			// If there is no trigger, we are manual, but the step is timed or the step is done or running.
			return Promise.resolve(false);
		}
		const triggerTimer: () => Promise<boolean> = willTrigger;

		console.log(
			colors.green(
				`[MACRO] ${isManual ? 'MAN-' : 'FOL-'}EXEC ${this.executor}: - STEP ${
					this.currentStepNumber
				} => ${triggerStepNumber}`,
			),
		);

		// Update before Starting the Trigger. Time is already set.
		this.executeUpdate();

		// Now that we will trigger, we set the last triggered step number to the current step.
		this.currentTriggeredStepNumber = triggerStepNumber;
		this.runningSteps[`${triggerStepNumber}`] = 'trig';
		const cancelled = await triggerTimer();

		if (cancelled) {
			console.log(
				colors.yellow.bold(
					`[MACRO] ${isManual ? 'MAN-' : 'FOL-'}EXEC ${
						this.executor
					}: - STEP ${triggerStepNumber} GOT CANCELLED`,
				),
			);
			this.executeUpdate();
			return Promise.resolve<false>(false);
		}

		this.updateMacroState();

		// We will now execute the step, therefor the current step number
		// is now the step we are about to execute.
		this.currentStepNumber = triggerStepNumber;
		this.currentStep = stepCandidate;

		// this updates the step internally and allows us to set stuff on the outside
		console.log(
			colors.green.bold(
				`[MACRO] ${isManual ? 'MAN-' : 'FOL-'} RUN ${this.executor}: - STEP ${
					this.currentStepNumber
				} => ${triggerStepNumber}`,
			),
		);
		const execute = await stepCandidate.getExecutor();
		this.runningSteps[`${triggerStepNumber}`] = 'run';
		this.updateMacroState();

		// We are about to trigger the step, update UI
		this.executeUpdate();
		const resetFinishedStep = await execute();
		console.log(
			colors.cyan.bold(
				`[MACRO]     DONE ${this.executor}: - STEP ${triggerStepNumber} - IS ON ${this.currentStepNumber}`,
			),
		);

		delete this.runningSteps[`${triggerStepNumber}`];
		this.updateMacroState();

		if (
			!this.currentStep?.running &&
			this.currentTriggeredStepNumber > this.currentStepNumber
		) {
			this.currentStepNumber = this.currentTriggeredStepNumber;
			this.currentStep = this.getStep(this.currentTriggeredStepNumber);
		}

		// Now update the UI
		this.executeUpdate();

		// Now set the step to be finished
		resetFinishedStep();
		this.updateMacroState();

		return Promise.resolve<number>(stepNumber + 1);
	}

	public async go(
		isManual: boolean | undefined,
		specificStepNumber?: number,
	): Promise<void> {
		if (isManual === undefined) {
			isManual = true;
		}
		// Check if we have steps at all
		if (this.steps.length === 0) {
			throw new Error('Cannot GO empty Macros');
		}
		const triggerStepNumber =
			specificStepNumber !== undefined
				? specificStepNumber
				: this.currentStepNumber + 1;

		const nextStep = await this.execute(triggerStepNumber, isManual);

		if (nextStep === false) {
			console.log(
				colors.grey(
					`[MACRO] END OF AUTOMATIC EXECUTION GO SECTION: ${this.executor}`,
				),
			);
			return;
		}
		this.go(false, nextStep);
	}
}
