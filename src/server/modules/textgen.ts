import fetch, { BodyInit, Response } from 'node-fetch';

import { ConfigBackend } from '../engine/config';
import { MicroWebsocketServer } from '../engine/websocket-server';

import { BasicModule } from './basic-module';

/**
 * This class connects to the Text Generator Module
 */
export class TextgenModule extends BasicModule {
	public connected = true;
	private timeouts: NodeJS.Timeout[] = [];
	public readonly defaultAction = ['show'];

	constructor(config: ConfigBackend, ws: MicroWebsocketServer) {
		super(config, ws);
		this.config = config;
	}

	private async send(
		path: string,
		method: string,
		body: BodyInit | Record<string, unknown>,
	) {
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
		).catch((error: unknown) => {
			console.log('[TXT] ERROR:', String(error));
			throw new Error(`TextGen Server Error: ${String(error)}`);
		});
	}

	public async connect(): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * Clear Text from Generator
	 * @returns
	 */
	public clear = async (): Promise<Response> => {
		return this.send('/text', 'post', { lines: ['', '', ''] });
	};

	/**
	 * Show Text Generator Text
	 * @param params Text Generator Config
	 * @returns
	 */
	public show = async (
		params: { content?: unknown; scope?: string } | string,
	): Promise<Response> => {
		const { content, scope } =
			typeof params === 'object'
				? params
				: { content: [params || ''], scope: 'textgen' };
		return this.send('/text', 'post', { content, scope });
	};
}
