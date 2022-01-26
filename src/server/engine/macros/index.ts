import { Observable } from '../../../shared/observable';
import { IModules } from '../../modules';
import { ConfigBackend } from '../config';
import { MicroWebsocketServer } from '../websocket-server';

import { Macro } from './macro';
import { MacroStore } from './store';

export class MacroEngine extends Observable {
	PAGE_SIZE = 8;
	macroStore!: MacroStore;
	macros: Macro[] = [];
	page = 1;
	master?: Macro;
	modules: IModules;
	config: ConfigBackend;

	private ws: MicroWebsocketServer;

	constructor(
		config: ConfigBackend,
		modules: IModules,
		ws: MicroWebsocketServer,
	) {
		super();
		this.ws = ws;
		this.modules = modules;
		this.config = config;

		this.loadMacroStore();
	}

	private getMacroIndex(executorNumber: number) {
		if (executorNumber === 0) {
			return this.master?.index || 0;
		}
		return this.PAGE_SIZE * (this.page - 1) + (executorNumber - 1);
	}

	private getMacroExecutor(macroIndex: number): [number, number] {
		const page = Math.floor(macroIndex / this.PAGE_SIZE);
		const executor = macroIndex % this.PAGE_SIZE;
		return [page + 1, executor + 1];
	}

	private isOnPage(macroNumber: number) {
		const [page] = this.getMacroExecutor(macroNumber);
		return page === this.page;
	}

	public getMacro(executorNumber: number): Macro {
		const index = this.getMacroIndex(executorNumber);
		const macro = this.macros[index];

		return macro;
	}

	public async loadMacroStore(): Promise<void> {
		if (this.macroStore === undefined) {
			this.macroStore = new MacroStore(this.config, this.modules);
			return;
		}

		await this.macroStore.destroy();
		this.macroStore = new MacroStore(this.config, this.modules);
		this.init();

		console.log('MACRO STORE RELOADED');
	}

	public async init(): Promise<void> {
		await this.macroStore.init();
		this.macros = this.macroStore.macros;
		[this.master] = this.macros;

		if (this.master) {
			this.master.isMaster = true;
		}

		this.macros.forEach((macro, index) => {
			macro.index = index;
			macro.executor = this.getMacroExecutor(index);
			macro.onUpdate((macro_) => {
				this.singleMacroChangedHandler(macro_);
			});
			macro.executeUpdate();
		});
	}

	public onMacroChange(handler: (param: { macro: Macro }) => void): void {
		this.registerEventHandler('macro', handler);
	}

	public onExecutorChange(
		handler: (param: {
			macro: Macro;
			pageNumber: number;
			executorNumber: number;
		}) => void,
	): void {
		this.registerEventHandler('executor', handler);
	}

	public onMasterExecutorChange(
		handler: (param: { macro: Macro }) => void,
	): void {
		this.registerEventHandler('master', handler);
	}

	private singleMacroChangedHandler(macro: Macro) {
		if (this.isOnPage(macro.index)) {
			this.runEventHandlers('executor', {
				macro,
				pageNumber: macro.executor[0],
				executorNumber: macro.executor[1],
			});
		}

		if (this.master === macro) {
			this.runEventHandlers('master', {
				macro,
			});
		}

		this.runEventHandlers('macro', {
			macro,
		});
	}

	private pageChanged() {
		const executors = this.getCurrentPageExecutors();
		console.log(executors);
		executors.forEach((exec, index) => {
			this.runEventHandlers('executor', {
				macro: exec,
				pageNumber: this.page,
				executorNumber: index + 1,
			});
		});
		if (executors.length < this.PAGE_SIZE) {
			for (let i = executors.length; i < this.PAGE_SIZE; i++) {
				this.runEventHandlers('executor', {
					macro: null,
					pageNumber: this.page,
					executorNumber: i + 1,
				});
			}
		}
	}

	public getCurrentPageExecutors(): Macro[] {
		const pageStart = this.PAGE_SIZE * (this.page - 1);
		const pageEnd = pageStart + this.PAGE_SIZE;
		const executors = this.macros.slice(pageStart, pageEnd);

		return executors;
	}

	public selectMaster(
		params: { macroIndex: number } | { executorIndex: number },
	): void {
		const paramsMacroIndex = params as { macroIndex: number };
		const paramsExecIndex = params as { executorIndex: number };
		const index =
			paramsExecIndex.executorIndex !== undefined
				? this.getMacroIndex(paramsExecIndex.executorIndex)
				: paramsMacroIndex.macroIndex;
		if (index > this.macros.length) {
			throw new Error('Selected Macro Number is empty');
		}
		const newMaster = this.macros[index];
		const oldMaster = this.master;
		if (oldMaster !== newMaster) {
			if (oldMaster) {
				oldMaster.setMaster(false);
			}
			newMaster.setMaster(true);
		}

		this.master = newMaster;

		if (oldMaster !== newMaster) {
			console.log('Master Changed');
			this.runEventHandlers('master', {
				macro: newMaster,
			});

			if (oldMaster && this.isOnPage(oldMaster.index)) {
				const exec = this.getMacroExecutor(oldMaster.index);
				this.runEventHandlers('executor', {
					macro: oldMaster,
					pageNumber: exec[0],
					executorNumber: this.getMacroExecutor(oldMaster.index)[1],
				});
			}

			if (this.isOnPage(newMaster.index)) {
				const exec = this.getMacroExecutor(newMaster.index);
				this.runEventHandlers('executor', {
					macro: newMaster,
					pageNumber: exec[0],
					executorNumber: exec[1],
				});
			}
		}
	}

	public goMacro(macroIndex: number): Promise<void> {
		const macro = this.macros[macroIndex];
		if (!macro) {
			console.log(new Error('Macro Out of Bounds'));
			return;
		}
		return macro.go(true);
	}

	public resetMacro(macroIndex: number): Promise<void> {
		const macro = this.macros[macroIndex];
		if (!macro) {
			throw new Error('Macro Out of Bounds');
		}
		return macro.reset();
	}

	public goExec(executorNumber: number): void {
		const index = this.getMacroIndex(executorNumber);
		this.goMacro(index);
	}

	public resetExec(executorNumber: number): void {
		const index = this.getMacroIndex(executorNumber);
		this.resetMacro(index);
	}

	public pageUp(): void {
		const numPages = Math.ceil(this.macros.length / this.PAGE_SIZE);
		if (this.page >= numPages) {
			return;
		}
		this.page += 1;
		this.pageChanged();
	}

	public pageDown(): void {
		if (this.page <= 1) {
			return;
		}
		this.page -= 1;
		this.pageChanged();
	}
}

export { MacroStore };
