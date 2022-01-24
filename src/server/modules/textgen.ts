import fetch, { Response } from 'node-fetch';

import { ConfigBackend } from '../engine/config';

import { BasicModule } from './basic-module';

export class TextgenModule extends BasicModule {
	connected = true;
	timeouts: NodeJS.Timeout[] = [];

	defaultAction = ['show'];

	constructor(config: ConfigBackend) {
		super(config);
		this.config = config;
	}

	async connect(): Promise<void> {
		return Promise.resolve();
	}

	async updateAll(): Promise<void> {
		return Promise.resolve();
	}

	private async send(path: string, method: string, body: any) {
		if (typeof body === 'object') {
			// eslint-disable-next-line no-param-reassign
			body = JSON.stringify(body);
		}

		return fetch(
			`http://${this.config.devices.textgen.ip}:${this.config.devices.textgen.port}${path}`,
			{
				headers: { 'Content-Type': 'application/json' },
				method,
				body,
			},
		).catch((error: any) => {
			console.log('[TXT] ERROR:', String(error));
			throw new Error(`TextGen Server Error: ${String(error)}`);
		});
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	clear = async (_params?: unknown): Promise<Response> => {
		return this.send('/text', 'post', { lines: ['', '', ''] });
	};

	show = async (
		params: { content?: any; scope?: string } | string,
	): Promise<Response> => {
		const { content, scope } =
			typeof params === 'object'
				? params
				: { content: [params || ''], scope: 'textgen' };
		return this.send('/text', 'post', { content, scope });
	};
}
