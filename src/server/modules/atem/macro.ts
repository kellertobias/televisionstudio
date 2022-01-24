import { AtemState, Commands, Enums } from 'atem-connection';
import { AtemSubModule } from './_sub';
import arrayEquals from '/server/backend/helpers/array-equals';

interface AtemMacro {
	name: string;
	index: number;
	running: boolean;
	waiting: boolean;
}

export class AtemModuleMacro extends AtemSubModule {
	current: AtemMacro[] = [];
	setup(): Promise<void> {
		return Promise.resolve();
	}

	update(status: AtemState, pathToChange: string[]): Promise<void> {
		const macros = status.macro.macroProperties;
		const macroPlayer = status.macro.macroPlayer;
		const runningIndex = macroPlayer.macroIndex;

		const nextState: AtemMacro[] = [];

		macros.forEach((macro, i) => {
			if (!macro?.isUsed) return null;
			const macroOut: AtemMacro = {
				name: macro?.name,
				index: i,
				running: i == runningIndex && macroPlayer.isRunning,
				waiting: i == runningIndex && macroPlayer.isWaiting,
			};

			nextState.push(macroOut);
		});
		const current = this.current;
		this.current = nextState;
		if (!arrayEquals(nextState, current)) {
			this.parent.runEventHandlers('macro', { macros: nextState });
		}

		return Promise.resolve();
	}

	onChange(handler: (param: { macros: AtemMacro[] }) => void) {
		this.parent.registerEventHandler('macro', handler);
	}

	_exec = async (
		params: { macro: number } | number,
		type: Enums.MacroAction,
	) => {
		const { macro } = typeof params == 'object' ? params : { macro: params };
		const c = new Commands.MacroActionCommand(macro, type);
		return this.client.sendCommand(c);
	};

	run = async (params: { macro: number } | number) => {
		return this._exec(params, Enums.MacroAction.Run);
	};

	go = async (params: { macro: number } | number) => {
		return this._exec(params, Enums.MacroAction.Continue);
	};

	stop = async (params: { macro: number } | number) => {
		return this._exec(params, Enums.MacroAction.Stop);
	};
}
