import { AtemState, Commands } from 'atem-connection';

import { AtemSubModule } from './_sub';

type AtemDskName = 'dsk1' | 'dsk2' | 'dsk3' | 'dsk4';
interface AtemDskState {
	onair: boolean;
	running: boolean;
	tie: boolean;
	rate: number;
	defined: true;
}
type AtemDskStateOrUndefined =
	| AtemDskState
	| {
			defined: boolean;
	  };

export class AtemModuleDsk extends AtemSubModule {
	current: {
		[key in AtemDskName]: AtemDskStateOrUndefined;
	} = {
		dsk1: { defined: false },
		dsk2: { defined: false },
		dsk3: { defined: false },
		dsk4: { defined: false },
	};
	setup(): Promise<void> {
		return Promise.resolve();
	}

	update(status: AtemState): Promise<void> {
		const allDskStatus = status.video.downstreamKeyers;
		const dskNames: AtemDskName[] = Object.keys(this.current) as AtemDskName[];
		dskNames.forEach((key, i) => {
			const dskStatus = allDskStatus[i];
			const dskCandidate: AtemDskStateOrUndefined = this.current[key];

			const dsk: AtemDskState = dskCandidate as AtemDskState;
			if (!dskStatus) {
				if (dsk.defined) {
					console.log('[ATEM] Error DSK was not set');
					throw new Error('DSK is defined, but not set in status message');
				}
				return;
			}
			const nextDsk: AtemDskState = {
				defined: true,
				onair: dskStatus.onAir,
				running: dskStatus.inTransition,
				tie: dskStatus.properties?.tie || false,
				rate: dskStatus.properties?.rate || 1,
			};

			this.current[key] = nextDsk;

			if (
				dsk.onair !== nextDsk.onair ||
				dsk.running !== nextDsk.running ||
				dsk.tie !== nextDsk.tie
			) {
				const answer = {
					dsk: key,
					onair: nextDsk.onair,
					running: nextDsk.running,
					tie: nextDsk.tie,
				};

				this.parent.runEventHandlers('dsk-status', answer);
			}

			if (dsk.rate !== nextDsk.rate) {
				this.parent.runEventHandlers('dsk-rate', {
					dsk: key,
					rate: nextDsk.rate,
				});
			}
		});

		return Promise.resolve();
	}

	public onRate(
		handler: (param: {
			dsk: 'dsk1' | 'dsk2' | 'dsk3' | 'dsk4';
			rate: number;
		}) => void,
	): void {
		this.parent.registerEventHandler('dsk-rate', handler);
	}

	public onState(
		handler: (param: {
			dsk: string;
			running: boolean;
			onair: boolean;
			tie: boolean;
		}) => void,
	): void {
		this.parent.registerEventHandler('dsk-status', handler);
	}

	public tie = async (params: {
		dsk: number;
		enable?: boolean;
	}): Promise<void> => {
		const { dsk } = params;
		let { enable } = params;
		if (enable === undefined) {
			const dskKey: AtemDskName = `dsk${dsk}` as AtemDskName;
			enable = !(this.current[dskKey] as AtemDskState).tie;
		}

		const c = new Commands.DownstreamKeyTieCommand(dsk - 1, enable);
		return this.client.sendCommand(c);
	};

	public onair = async (params: {
		dsk: number;
		enable?: boolean;
	}): Promise<void> => {
		const { dsk } = params;
		let { enable } = params;
		if (enable === undefined) {
			const dskKey: AtemDskName = `dsk${dsk}` as AtemDskName;
			enable = !(this.current[dskKey] as AtemDskState).onair;
		}
		const c = new Commands.DownstreamKeyOnAirCommand(dsk - 1, enable);
		return this.client.sendCommand(c);
	};

	public rate = async (params: {
		dsk: number;
		rate: number;
	}): Promise<void> => {
		const { dsk, rate } = params;
		const c = new Commands.DownstreamKeyRateCommand(dsk - 1, rate);
		return this.client.sendCommand(c);
	};

	public auto = async (params: { dsk: number } | number): Promise<void> => {
		const { dsk } = typeof params === 'object' ? params : { dsk: params };
		console.log('DSK AUTO', dsk);
		const c = new Commands.DownstreamKeyAutoCommand(dsk - 1);
		return this.client.sendCommand(c);
	};
}
