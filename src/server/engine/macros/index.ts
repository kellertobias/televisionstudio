import { Observable } from '../../../shared/observable';
import { IModules } from '../../modules';
import { ConfigBackend } from '../config';
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

	constructor(config: ConfigBackend, modules: IModules) {
		super();
		this.modules = modules;
		this.config = config;

		this.loadMacroStore();
	}

	private getMacroIndex(executorNumber: number) {
		if (executorNumber == 0) return this.master?.index || 0;
		return this.PAGE_SIZE * (this.page - 1) + (executorNumber - 1);
	}

	private getMacroExecutor(macroIndex: number): [number, number] {
		const page = Math.floor(macroIndex / this.PAGE_SIZE);
		const executor = macroIndex % this.PAGE_SIZE;
		return [page + 1, executor + 1];
	}

	private isOnPage(macroNumber: number) {
		const [page] = this.getMacroExecutor(macroNumber);
		return page == this.page;
	}

	getMacro(executorNumber: number) {
		const index = this.getMacroIndex(executorNumber);
		const macro = this.macros[index];

		return macro;
	}

	loadMacroStore() {
		if (this.macroStore === undefined) {
			this.macroStore = new MacroStore(this.config, this.modules);
			return;
		}
		this.macroStore
			.destroy()
			.then(() => {
				this.macroStore = new MacroStore(this.config, this.modules);
			})
			.then(() => {
				return this.init();
			})
			.then(() => {
				console.log('MACRO STORE RELOADED');
			});
	}

	init() {
		return this.macroStore.init().then(() => {
			this.macros = this.macroStore.macros;
			this.master = this.macros[0];
			if (this.master) this.master.isMaster = true;

			this.macros.forEach((macro, index) => {
				macro.index = index;
				macro.executor = this.getMacroExecutor(index);
				macro.onUpdate((_macro) => {
					this.singleMacroChangedHandler(macro, index);
				});
				macro._executeUpdate();
			});
		});
	}

	onMacroChange(handler: (param: { macro: Macro }) => void) {
		this.registerEventHandler('macro', handler);
	}

	onExecutorChange(
		handler: (param: {
			macro: Macro;
			pageNumber: number;
			executorNumber: number;
		}) => void,
	) {
		this.registerEventHandler('executor', handler);
	}

	onMasterExecutorChange(handler: (param: { macro: Macro }) => void) {
		this.registerEventHandler('master', handler);
	}

	private singleMacroChangedHandler(macro: Macro, _index: number) {
		if (this.isOnPage(macro.index)) {
			this.runEventHandlers('executor', {
				macro: macro,
				pageNumber: macro.executor[0],
				executorNumber: macro.executor[1],
			});
		}

		if (this.master === macro) {
			this.runEventHandlers('master', {
				macro: macro,
			});
		}

		this.runEventHandlers('macro', {
			macro: macro,
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

	getCurrentPageExecutors() {
		const pageStart = this.PAGE_SIZE * (this.page - 1);
		const pageEnd = pageStart + this.PAGE_SIZE;
		const executors = this.macros.slice(pageStart, pageEnd);

		return executors;
	}

	selectMaster(params: { macroIndex: number } | { executorIndex: number }) {
		let index: number;
		const paramsMacroIndex = params as { macroIndex: number };
		const paramsExecIndex = params as { executorIndex: number };
		if (paramsExecIndex.executorIndex !== undefined) {
			index = this.getMacroIndex(paramsExecIndex.executorIndex);
		} else {
			index = paramsMacroIndex.macroIndex;
		}
		if (index > this.macros.length) {
			throw new Error('Selected Macro Number is empty');
		}
		const newMaster = this.macros[index];
		const oldMaster = this.master;
		if (oldMaster !== newMaster) {
			if (oldMaster) oldMaster.setMaster(false);
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

	goMacro(macroIndex: number) {
		const macro = this.macros[macroIndex];
		if (!macro) {
			console.log(Error('Macro Out of Bounds'));
			return;
		}
		return macro.go(true);
	}

	resetMacro(macroIndex: number) {
		const macro = this.macros[macroIndex];
		if (!macro) {
			throw new Error('Macro Out of Bounds');
		}
		return macro.reset();
	}

	goExec(executorNumber: number) {
		const index = this.getMacroIndex(executorNumber);
		this.goMacro(index);
	}

	resetExec(executorNumber: number) {
		const index = this.getMacroIndex(executorNumber);
		this.resetMacro(index);
	}

	pageUp() {
		const numPages = Math.ceil(this.macros.length / this.PAGE_SIZE);
		if (this.page >= numPages) return;
		this.page = this.page + 1;
		this.pageChanged();
	}

	pageDown() {
		if (this.page <= 1) return;
		this.page = this.page - 1;
		this.pageChanged();
	}
}

export { MacroStore };
