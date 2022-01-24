import { AtemState, Commands } from 'atem-connection';

import { AUXBUS, ME, STYLES } from './constants';
import { TransitionTies } from './usk';
import { AtemSubModule } from './_sub';

export class AtemModuleMixer extends AtemSubModule {
	public current = {
		style: 'mix',
		pgm: 'VOID',
		pvw: 'VOID',
		aux: 'VOID',
		black: false,
		blackAuto: false,
		transPrv: false,
		transPos: 0,
		transRun: false,
		transRate: 0,
	};

	private calcSelection(ties: TransitionTies) {
		const { bg, usk1, usk2, usk3, usk4 } = ties;
		let nextSelection = 0;
		if (bg) {
			nextSelection += 1;
		}
		if (usk1) {
			nextSelection += 2;
		}
		if (usk2) {
			nextSelection += 4;
		}
		if (usk3) {
			nextSelection += 8;
		}
		if (usk4) {
			nextSelection += 16;
		}

		return nextSelection;
	}

	public setup = (): Promise<void> => {
		return Promise.resolve();
	};

	public update = (status: AtemState): Promise<void> => {
		const { video } = status;
		const me = video.mixEffects[0];
		if (!me) {
			this.parent.raiseError('No Video Mixer Status in last Message');
			return Promise.resolve();
		}

		const pgm = this.parent.getSourceName(me.programInput || 0);
		const pvw = this.parent.getSourceName(me.previewInput || 0);
		const aux = this.parent.getSourceName(video.auxilliaries[0] || 0);
		const transPrv = me.transitionPreview || false;
		const transPos = me.transitionPosition.handlePosition || 0;
		const transRun = me.transitionPosition.inTransition || false;
		const style = this.parent.getStyleName(me.transitionProperties.style);
		let transRate = 0;

		if (style === 'DVE') {
			const transition = me.transitionSettings.DVE;
			if (transition) {
				transRate = transition.rate;
			}
		} else if (style === 'dip') {
			const transition = me.transitionSettings.dip;
			if (transition) {
				transRate = transition.rate;
			}
		} else if (style === 'wipe') {
			const transition = me.transitionSettings.wipe;
			if (transition) {
				transRate = transition.rate;
			}
		} else if (style === 'stinger') {
			const transition = me.transitionSettings.stinger;
			if (transition) {
				transRate = transition.mixRate;
			}
		} else if (style === 'mix') {
			const transition = me.transitionSettings.mix;
			if (transition) {
				transRate = transition.rate;
			}
		}

		const black = me.fadeToBlack?.isFullyBlack || false;
		const blackAuto = me.fadeToBlack?.inTransition || false;

		const next = {
			pgm,
			pvw,
			aux,
			transPrv,
			transPos,
			transRun,
			style,
			transRate,
			black,
			blackAuto,
		};
		const { current } = this;
		this.current = next;
		if (current.pgm !== pgm || current.pvw !== pvw) {
			this.parent.runEventHandlers('live', { pgm, pvw });
		}

		if (current.aux !== aux) {
			this.parent.runEventHandlers('aux', { aux });
		}

		if (current.transPos !== transPos) {
			this.parent.runEventHandlers('trans-pos', { pos: transPos });
		}

		if (current.transRun !== transRun) {
			this.parent.runEventHandlers('trans-running', { running: transRun });
		}

		if (current.style !== style || current.transPrv !== transPrv) {
			this.parent.runEventHandlers('trans-settings', {
				style,
				preview: transPrv,
			});
		}

		if (current.transRate !== transRate) {
			this.parent.runEventHandlers('trans-rate', { rate: transRate });
		}

		if (current.black !== black || current.blackAuto !== blackAuto) {
			this.parent.runEventHandlers('black', { black, auto: blackAuto });
		}

		return Promise.resolve();
	};

	public onBlack(
		handler: (param: { black: boolean; auto: boolean }) => void,
	): void {
		this.parent.registerEventHandler('black', handler);
	}

	public onChange(
		handler: (param: { pgm: string; pvw: string }) => void,
	): void {
		this.parent.registerEventHandler('live', handler);
	}

	public onAuxChange(handler: (param: { aux: string }) => void): void {
		this.parent.registerEventHandler('aux', handler);
	}

	public onTransitionPosition(handler: (param: { pos: number }) => void): void {
		this.parent.registerEventHandler('trans-pos', handler);
	}

	public onTransitionRunning(
		handler: (param: { running: boolean }) => void,
	): void {
		this.parent.registerEventHandler('trans-running', handler);
	}

	public onTransitionRate(handler: (param: { rate: number }) => void): void {
		this.parent.registerEventHandler('trans-rate', handler);
	}

	public onTransitionSettings(
		handler: (param: { style: string; preview: boolean }) => void,
	): void {
		this.parent.registerEventHandler('trans-settings', handler);
	}

	public transitionStyle = async (
		style: string,
		ties: TransitionTies,
	): Promise<void> => {
		const selection = this.calcSelection(ties);
		const c = new Commands.TransitionPropertiesCommand(ME);
		c.updateProps({
			nextSelection: selection,
			nextStyle: STYLES[style],
		});
		return this.client.sendCommand(c);
	};

	public pgm = async (params: { input: string } | string): Promise<void> => {
		const { input } = typeof params === 'object' ? params : { input: params };

		const c = new Commands.ProgramInputCommand(
			ME,
			this.parent.getSourceNumber(input),
		);
		return this.client.sendCommand(c);
	};

	public prv = async (params: { input: string } | string): Promise<void> => {
		const { input } = typeof params === 'object' ? params : { input: params };

		const c = new Commands.PreviewInputCommand(
			ME,
			this.parent.getSourceNumber(input),
		);
		return this.client.sendCommand(c);
	};

	public aux = async (params: { input: string } | string): Promise<void> => {
		const { input } = typeof params === 'object' ? params : { input: params };

		const c = new Commands.AuxSourceCommand(
			AUXBUS,
			this.parent.getSourceNumber(input),
		);
		return this.client.sendCommand(c);
	};

	public auto = async (): Promise<void> => {
		const c = new Commands.AutoTransitionCommand(ME);
		return this.client.sendCommand(c);
	};

	public previewTrans = async (
		params?: { enabled: boolean } | boolean,
	): Promise<void> => {
		if (params === undefined) {
			// eslint-disable-next-line no-param-reassign
			params = !this.current.transPrv;
		}
		const { enabled } =
			typeof params === 'object' ? params : { enabled: params };
		const c = new Commands.PreviewTransitionCommand(ME, enabled);
		return this.client.sendCommand(c);
	};

	public type = async (
		params: { name: 'mix' | 'dip' | 'wipe' | 'DVE' } | string,
	): Promise<void> => {
		const { name } = typeof params === 'object' ? params : { name: params };

		this.transitionStyle(name, this.parent.usk.current.ties);
	};

	public pos = async (params: { pos: number } | number): Promise<void> => {
		const { pos } = typeof params === 'object' ? params : { pos: params };

		const c = new Commands.TransitionPositionCommand(ME, pos * 10000);
		this.client.sendCommand(c);
	};

	public rate = async (params: { frames: number } | number): Promise<void> => {
		const { frames } = typeof params === 'object' ? params : { frames: params };

		if (this.current.style === 'wipe') {
			const c = new Commands.TransitionWipeCommand(ME);
			c.updateProps({ rate: frames });
			return this.client.sendCommand(c);
		}
		if (this.current.style === 'dip') {
			const c = new Commands.TransitionDipCommand(ME);
			c.updateProps({ rate: frames });
			return this.client.sendCommand(c);
		}
		if (this.current.style === 'DVE') {
			const c = new Commands.TransitionDVECommand(ME);
			c.updateProps({ rate: frames });
			return this.client.sendCommand(c);
		}
		const c = new Commands.TransitionMixCommand(ME, frames);
		return this.client.sendCommand(c);
	};

	public black = async (): Promise<void> => {
		// const { enabled } = typeof params === 'object' ? params : { enabled: params };

		const c = new Commands.FadeToBlackAutoCommand(ME);
		return this.client.sendCommand(c);
	};

	public cut = async (): Promise<void> => {
		const c = new Commands.CutCommand(ME);
		return this.client.sendCommand(c);
	};
}
