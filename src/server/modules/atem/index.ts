import { Atem, Commands } from 'atem-connection';

import { BasicModule } from '../basic-module';
import { ConfigBackend } from '../../engine/config';
import { MicroWebsocketServer } from '../../engine/websocket-server';

import { AtemModuleMixer } from './mixer';
import { AtemModuleDsk } from './dsk';
import { AtemModuleUsk } from './usk';
import { AtemModuleMedia } from './media';
import { AtemModuleMacro } from './macro';
import { STYLES, STYLESREV, VIDEO_MODES } from './constants';
import { AtemSubModule } from './_sub';

type TransitionStyleNames = 'DVE' | 'mix' | 'stinger' | 'dip' | 'wipe';

export class AtemModule extends BasicModule {
	public connected = false;
	private client: Atem;

	public mix: AtemModuleMixer;
	public dsk: AtemModuleDsk;
	public usk: AtemModuleUsk;
	public media: AtemModuleMedia;
	public macro: AtemModuleMacro;

	public readonly defaultAction = ['macro', 'run'];

	public channelMap: number[] = [1, 2, 3, 4, 5, 6, 7, 8];

	static SOURCEMAP = ['CH1', 'CH2', 'CH3', 'CH4', 'CH5', 'CH6', 'CH7', 'CH8'];

	private SOURCES: { [key: string]: number } = {
		CH1: 1,
		CH2: 2,
		CH3: 3,
		CH4: 4,
		CH5: 5,
		CH6: 6,
		CH7: 7,
		CH8: 8,
		BARS: 1000,
		COL1: 2001,
		COL2: 2002,
		MP1: 3010,
		MP1K: 3011,
		MP2: 3020,
		MP2K: 3021,
		AUX: 8001,
		BLACK: 0,
	};

	private SOURCESREV: { [key: number]: string } = {};

	private videoMode: {
		height: number;
		fps: number;
		ratio: '16:9' | '4:3';
		mode: 'p' | 'i';
	} = {
		height: 1080,
		fps: 1,
		ratio: '16:9',
		mode: 'p',
	};

	private allModules: AtemSubModule[] = [];

	constructor(config: ConfigBackend, ws: MicroWebsocketServer) {
		super(config, ws);
		this.client = new Atem();

		this.updateSourcesRev();

		this.mix = new AtemModuleMixer(this, this.client);
		this.dsk = new AtemModuleDsk(this, this.client);
		this.usk = new AtemModuleUsk(this, this.client);
		this.media = new AtemModuleMedia(this, this.client);
		this.macro = new AtemModuleMacro(this, this.client);

		this.allModules = [this.mix, this.dsk, this.usk, this.media, this.macro];

		this.client.on('stateChanged', (state, pathToChange) => {
			this.allModules.forEach((sub) => sub.update(state, pathToChange));
			const videoMode = this.getVideoMode(state.settings.videoMode);

			if (
				videoMode.height !== this.videoMode.height ||
				videoMode.fps !== this.videoMode.fps ||
				videoMode.mode !== this.videoMode.mode ||
				videoMode.ratio !== this.videoMode.ratio
			) {
				this.runEventHandlers('video-mode', { ...videoMode });
				this.videoMode = videoMode;
			}
		});
	}

	public onVideoModeChanged(
		handler: (param: {
			height: number;
			fps: number;
			ratio: '16:9' | '4:3';
			mode: 'i' | 'p';
		}) => void,
	): void {
		this.registerEventHandler('video-mode', handler);
	}

	private updateSourcesRev() {
		Object.keys(this.SOURCES).forEach((name: string) => {
			const index: number = this.SOURCES[name];
			this.SOURCESREV[index] = name;
		});
	}

	public async connect(): Promise<void> {
		this.setChannelMap(this.config.generic.channelMap);

		await new Promise<void>((resolve) => {
			console.log('[ATEM] Connecting...');
			const switcherConfig = this.config.devices.switcher;
			if (switcherConfig.ip === undefined) {
				return;
			}
			this.client.connect(switcherConfig.ip);

			this.client.on('connected', () => {
				this.connected = true;
				console.log('[ATEM] Connection Opened');
				resolve();
			});
		});
		await Promise.all(this.allModules.map((sub) => sub.setup()));
		await this.client.setTransitionPosition(1);
		await this.client.setTransitionPosition(0);
		await this.setupMultiview(this.channelMap);
	}

	public async setChannelMap(input: number[]): Promise<void> {
		input.forEach((value, index) => {
			const channel = AtemModule.SOURCEMAP[index];
			if (!value) {
				return;
			}
			this.channelMap[index] = value;
			this.SOURCES[channel] = value;
		});

		this.config.generic.channelMap = this.channelMap;

		this.updateSourcesRev();
		if (this.connected) {
			return this.setupMultiview(input);
		}
	}

	public async setupMultiview(input: number[]): Promise<void> {
		// Index 0 and 1 are the big screens
		await Promise.all(
			input.map((channel, index) => {
				const c = new Commands.MultiViewerSourceCommand(0, index + 2, channel);
				return this.client.sendCommand(c);
			}),
		);
	}

	public getVideoMode(input: number): typeof VIDEO_MODES[number] {
		return VIDEO_MODES[input];
	}

	public getSourceNumber(input: string): number {
		return this.SOURCES[input];
	}

	public getSourceName(input: number): string {
		return this.SOURCESREV[input];
	}

	public getStyleName(input: number): TransitionStyleNames {
		return STYLESREV[input] as TransitionStyleNames;
	}

	public getStyleNumber(
		input: 'DVE' | 'mix' | 'stinger' | 'dip' | 'wipe',
	): number {
		return STYLES[input];
	}
}
