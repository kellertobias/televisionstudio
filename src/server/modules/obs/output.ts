import { ObsSubModule } from './_sub';

type LiveStatus = 'idle' | 'starting' | 'stopping' | 'running';

export class ObsModuleOutput extends ObsSubModule {
	public streaming = false;
	public recording = false;

	private folder: string;
	private streamDataRate: number | undefined = undefined;
	private streamTime: string | undefined = undefined;
	private recordTime: string | undefined = undefined;
	private droppedFrames = 0;
	private streamingServer?: { server: string; key: string };

	private async update() {
		if (!this.parent.connected) {
			return Promise.resolve();
		}
		let serverChanged = false;
		const params = await this.getStreamSettings();
		if (params) {
			const { server, key } = params;
			if (
				this.streamingServer?.server !== server ||
				this.streamingServer?.key !== key
			) {
				serverChanged = true;
				this.streamingServer = { server, key };
			}
		}

		const streamingState = await this.client.send('GetStreamingStatus');

		const { streaming, recording } = streamingState;
		const recordTime = streamingState['rec-timecode'];
		const streamTime = streamingState['stream-timecode'];

		if (
			streaming !== this.streaming ||
			this.streamTime !== streamTime ||
			serverChanged
		) {
			this.streamTime = streamTime;
			this.streaming = streaming;

			this.parent.runEventHandlers('stream-status', {
				status: streaming ? 'running' : 'idle',
				time: streamTime,
				skipped: this.droppedFrames,
				bandwidth: this.streamDataRate,
				server: this.streamingServer,
			});
		}

		if (recording !== this.recording || this.recordTime !== recordTime) {
			this.recordTime = recordTime;
			this.recording = recording;

			this.parent.runEventHandlers('recording-status', {
				status: recording ? 'running' : 'idle',
				time: recordTime,
			});
		}
	}

	public setup(): Promise<void> {
		setInterval(() => this.update(), 1000);

		// Recording
		this.client.on('RecordingStarting', () => {
			this.parent.runEventHandlers('recording-status', {
				status: 'starting',
				time: 0,
			});
		});

		this.client.on('RecordingStopping', () => {
			this.parent.runEventHandlers('recording-status', {
				status: 'stopping',
				time: 0,
			});
		});

		// Stream
		this.client.on('StreamStarting', () => {
			this.parent.runEventHandlers('stream-status', {
				status: 'starting',
				time: 0,
				skipped: 0,
				bandwidth: 0,
				server: this.streamingServer,
			});
		});

		this.client.on('StreamStopping', () => {
			this.parent.runEventHandlers('stream-status', {
				status: 'stopping',
				time: 0,
				skipped: 0,
				bandwidth: 0,
				server: this.streamingServer,
			});
		});

		// Stream Status
		this.client.on('StreamStatus', (data) => {
			this.streamDataRate = data['kbits-per-sec'];
			this.droppedFrames = data['num-dropped-frames'];
		});

		return this.update();
	}

	public onStreamChanged(
		handler: (params: {
			status: LiveStatus;
			time: number;
			skipped: number;
			bandwidth: number;
			server?: { server: string; key: string };
		}) => void,
	): void {
		this.parent.registerEventHandler('stream-status', handler);
	}

	public onRecordingChanged(
		handler: (params: { status: LiveStatus; time: number }) => void,
	): void {
		this.parent.registerEventHandler('recording-status', handler);
	}

	public startRecording = async (): Promise<void> => {
		if (!this.parent.connected) {
			return Promise.resolve();
		}
		return this.client.send('StartRecording');
	};

	public endRecording = async (): Promise<void> => {
		if (!this.parent.connected) {
			return Promise.resolve();
		}
		return this.client.send('StopRecording');
	};

	public setFolder = async (
		params: { folder: string } | string,
	): Promise<void> => {
		if (!this.parent.connected) {
			return Promise.resolve();
		}
		const { folder } = typeof params === 'object' ? params : { folder: params };
		await this.client.send('SetRecordingFolder', {
			'rec-folder': folder,
		});

		this.folder = folder;
	};

	public getFolder = async () => {
		if (!this.parent.connected) {
			return Promise.resolve();
		}
		const data = await this.client.send('GetRecordingFolder');
		const folder: string = data['rec-folder'];
		this.folder = folder;
		return folder;
	};

	public startStream = async (): Promise<void> => {
		if (!this.parent.connected) {
			return Promise.resolve();
		}
		return this.client.send('StartStreaming', {});
	};

	public endStream = async (): Promise<void> => {
		if (!this.parent.connected) {
			return Promise.resolve();
		}
		return this.client.send('StopStreaming');
	};

	public setStreamSettings = async (params: {
		server: string;
		key?: string;
		use_auth?: boolean;
		username?: string;
		password?: string;
		save?: boolean;
	}): Promise<void> => {
		if (!this.parent.connected) {
			return Promise.resolve();
		}

		// eslint-disable-next-line @typescript-eslint/naming-convention
		const { server, key, use_auth, username, password } = params;
		const save = params.save !== undefined ? params.save : false;
		return this.client.send('SetStreamSettings', {
			type: 'rtmp_custom',
			settings: {
				server,
				key,
				use_auth,
				username,
				password,
			},
			save,
		});
	};

	public getStreamSettings = async (): Promise<void | {
		server: string;
		key: string;
		use_auth: boolean;
		username: string;
		password: string;
	}> => {
		if (!this.parent.connected) {
			return Promise.resolve();
		}
		const data = await this.client.send('GetStreamSettings');
		return data.settings;
	};
}
