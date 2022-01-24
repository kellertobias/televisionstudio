import _fs from 'fs';
import yaml from 'js-yaml';
import { Macro } from './macro';
import colors from 'colors';
import { IModules, ModuleNames } from '../../modules/index';
import { MacroActionDefinition } from './action';
import { ConfigBackend } from '../config';

const fs = _fs.promises;

const defaultEncoding = { encoding: 'utf8' };

export class MacroStore {
	initialized: boolean = false;
	configFilesLocation!: string;

	macros: Macro[] = [];
	config: ConfigBackend;
	//@ts-ignore
	file!: Promise<fs.FileHandle | undefined>;
	modules: IModules;

	constructor(config: ConfigBackend, modules: IModules) {
		console.log('Generating Macro Store', config.generic.showfile);
		this.config = config;
		this.modules = modules;
	}

	async init() {
		this.configFilesLocation =
			this.config.generic.showfile || this.config.showfile;
		this.file = fs
			.open(`${this.configFilesLocation}`, 'a+', 0o666)
			.catch((err) => {
				console.log(err);
				return Promise.resolve(undefined);
			});

		return this.load().then(() => {
			this.initialized = true;
			return Promise.resolve();
		});
	}

	async destroy() {
		this.macros.forEach(async (macro) => {
			await macro.destroy();
		});
		this.initialized = false;

		// @ts-ignore
		this.macros = null;
		// @ts-ignore
		this.modules = null;
	}

	buildMacro(macroObj: any) {
		const macro = new Macro(
			macroObj.name,
			macroObj.loopable,
			(macroObj.steps || []).map((step: any, i: number) => {
				return {
					stepNumber: i,
					name: step.name,
					trigger: step.trigger || 'GO',
					duration: step.duration || 0,
					actions: (step.actions || []).map((action: any) => {
						const key = Object.keys(action || {})[0] || '';
						let actionPath = key.split('::');
						const moduleName = actionPath.shift();
						if (!moduleName) throw new Error('Syntax Error in Action.');

						const params = action[key];

						const verifiedModuleName: ModuleNames =
							moduleName.toLowerCase() as ModuleNames;

						const moduleObj = this.modules[verifiedModuleName];
						if (!moduleObj)
							throw new Error('No Such Module: ' + verifiedModuleName);

						if (actionPath.length == 0) actionPath = moduleObj.defaultAction;

						const macroAction: MacroActionDefinition = {
							mod: moduleObj,
							modName: verifiedModuleName,
							path: actionPath,
							params,
						};

						return macroAction;
					}),
				};
			}),
		);

		return macro;
	}

	load() {
		console.log(colors.yellow.bold(`[SHOWFILE] Loading`));
		return this.file
			.then((handle) => {
				if (!handle) return Promise.resolve(undefined);
				return handle.readFile(defaultEncoding);
			})
			.then((contents) => {
				try {
					if (!contents) {
						console.log(
							colors.red.bold('[SHOWFILE] Could not Load: Showfile is empty'),
							contents,
						);
						this.config.showfileTitle = 'Empty';
						return Promise.resolve();
					}

					// @ts-ignore
					const obj = yaml.safeLoad(contents);
					console.log(
						colors.yellow.bold(
							`[SHOWFILE] YAML File Loaded. Checking Structure…`,
						),
					);
					if (typeof obj !== 'object') {
						console.log(
							colors.red.bold(`[SHOWFILE] Could not Load: Structure is Wrong`),
						);
						throw Error('Showfile: Must be Object on Top Level');
					}

					if (!Array.isArray(obj.macros)) {
						console.log(
							colors.red.bold(`[SHOWFILE] Could not Load: Macros missing`),
						);
						throw Error('Showfile: Must Contain macros array');
					}

					this.config.showfileTitle = obj.title;

					if (obj?.obs?.scenefile) {
						this.modules.obs.waitForConnection().then(() => {
							this.modules.obs.storage.setSceneCollection(obj.obs.scenefile);
						});
					} else {
						console.log(
							colors.yellow.bold(`[SHOWFILE] No OBS Scene Collection assigned`),
						);
					}

					try {
						console.log('LOADING:', obj);
						this.macros = obj.macros.map((macroObj: any) => {
							return this.buildMacro(macroObj);
						});
						console.log(colors.yellow.bold(`[SHOWFILE] Loaded.`));
						return Promise.resolve();
					} catch (error) {
						console.log(colors.red.bold(`[SHOWFILE] Loading Macros`), error);
					}
				} catch (error) {
					const mark = error.mark;
					if (!mark) {
						console.log(
							colors.red.bold(`[SHOWFILE] Error Parsing Macro File: ${error}`),
						);
					} else {
						console.log(
							colors.red.bold(
								`[SHOWFILE] Error Parsing Macro File: Line ${mark.line}:${mark.column}\n       ${error.reason}`,
							),
						);
					}
					console.log('ERROR KEYS:', Object.keys(error));
				}
			});
	}
}
