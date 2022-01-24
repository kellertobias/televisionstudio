// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/no-unused-vars */
import { BasicModule } from '../basic-module';

export class AudioModule extends BasicModule {
	public connected = true;
	private timeouts: NodeJS.Timeout[] = [];
	defaultAction = ['fadeTo'];

	public connect = async (): Promise<void> => {};

	public mute = async (
		params: { channel: string | number } | string | number,
	): Promise<void> => {};

	public unmute = async (
		params: { channel: string | number } | string | number,
	): Promise<void> => {};

	public setVolume = async (params: {
		channel: string | number;
		volume: number;
	}): Promise<void> => {};

	public fadeTo = async (params: {
		channel: string | number;
		volume: number;
		time: number;
	}): Promise<void> => {};

	public abortFade = async (params: { channel: string }): Promise<void> => {};
}
