import fetch, { BodyInit, Response } from 'node-fetch';

import { BasicInterface } from '../basic-interface';
import { MacroEngine } from '../../engine/macros';
import { ConfigBackend } from '../../engine/config';
import { IModules } from '../../modules';

export class DeskTallyInterface extends BasicInterface {
	private connected = false;
	private config: ConfigBackend;
	private tallyUpdateInterval?: NodeJS.Timeout;

	constructor(config: ConfigBackend, modules: IModules, macros: MacroEngine) {
		super(config, modules, macros);
		this.config = config;
	}

	private async send(
		path: string,
		method: string,
		body?: BodyInit,
	): Promise<Response> {
		try {
			return await fetch(
				`http://${this.config.devices.tally.ip}:${this.config.devices.tally.port}${path}`,
				{
					headers: { 'Content-Type': 'application/json' },
					method,
					body,
				},
			);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (error: any) {
			if (error.code === 'ECONNREFUSED') {
				console.error('[TLY] ERROR: Connection Refused');
			} else if (error.code === 'EHOSTDOWN' || error.code === 'EHOSTUNREACH') {
				console.error(
					`[TLY] ERROR: Host ${this.config.devices.tally.ip}:${this.config.devices.tally.port} Down`,
				);
			} else {
				console.log('[TLY] ERROR:', error);
			}
			throw new Error('Tally Server not Responding');
		}
	}

	public async sendTally(pgm: number, pvw: number): Promise<Response> {
		if (!this.connected) {
			return;
		}
		return this.send(`/tally?pgm=${pgm}&pvw=${pvw}`, 'GET');
	}

	public connect(): Promise<void> {
		this.connected = true;
		return Promise.resolve();
	}
	public shutdown(): Promise<void> {
		this.connected = false;
		if (this.tallyUpdateInterval) {
			clearInterval(this.tallyUpdateInterval);
		}
		return Promise.resolve();
	}
	public setup(): Promise<void> {
		this.modules.atem.mix.onChange(({ pgm, pvw }) => {
			console.log('TALLY', { pgm, pvw });
			this.sendTally(
				this.modules.atem.getSourceNumber(pgm),
				this.modules.atem.getSourceNumber(pvw),
			);
		});

		this.tallyUpdateInterval = setInterval(async () => {
			const { pgm } = this.modules.atem.mix.current;
			const { pvw } = this.modules.atem.mix.current;

			try {
				await this.sendTally(
					this.modules.atem.getSourceNumber(pgm),
					this.modules.atem.getSourceNumber(pvw),
				);
			} catch {
				/* Ignore Error */
			}
		}, 10000);

		return Promise.resolve();
	}
}
