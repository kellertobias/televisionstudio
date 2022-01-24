import OBSWebSocket from 'obs-websocket-js';

import { ConfigBackend } from '../../engine/config';
import { BasicModule } from '../basic-module';

import { ObsModuleAudio } from './audio';
import { ObsModuleGeneric } from './generic';
import { ObsModuleOutput } from './output';
import { ObsModuleStorage } from './storage';
import { ObsModuleScenes } from './scene';

export class ObsModule extends BasicModule {
	public connected = false;
	private client: OBSWebSocket;

	public scene: ObsModuleScenes;
	public audio: ObsModuleAudio;
	public generic: ObsModuleGeneric;
	public output: ObsModuleOutput;
	public storage: ObsModuleStorage;

	private printedConnectionError = false;

	public readonly defaultAction = ['scenes', 'set'];
	private connectingTimeout?: NodeJS.Timeout;

	constructor(config: ConfigBackend) {
		super(config);
		this.client = new OBSWebSocket();

		this.client.on('ConnectionOpened', () => {
			this.connected = true;
			console.log('[OBS] Connected');
			this.runEventHandlers('connection-status', { connected: true });
		});

		this.client.on('ConnectionClosed', () => {
			if (this.connected) {
				this.connected = false;
				console.log('[OBS] Disconnected');
				this.runEventHandlers('connection-status', { connected: false });
			}

			// Try to reconnect
			this.connect();
		});

		this.scene = new ObsModuleScenes(this, this.client);
		this.audio = new ObsModuleAudio(this, this.client);
		this.generic = new ObsModuleGeneric(this, this.client);
		this.output = new ObsModuleOutput(this, this.client);
		this.storage = new ObsModuleStorage(this, this.client);
	}

	private connectInner = (): Promise<boolean> => {
		if (this.connectingTimeout !== undefined) {
			clearTimeout(this.connectingTimeout);
		}
		return new Promise<boolean>((resolve) => {
			this.connectingTimeout = setTimeout(() => {
				if (this.connectingTimeout !== undefined) {
					clearTimeout(this.connectingTimeout);
				}

				this.client
					.connect({
						address: `${this.config.devices.obs.ip}:${this.config.devices.obs.port}`,
					})
					.then(() => {
						this.connected = true;
						this.printedConnectionError = false;
						return resolve(true);
					})
					.catch((error: any) => {
						this.connected = false;
						if (!this.printedConnectionError) {
							console.log('[OBS] Error', error);
							this.printedConnectionError = true;
						}
						return resolve(false);
					});
			}, 1000);
		});
	};

	private setupAll = async (): Promise<void> => {
		await this.generic.setup();
		await this.output.setup();
		await this.scene.setup();
		await this.audio.setup();
		await this.storage.setup();
		console.log('[OBS] Setup Done');
		return Promise.resolve();
	};

	public connect = async (): Promise<void> => {
		return this.connectInner().then((connected) => {
			if (connected) {
				return this.setupAll();
			}
			return null;
		});
	};

	public waitForConnection = (): Promise<void> => {
		console.log('[OBS] Wait for Connection');
		if (this.connected) {
			return Promise.resolve();
		}
		let resolved = false;
		return new Promise((resolve) => {
			this.registerEventHandler('connection-status', (connected) => {
				if (!connected) {
					return;
				}
				if (resolved) {
					return;
				}
				resolved = true;
				console.log('[OBS] Wait for Connection - Connected');
				return resolve();
			});
		});
	};

	// Event Handlers
	public onStatus(handler: (params: { connected: boolean }) => void): void {
		this.registerEventHandler('connection-status', handler);
	}
}
