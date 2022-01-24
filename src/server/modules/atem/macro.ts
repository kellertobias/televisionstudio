import { AtemState, Commands, Enums } from 'atem-connection';

import arrayEquals from '@/shared/array-equals';

import { AtemSubModule } from './_sub';

interface AtemMacro {
	name: string;
	index: number;
	running: boolean;
	waiting: boolean;
}

export class AtemModuleMacro extends AtemSubModule {
	public current: AtemMacro[] = [];
	public setup(): Promise<void> {
		return Promise.resolve();
	}

	public update(status: AtemState): Promise<void> {
		const macros = status.macro.macroProperties;
		const { macroPlayer } = status.macro;
		const runningIndex = macroPlayer.macroIndex;

		const nextState: AtemMacro[] = [];

		macros.forEach((macro, i) => {
			if (!macro?.isUsed) {
				return null;
			}
			const macroOut: AtemMacro = {
				name: macro?.name,
				index: i,
				running: i === runningIndex && macroPlayer.isRunning,
				waiting: i === runningIndex && macroPlayer.isWaiting,
			};

			nextState.push(macroOut);
		});
		const { current } = this;
		this.current = nextState;
		if (!arrayEquals(nextState, current)) {
			this.parent.runEventHandlers('macro', { macros: nextState });
		}

		return Promise.resolve();
	}

	public onChange(handler: (param: { macros: AtemMacro[] }) => void): void {
		this.parent.registerEventHandler('macro', handler);
	}

	private exec = async (
		params: { macro: number } | number,
		type: Enums.MacroAction,
	) => {
		const { macro } = typeof params === 'object' ? params : { macro: params };
		const c = new Commands.MacroActionCommand(macro, type);
		return this.client.sendCommand(c);
	};

	public run = async (params: { macro: number } | number): Promise<void> => {
		return this.exec(params, Enums.MacroAction.Run);
	};

	public go = async (params: { macro: number } | number): Promise<void> => {
		return this.exec(params, Enums.MacroAction.Continue);
	};

	public stop = async (params: { macro: number } | number): Promise<void> => {
		return this.exec(params, Enums.MacroAction.Stop);
	};
}
