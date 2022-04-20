import fetch, { BodyInit, Response } from 'node-fetch';

import { ConfigBackend } from '../../engine/config';
import { MacroEngine } from '../../engine/macros';
import { MicroWebsocketServer } from '../../engine/websocket-server';
import { IModules } from '../../modules';
import { BasicInterface } from '../basic-interface';

export class DeskTallyInterface extends BasicInterface {
	private connected = false;
	private config: ConfigBackend;
	private tallyUpdateInterval?: NodeJS.Timeout;

	private alreadyWarned = false;
	private lastError = null;

	constructor(
		config: ConfigBackend,
		modules: IModules,
		macros: MacroEngine,
		ws: MicroWebsocketServer,
	) {
		super(config, modules, macros, ws);
		this.config = config;
		this.setModuleError('INIT');
	}

	private async send(
		path: string,
		method: string,
		body?: BodyInit,
	): Promise<Response> {
		try {
			this.setModuleError(null);
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
				this.setModuleError('DISCONNECT');
			} else if (
				error.code === 'EHOSTDOWN' ||
				error.code === 'EHOSTUNREACH' ||
				error.code === 'ETIMEDOUT'
			) {
				if (!this.alreadyWarned) {
					console.error(
						`[TLY] ERROR: Host ${this.config.devices.tally.ip}:${this.config.devices.tally.port} Down`,
					);
				}
				this.setModuleError('DISCONNECT');
				this.alreadyWarned = true;
			} else {
				if (!this.alreadyWarned || String(error) !== this.lastError) {
					this.lastError = error;
					console.log('[TLY] ERROR:', error);
				}
				this.alreadyWarned = true;
				this.setModuleError(String(error));
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
