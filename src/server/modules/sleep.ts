import { BasicModule } from './basic-module';

export class SleepModule extends BasicModule {
	public connected = true;
	private timeouts: NodeJS.Timeout[] = [];

	public readonly defaultAction = ['wait'];

	async connect(): Promise<void> {
		return Promise.resolve();
	}

	abort = async (): Promise<void> => {
		this.timeouts.forEach((t) => {
			clearTimeout(t);
		});
		return Promise.resolve();
	};

	wait = async (params: { time: number } | number): Promise<void> => {
		const { time } = typeof params === 'object' ? params : { time: params };

		return new Promise((resolve) => {
			const t = setTimeout(() => {
				return resolve();
			}, time * 1000);
			this.timeouts.push(t);
		});
	};
}
