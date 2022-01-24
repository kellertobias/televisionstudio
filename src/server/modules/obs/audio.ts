import { ObsSubModule } from './_sub';

export class ObsModuleAudio extends ObsSubModule {
	public setup(): Promise<void> {
		return Promise.resolve();
	}

	public volume = async (params: {
		source: string;
		volume: number;
	}): Promise<void> => {
		if (!this.parent.connected) {
			return Promise.resolve();
		}
		const { source, volume } = params;
		return this.client.send('SetVolume', {
			source,
			volume,
			useDecibel: false,
		});
	};

	public mute = async (params: { source: string } | string): Promise<void> => {
		if (!this.parent.connected) {
			return Promise.resolve();
		}
		const { source } = typeof params === 'object' ? params : { source: params };
		return this.client.send('SetMute', {
			source,
			mute: true,
		});
	};

	public unmute = async (
		params: { source: string } | string,
	): Promise<void> => {
		if (!this.parent.connected) {
			return Promise.resolve();
		}
		const { source } = typeof params === 'object' ? params : { source: params };
		return this.client.send('SetMute', {
			source,
			mute: false,
		});
	};

	public sync = async (params: {
		source: string;
		offset: number;
	}): Promise<void> => {
		if (!this.parent.connected) {
			return Promise.resolve();
		}
		const { source, offset } = params;
		return this.client.send('SetSyncOffset', {
			source,
			offset,
		});
	};
}
