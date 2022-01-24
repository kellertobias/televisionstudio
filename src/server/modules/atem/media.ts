import { AtemState, Commands, Enums } from 'atem-connection';

import { AtemSubModule } from './_sub';

export class AtemModuleMedia extends AtemSubModule {
	public current: {
		[key: string]: number | undefined;
	} = {
		player1: -1,
		player2: -1,
	};

	public setup(): Promise<void> {
		return Promise.resolve();
	}
	public update(status: AtemState): Promise<void> {
		const { players } = status.media;
		if (!players) {
			this.parent.raiseError('No Media Players in last Message');
			return Promise.resolve();
		}
		const next = {
			player1: players[0]?.stillIndex,
			player2: players[1]?.stillIndex,
		};
		const { current } = this;
		this.current = next;

		if (current.player1 !== next.player1 || current.player2 !== next.player2) {
			this.parent.runEventHandlers('media', { ...next });
		}

		return Promise.resolve();
	}

	public onChange(
		handler: (param: { player1: number; player2: number }) => void,
	): void {
		this.parent.registerEventHandler('media', handler);
	}

	public load = async (params: {
		player: number;
		media: number;
	}): Promise<void> => {
		const { player, media } = params;
		const c = new Commands.MediaPlayerSourceCommand(player);
		c.updateProps({
			stillIndex: media,
			sourceType: Enums.MediaSourceType.Still,
		});
		return this.client.sendCommand(c);
	};
}
