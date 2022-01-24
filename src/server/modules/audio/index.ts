import { ConfigBackend } from '../../engine/config';
import { BasicModule } from '../basic-module';

export class AudioModule extends BasicModule {
	connected: boolean = true;
	timeouts: NodeJS.Timeout[] = [];

	constructor(config: ConfigBackend) {
		super(config);
	}

	connect = async () => {
		return Promise.resolve();
	};

	updateAll = async () => {
		return Promise.resolve();
	};

	mute = async (params: { channel: string | number } | string | number) => {
		return Promise.resolve();
	};

	unmute = async (params: { channel: string | number } | string | number) => {
		return Promise.resolve();
	};

	setVolume = async (params: { channel: string | number; volume: number }) => {
		return Promise.resolve();
	};

	fadeTo = async (params: {
		channel: string | number;
		volume: number;
		time: number;
	}) => {
		return Promise.resolve();
	};

	abortFade = async (params: { channel: string }) => {
		return Promise.resolve();
	};
}
