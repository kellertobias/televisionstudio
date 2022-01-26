import { promises as fs } from 'fs';

import yaml from 'js-yaml';
import colors from 'colors';

import { IModules, ModuleNames } from '../../modules';
import { ConfigBackend } from '../config';

import { MacroActionDefinition } from './action';
import { Macro } from './macro';

export class MacroStore {
	initialized = false;
	configFilesLocation!: string;

	macros: Macro[] = [];
	config: ConfigBackend;

	file!: Promise<fs.FileHandle | undefined>;
	modules: IModules;

	constructor(config: ConfigBackend, modules: IModules) {
		this.config = config;
		this.modules = modules;
	}

	public async init(): Promise<void> {
		this.configFilesLocation =
			this.config.generic.showfile || this.config.showfile;

		try {
			this.file = fs.open(`${this.configFilesLocation}`, 'a+', 0o666);
		} catch (error) {
			console.log(error);
		}

		await this.load();
		this.initialized = true;
	}

	public async destroy(): Promise<void> {
		await Promise.all(
			this.macros.map(async (macro) => {
				await macro.destroy();
			}),
		);
		this.initialized = false;

		this.macros = null;
		this.modules = null;
	}

	private buildMacro(macroObj: any) {
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
						if (!moduleName) {
							throw new Error('Syntax Error in Action.');
						}

						const params = action[key];

						const verifiedModuleName: ModuleNames =
							moduleName.toLowerCase() as ModuleNames;

						const moduleObj = this.modules[verifiedModuleName];
						if (!moduleObj) {
							throw new Error(`No Such Module: ${verifiedModuleName}`);
						}

						if (actionPath.length === 0) {
							actionPath = moduleObj.defaultAction;
						}

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

	public async load(): Promise<void> {
		console.log(colors.yellow.bold(`[SHOWFILE] Loading`));
		const handle = await this.file;

		if (!handle) {
			return Promise.resolve();
		}
		const contents = await handle.readFile({ encoding: 'utf8' });
		try {
			if (!contents) {
				console.log(
					colors.red.bold('[SHOWFILE] Could not Load: Showfile is empty'),
					contents,
				);
				this.config.showfileTitle = 'Empty';
				return;
			}

			const obj: any = yaml.load(contents);
			console.log(
				colors.yellow.bold(`[SHOWFILE] YAML File Loaded. Checking Structure…`),
			);

			if (typeof obj !== 'object') {
				console.log(
					colors.red.bold(`[SHOWFILE] Could not Load: Structure is Wrong`),
				);
				throw new Error('Showfile: Must be Object on Top Level');
			}

			if (!Array.isArray(obj.macros)) {
				console.log(
					colors.red.bold(`[SHOWFILE] Could not Load: Macros missing`),
				);
				throw new Error('Showfile: Must Contain macros array');
			}

			this.config.showfileTitle = obj.title;

			(async () => {
				if (obj?.obs?.scenefile) {
					await this.modules.obs.waitForConnection();
					await this.modules.obs.storage.setSceneCollection(obj.obs.scenefile);
				} else {
					console.log(
						colors.yellow.bold(`[SHOWFILE] No OBS Scene Collection assigned`),
					);
				}
			})();

			try {
				console.log('LOADING:', obj);
				this.macros = obj.macros.map((macroObj: any) => {
					return this.buildMacro(macroObj);
				});
				console.log(colors.yellow.bold(`[SHOWFILE] Loaded.`));
				return;
			} catch (error) {
				console.log(colors.red.bold(`[SHOWFILE] Loading Macros`), error);
			}
		} catch (error) {
			const { mark } = error;
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
	}
}
