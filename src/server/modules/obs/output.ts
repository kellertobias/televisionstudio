import { ObsSubModule } from './_sub';

type liveStatus = 'idle' | 'starting' | 'stopping' | 'running';

export class ObsModuleOutput extends ObsSubModule {
	streaming = false;
	recording = false;
	streamDataRate: number | undefined = undefined;
	streamTime: string | undefined = undefined;
	recordTime: string | undefined = undefined;
	droppedFrames: number = 0;
	folder?: string;
	streamingServer?: { server: string; key: string };

	_update() {
		if (!this.parent.connected) return Promise.resolve();
		let serverChanged = false;
		return this.getStreamSettings()
			.then((params) => {
				if (params) {
					const { server, key } = params;
					if (
						this.streamingServer?.server != server ||
						this.streamingServer?.key != key
					) {
						serverChanged = true;
						this.streamingServer = { server, key };
					}
				}

				return this.client.send('GetStreamingStatus');
			})
			.then((data) => {
				const { streaming, recording } = data;
				const recordTime = data['rec-timecode'];
				const streamTime = data['stream-timecode'];

				if (
					streaming != this.streaming ||
					this.streamTime != streamTime ||
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

				if (recording != this.recording || this.recordTime != recordTime) {
					this.recordTime = recordTime;
					this.recording = recording;

					this.parent.runEventHandlers('recording-status', {
						status: recording ? 'running' : 'idle',
						time: recordTime,
					});
				}

				return Promise.resolve();
			});
	}

	setup() {
		setInterval(() => this._update(), 1000);

		//Recording
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

		//Stream Status
		this.client.on('StreamStatus', (data: any) => {
			this.streamDataRate = data['kbits-per-sec'];
			this.droppedFrames = data['num-dropped-frames'];
		});

		return this._update();
	}

	onStreamChanged(
		handler: (params: {
			status: liveStatus;
			time: number;
			skipped: number;
			bandwidth: number;
			server?: { server: string; key: string };
		}) => void,
	) {
		this.parent.registerEventHandler('stream-status', handler);
	}

	onRecordingChanged(
		handler: (params: { status: liveStatus; time: number }) => void,
	) {
		this.parent.registerEventHandler('recording-status', handler);
	}

	startRecording = async (_params?: {}) => {
		if (!this.parent.connected) return Promise.resolve();
		return this.client.send('StartRecording');
	};

	endRecording = async (_params?: {}) => {
		if (!this.parent.connected) return Promise.resolve();
		return this.client.send('StopRecording');
	};

	setFolder = async (params: { folder: string } | string) => {
		if (!this.parent.connected) return Promise.resolve();
		const { folder } = typeof params == 'object' ? params : { folder: params };
		return this.client
			.send('SetRecordingFolder', {
				'rec-folder': folder,
			})
			.then(() => {
				this.folder = folder;
			});
	};

	getFolder = async (_params?: {}) => {
		if (!this.parent.connected) return Promise.resolve();
		return this.client.send('GetRecordingFolder').then((data: any) => {
			const folder: string = data['rec-folder'];
			this.folder = folder;
			return Promise.resolve(folder);
		});
	};

	startStream = async (_params?: {}) => {
		if (!this.parent.connected) return Promise.resolve();
		return this.client.send('StartStreaming', {});
	};

	endStream = async (_params?: {}) => {
		if (!this.parent.connected) return Promise.resolve();
		return this.client.send('StopStreaming');
	};

	setStreamSettings = async (params: {
		server: string;
		key?: string;
		use_auth?: boolean;
		username?: string;
		password?: string;
		save?: boolean;
	}) => {
		if (!this.parent.connected) return Promise.resolve();
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

	getStreamSettings = async (_params?: {}) => {
		if (!this.parent.connected) return Promise.resolve();
		return this.client.send('GetStreamSettings').then((data) => {
			return Promise.resolve(data.settings);
		});
	};
}
