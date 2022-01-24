import os from 'os-utils';
import fetch from 'node-fetch';

import { ConfigBackend } from '../engine/config';

import { BasicModule } from './basic-module';

/**
 * This Class gets the overall system state/ performance
 */
export class SystemStateModule extends BasicModule {
	connected = true;
	private timeouts: NodeJS.Timeout[] = [];
	private interval?: NodeJS.Timeout;

	public readonly defaultAction = [''];

	private status: {
		[key: string]: { cpu: number; ram: number; disk?: number };
	} = {
		desk: {
			cpu: 0,
			ram: 0,
		},
		obs: {
			cpu: 0,
			ram: 0,
			disk: 0,
		},
	};

	private errorPrinted = false;

	constructor(config: ConfigBackend) {
		super(config);
		this.config = config;
	}

	private getRemoteStatus() {
		if (!this.config.devices.textgen.ip) {
			throw new Error('No IP for Textgen');
		}
		if (!this.config.devices.textgen.port) {
			throw new Error('No PORT for Textgen');
		}
		return fetch(
			`http://${this.config.devices.textgen.ip}:${this.config.devices.textgen.port}/status`,
			{
				headers: { 'Content-Type': 'application/json' },
				method: 'GET',
			},
		)
			.then((data) => {
				if (!data) {
					return;
				}
				return data.json();
			})
			.then((data) => {
				this.errorPrinted = false;
				return data;
			})
			.catch((error) => {
				if (!this.errorPrinted) {
					if (error.code === 'ECONNREFUSED') {
						console.error('[STATUS] ERROR: Connection Refused');
					} else if (
						error.code === 'EHOSTDOWN' ||
						error.code === 'EHOSTUNREACH'
					) {
						console.error(
							`[STATUS] ERROR: Host ${this.config.devices.textgen.ip}:${this.config.devices.textgen.port} Down`,
						);
					} else {
						console.log('[STATUS] ERROR:', error);
					}
					this.errorPrinted = true;
				}
			});
	}

	public onUpdate(
		handler: (params: {
			obs: { cpu: number; ram: number; disk: number };
			desk: { cpu: number; ram: number };
		}) => void,
	): void {
		this.registerEventHandler('status', handler);
	}

	async connect(): Promise<void> {
		this.interval = setInterval(() => {
			return this.getRemoteStatus().then((data) => {
				const obs =
					data !== undefined
						? {
								cpu: data.cpu,
								ram: data.ram,
								disk: data.disk.used / data.disk.total,
						  }
						: { cpu: 1, ram: 1, disk: 1 };

				this.runEventHandlers('status', {
					obs,
					desk: {
						cpu: os.loadavg(1) / os.cpuCount(),
						ram: 1 - os.freememPercentage(),
					},
				});
				return data;
			});
		}, 1000);
		return Promise.resolve();
	}
}
