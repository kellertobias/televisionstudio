import { ObsSubModule } from './_sub';

export class ObsModuleGeneric extends ObsSubModule {
	public fps = 0;
	private outputWidth = 0;
	private outputHeight = 0;

	private async update() {
		if (!this.parent.connected) {
			return Promise.resolve();
		}

		const data = await this.get();
		const { fps } = data;
		const width = data.outputWidth;
		const height = data.outputHeight;

		if (
			fps !== this.fps ||
			width !== this.outputWidth ||
			height !== this.outputHeight
		) {
			this.fps = fps;
			this.outputHeight = height;
			this.outputWidth = width;

			this.parent.runEventHandlers('output', { width, height, fps });
		}
	}

	public setup = (): Promise<void> => {
		setInterval(() => this.update(), 5000);
		return this.update();
	};

	// Event Handlers
	public onVideoSetupChanged(
		handler: (params: { width: number; height: number; fps: number }) => void,
	): void {
		this.parent.registerEventHandler('output', handler);
	}

	// Actions

	public get = async (): Promise<{
		fps: any;
		outputHeight: any;
		outputWidth: any;
	}> => {
		const data = await this.client.send('GetVideoInfo');
		const { fps } = data;
		const { outputWidth } = data;
		const { outputHeight } = data;

		return { fps, outputHeight, outputWidth };
	};
}
