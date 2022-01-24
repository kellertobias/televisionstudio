import seri from 'seri';
import _fs from 'fs';
import sanitizeFilename from 'sanitize-filename';
import path from 'path';

const fs = _fs.promises;

const defaultEncoding = { encoding: 'utf8' };

export interface DeviceParameters {
	ip?: string;
	port?: number;
	enabled?: boolean;
	usagePort?: number;
	dev?: string;
}

export class ConfigBackend {
	initialized: boolean = false;
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

	async listShowFiles(subpath: string[]) {
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
				})
				.catch((err) => {
					if (err) {
						return reject(err);
					}
				});
		});
	}

	setShowFile(subpath: string[]) {
		const basepath = this.showFilesLocation;
		const sanitzedSubpath = subpath.map((sp) => sanitizeFilename(sp)).join('/');
		const searchpath = path.join(basepath, sanitzedSubpath);

		this.showfile = searchpath;
		this.generic.showfile = searchpath;

		this._storeFile('generic');
	}

	private openFile(name: string, mode?: string) {
		if (mode === undefined) mode = 'a+';
		console.log(
			`[CONFIG] Open File: ${this.configFilesLocation}/${name}.json as ${name}`,
		);

		return fs
			.open(`${this.configFilesLocation}/${name}.json`, mode, 0o666)
			.catch((err) => {
				console.error(err);
				return Promise.resolve(undefined);
			});
	}

	async init() {
		return this.load().then(() => {
			this.initialized = true;
			console.log(`[CONFIG] All Loaded.`, this.generic);
			return Promise.resolve();
		});
	}

	async _loadFile(varName: 'devices' | 'generic') {
		if (!this.files[varName]) {
			console.error(`[CONFIG] Config file for ${varName} does not exist`);
			return Promise.resolve();
		}
		return this.files[varName]
			.then((handle) => {
				console.log(`[CONFIG] Reading Config File for ${varName}`);
				if (!handle) return Promise.resolve();
				return handle.readFile(defaultEncoding);
			})
			.then((contents) => {
				try {
					if (!contents) {
						console.error(`[CONFIG] Config File for ${varName} was Empty`);
						return Promise.resolve();
					}
					console.log(`[CONFIG] Parsing Config File for ${varName}.`);
					const obj = seri.parse(contents);
					this[varName] = obj;
					return Promise.resolve();
				} catch (error) {
					console.error('Parsing Config File Error', error);
				}
			});
	}

	async _storeFile(varName: 'devices' | 'generic') {
		console.log('Storing', varName);
		if (!this.files[varName]) return Promise.resolve();
		const contents = seri.stringify(this[varName]);
		console.log(contents);

		const fileHandler = await this.openFile(varName, 'w+');
		if (fileHandler === undefined) return Promise.resolve();

		await fileHandler.writeFile(contents, 'utf-8');
		await fileHandler.close();
		return Promise.resolve();
	}

	onSaveCallback(handler: () => void): void {
		this.onSaveHandlers.push(handler);
	}

	load() {
		return Promise.all([
			this._loadFile('devices'),
			this._loadFile('generic'),
		]).then(() => {
			console.log('[CONFIG] LOADED', {
				devices: this.devices,
				generic: this.generic,
			});
			return Promise.resolve();
		});
	}

	private _store() {
		console.log('Storing Data');
		return Promise.all([
			this._storeFile('devices'),
			this._storeFile('generic'),
		]).then(() => {
			this.onSaveHandlers.forEach((handler) => handler());
		});
	}

	store(direct?: boolean) {
		if (this.storeTimeout) clearTimeout(this.storeTimeout);
		if (direct) this._store;

		this.storeTimeout = setTimeout(() => {
			this._store();
		}, 1000);
	}
}
