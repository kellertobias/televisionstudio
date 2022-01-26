import { promises as fs } from 'fs';
import path from 'path';

import seri from 'seri';
import sanitizeFilename from 'sanitize-filename';

export interface DeviceParameters {
	ip?: string;
	port?: number;
	enabled?: boolean;
	usagePort?: number;
	dev?: string;
}

export const deviceParametersTypes = {
	ip: 'string',
	port: 'number',
	enabled: 'boolean',
	usagePort: 'number',
	dev: 'string',
};

export class ConfigBackend {
	initialized = false;
	configFilesLocation: string;
	showFilesLocation: string;
	showfileTitle?: string;
	showfile: string;

	devices: {
		switcher: DeviceParameters;
		obs: DeviceParameters;
		textgen: DeviceParameters;
		tally: DeviceParameters;
		desk: DeviceParameters;
		audio: DeviceParameters;
	} = {
		switcher: {
			ip: '192.168.42.5',
		},
		obs: {
			ip: '127.0.0.1',
			port: 4449,
		},
		textgen: {
			ip: '127.0.0.1',
			port: 3020,
		},
		tally: {
			ip: '192.168.42.166',
			port: 9868,
		},
		desk: {
			dev: '/dev/tty.usbmodem14201',
		},
		audio: {
			ip: '0.0.0.0',
			port: 0,
			enabled: false,
		},
	};

	generic: {
		channelMap: number[];
		brightness: {
			main: number;
			dim: number;
		};
		showStart: Date;
		showfile: string;
	} = {
		channelMap: [1, 2, 3, 4, 5, 6, 7, 8],
		brightness: {
			main: 100,
			dim: 25,
		},
		showStart: new Date('2021-03-15T20:00:00'),
		showfile: '',
	};

	files: {
		devices: Promise<fs.FileHandle | undefined>;
		generic: Promise<fs.FileHandle | undefined>;
	};
	storeTimeout?: NodeJS.Timeout;
	onSaveHandlers: (() => void)[] = [];

	constructor(configFilesLocation: string, showFilesLocation: string) {
		this.configFilesLocation = configFilesLocation;
		this.showFilesLocation = showFilesLocation;

		this.showfile = `${configFilesLocation}/macros.yaml`;

		this.files = {
			devices: this.openFile('devices'),
			generic: this.openFile('generic'),
		};
	}

	public async listShowFiles(subpath: string[]): Promise<unknown> {
		return new Promise((resolve, reject) => {
			const basepath = this.showFilesLocation;
			const sanitzedSubpath = subpath
				.map((sp) => sanitizeFilename(sp))
				.join('/');
			const searchpath = path.join(basepath, sanitzedSubpath);

			fs.readdir(searchpath, { withFileTypes: true })
				.then((files) => {
					resolve(
						files.map((f) => {
							let fileType = 'unknown';
							if (f.isDirectory()) {
								fileType = 'folder';
							} else if (f.isSymbolicLink()) {
								fileType = 'symlink';
							} else if (f.isFile()) {
								fileType = 'file';
							}
							return {
								name: f.name,
								type: fileType,
							};
						}),
					);
					return files;
				})
				.catch((error) => {
					if (error) {
						return reject(error);
					}
				});
		});
	}

	public setShowFile(subpath: string[]): void {
		const basepath = this.showFilesLocation;
		const sanitzedSubpath = subpath.map((sp) => sanitizeFilename(sp)).join('/');
		const searchpath = path.join(basepath, sanitzedSubpath);

		this.showfile = searchpath;
		this.generic.showfile = searchpath;

		this.storeFile('generic');
	}

	private async openFile(
		name: string,
		mode?: string,
	): Promise<fs.FileHandle | undefined> {
		if (mode === undefined) {
			mode = 'a+';
		}
		console.log(
			`[CONFIG] Open File: ${this.configFilesLocation}/${name}.json as ${name}`,
		);

		try {
			return await fs.open(
				`${this.configFilesLocation}/${name}.json`,
				mode,
				438,
			);
		} catch (error) {
			console.error(error);
		}
	}

	public async init(): Promise<void> {
		await this.load();

		this.initialized = true;
		console.log(`[CONFIG] All Loaded.`);
	}

	private async loadFile(varName: 'devices' | 'generic') {
		if (!this.files[varName]) {
			console.error(`[CONFIG] Config file for ${varName} does not exist`);
			return Promise.resolve();
		}
		const handle = await this.files[varName];

		if (!handle) {
			return Promise.resolve();
		}
		const contents = await handle.readFile({ encoding: 'utf8' });

		try {
			if (!contents) {
				console.error(`[CONFIG] Config File for ${varName} was Empty`);
				return;
			}
			const obj = seri.parse(contents);
			this[varName] = obj;
			return;
		} catch (error) {
			console.error('Parsing Config File Error', error);
		}
	}

	private async storeFile(varName: 'devices' | 'generic') {
		console.log('Storing', varName);
		if (!this.files[varName]) {
			return Promise.resolve();
		}
		const contents = seri.stringify(this[varName]);
		console.log(contents);

		const fileHandler = await this.openFile(varName, 'w+');
		if (fileHandler === undefined) {
			return Promise.resolve();
		}

		await fileHandler.writeFile(contents, 'utf-8');
		await fileHandler.close();
		return Promise.resolve();
	}

	onSaveCallback(handler: () => void): void {
		this.onSaveHandlers.push(handler);
	}

	public async load(): Promise<void> {
		await Promise.all([this.loadFile('devices'), this.loadFile('generic')]);
	}

	private async storeInner() {
		console.log('Storing Data');
		await Promise.all([this.storeFile('devices'), this.storeFile('generic')]);
		this.onSaveHandlers.forEach((handler) => handler());
	}

	public store(direct?: boolean): void {
		if (this.storeTimeout) {
			clearTimeout(this.storeTimeout);
		}
		if (direct) {
			this.storeInner();
		}

		this.storeTimeout = setTimeout(() => {
			this.storeInner();
		}, 1000);
	}
}
