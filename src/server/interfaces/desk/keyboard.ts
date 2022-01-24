import { ConfigBackend } from '../../engine/config';
import { IModules } from '../../modules';
import { MacroEngine } from '../../engine/macros';
import { TransitionOnairs, TransitionTies } from '../../modules/atem/usk';
import { Macro } from '../../engine/macros/macro';

import { DeskSerialBoardInterface, LedColor, LedStatus } from './serial';
import { DeskKeyboardInterfaceHelpers } from './keyboard-helper';

type Tabs = 'macro' | 'aux' | 'scene' | 'audio';

const generateRow = (activeColor: LedColor, activeCol: number): LedStatus[] => {
	return [...new Array(9)].map((_val, col) => {
		if (col === 9) {
			return { color: 'off', blink: 'off', dim: true, fast: false };
		}
		return {
			color: col === activeCol || col === activeCol % 8 ? activeColor : 'off',
			blink:
				col === activeCol % 8 && activeCol > 8
					? 'off'
					: col === activeCol || col === activeCol % 8
					? activeColor
					: 'off',
			dim: false,
			fast: false,
		};
	});
};

export class DeskKeyboardInterface extends DeskKeyboardInterfaceHelpers {
	private serial: DeskSerialBoardInterface;

	public currentTab: Tabs = 'macro';
	private faderReverse = false;

	private rateChangeHandler?: (params: {
		push?: boolean;
		direction?: -1 | 1;
	}) => void = undefined;
	private outputButtonTimeouts: NodeJS.Timeout[] = [];

	private config: ConfigBackend;
	public brightnessMain = 50;
	public brightnessDim = 10;
	private recordingPressed = false;
	private streamingPressed = false;

	constructor(config: ConfigBackend, modules: IModules, macros: MacroEngine) {
		super(config, modules, macros);
		this.config = config;
		this.serial = new DeskSerialBoardInterface(config, modules, macros);
		this.updateBrightness();
	}

	private updateTabLedsUpper() {
		const ledBase: (
			| {
					color: LedColor;
					on: boolean;
					blink: boolean;
					fast?: boolean;
			  }
			| undefined
			| false
		)[] = [
			{ color: 'yellow', on: this.currentTab === 'macro', blink: false },
			{ color: 'pink', on: this.currentTab === 'scene', blink: false },
			{ color: 'white', on: this.currentTab === 'aux', blink: false },
			{ color: 'cyan', on: this.currentTab === 'audio', blink: false },
			false,
			false,
			this.recordingPressed
				? undefined
				: {
						color: this.modules.obs.output.recording ? 'red' : 'off',
						on: true,
						blink: false,
				  },
			this.streamingPressed
				? undefined
				: {
						color: this.modules.obs.output.streaming ? 'red' : 'off',
						on: true,
						blink: false,
				  },
			{
				color: this.currentTab === 'aux' ? 'off' : 'white',
				on: false,
				blink: false,
			},
		];

		ledBase.forEach((params, col) => {
			if (params === undefined) {
				return;
			}
			if (!params) {
				return this.serial.setLed('left', 4, col, {
					color: 'off',
					blink: 'off',
					dim: true,
					fast: false,
				});
			}

			const { color, on, blink } = params;
			return this.serial.setLed('left', 4, col, {
				color,
				blink: blink ? 'off' : color,
				dim: !on,
				fast: params.fast || false,
			});
		});
	}

	private macroLed(macro: Macro) {
		const macroColor: LedStatus = {
			color: 'yellow',
			blink: 'yellow',
			fast: true,
			dim: true,
		};
		if (macro.waiting) {
			macroColor.dim = false;
		} else if (macro.running) {
			macroColor.dim = false;
			macroColor.blink = 'off';
		}

		return macroColor;
	}

	private updateTabLedsLower() {
		const ledStatus: LedStatus[] = [];
		const fillOff = () => {
			const existing = ledStatus.length;
			for (let i = 0; i < 8 - existing; i++) {
				ledStatus.push({
					color: 'off',
					blink: 'off',
					dim: true,
					fast: false,
				});
			}
		};

		switch (this.currentTab) {
			case 'macro': {
				const macroPage = this.macros.getCurrentPageExecutors();
				macroPage.forEach((macro) => {
					ledStatus.push(this.macroLed(macro));
				});
				fillOff();
				break;
			}
			case 'scene': {
				const scenes = this.modules.obs.scene.scenes.slice(0, 8);
				scenes.forEach((scene) => {
					ledStatus.push({
						color: scene.live ? 'green' : scene.next ? 'red' : 'pink',
						blink: scene.live ? 'green' : scene.next ? 'off' : 'pink',
						dim: !(scene.live || scene.next === true),
						fast: false,
					});
				});
				fillOff();

				break;
			}
			case 'aux': {
				const currentChannel = this.mapChannelToCol(
					this.modules.atem.mix.current.aux,
				);
				const currentCol = currentChannel % 8;

				[...new Array(8)].forEach((_val, col) => {
					if (currentCol === col) {
						ledStatus.push({
							color: 'white',
							blink: currentChannel === currentCol ? 'white' : 'off',
							dim: false,
							fast: false,
						});
					} else {
						ledStatus.push({
							color: 'white',
							blink: 'white',
							dim: true,
							fast: false,
						});
					}
				});

				ledStatus.push({
					color: 'off',
					blink: 'off',
					dim: true,
					fast: false,
				});

				break;
			}
			case 'audio': {
				this.macros.getCurrentPageExecutors();

				[...new Array(8)].forEach(() => {
					ledStatus.push({
						color: 'off', // 'blue',
						blink: 'off', // 'blue',
						dim: true,
						fast: false,
					});
				});
				break;
			}
			default:
				console.log('DEFAULT CASE?');
		}

		if (this.currentTab !== 'aux') {
			ledStatus.push({
				color: 'white',
				blink: 'white',
				dim: true,
				fast: false,
			});
		}

		this.serial.setLedRow('left', 3, ledStatus);
	}

	private updateTabLeds() {
		this.updateTabLedsUpper();
		this.updateTabLedsLower();
	}

	private changePage(direction: -1 | 1) {
		if (this.currentTab === 'macro') {
			if (direction === 1) {
				this.macros.pageDown();
			}
			if (direction === -1) {
				this.macros.pageUp();
			}
		} else if (this.currentTab === 'aux') {
			// Aux has no Page change
		} else {
			console.log('Change Page not yet implemented for this tab.');
		}
	}

	private updateBrightness() {
		this.serial.brightness = this.brightnessMain;
		this.serial.brightnessBlink = this.brightnessMain;

		this.serial.brightnessDim = this.brightnessDim;
		this.serial.brightnessBlinkDim = this.brightnessDim;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	private handleMultibus(col: number, _pressed: boolean, _pressedAt: Date) {
		if (col === 8) {
			return;
		}
		switch (this.currentTab) {
			case 'macro': {
				this.macros.goExec(col + 1);
				break;
			}
			case 'audio':
				break;

			case 'scene': {
				const scenes = this.modules.obs.scene.scenes.slice(0, 8);
				const scene = scenes[col];
				if (scene) {
					this.modules.obs.scene.set(scene.name);
				}
				break;
			}

			case 'aux': {
				const channel = this.mapColToChannel(
					col,
					this.serial.getButton('left', 3, 8).pressed,
				);
				this.modules.atem.mix.aux(channel);
				break;
			}
			default:
		}
	}

	public async connect(): Promise<void> {
		this.brightnessMain = this.config.generic.brightness.main;
		this.brightnessDim = this.config.generic.brightness.dim;

		this.updateBrightness();

		this.serial.connect();
		return Promise.resolve();
	}

	public async shutdown(): Promise<void> {
		this.serial.shutdown();
		return Promise.resolve();
	}

	public onRateChange(
		handler: (params: { push?: boolean; direction?: -1 | 1 }) => void,
	): void {
		this.rateChangeHandler = handler;
	}

	public setTab(tab: Tabs): void {
		this.currentTab = tab;

		this.updateTabLeds();
	}

	public setBrightness(main: number, dim: number): void {
		this.brightnessMain = main;
		this.brightnessDim = dim;

		this.config.generic.brightness.main = main;
		this.config.generic.brightness.dim = dim;

		this.updateBrightness();
	}

	public async setup(): Promise<void> {
		this.updateTabLeds();

		this.modules.obs.scene.onListChanged(() => {
			if (this.currentTab === 'scene') {
				this.updateTabLedsLower();
			}
		});

		this.modules.atem.mix.onAuxChange(() => {
			if (this.currentTab === 'aux') {
				this.updateTabLedsLower();
			}
		});

		this.modules.obs.output.onRecordingChanged(() => {
			this.updateTabLedsUpper();
		});

		this.modules.obs.output.onStreamChanged(() => {
			this.updateTabLedsUpper();
		});

		this.macros.onExecutorChange((params) => {
			const { macro } = params;
			if (this.currentTab === 'macro') {
				this.updateTabLedsLower();
			}

			if (macro && macro.isMaster) {
				this.serial.setLed('right', 1, 8, this.macroLed(macro));
			}
		});

		this.modules.atem.mix.onChange((param) => {
			const { pgm, pvw } = param;

			this.serial.setLedRow(
				'left',
				0,
				generateRow('green', this.mapChannelToCol(pvw)),
			);
			this.serial.setLedRow(
				'left',
				1,
				generateRow('red', this.mapChannelToCol(pgm)),
			);
		});

		this.modules.atem.mix.onBlack((params) => {
			const { black, auto } = params;
			this.serial.setLed('right', 4, 8, {
				color: black || auto ? 'red' : 'off',
				blink: !auto ? 'off' : 'red',
				dim: false,
				fast: true,
			});
		});

		this.modules.atem.mix.onTransitionRunning((params) => {
			const { running } = params;
			this.serial.setLed('right', 0, 3, {
				color: running ? 'red' : 'off',
				blink: running ? 'red' : 'off',
				dim: false,
				fast: true,
			});
			const previewCol = this.mapChannelToCol(
				this.modules.atem.mix.current.pvw,
			);
			if (running) {
				this.serial.setLed('left', 0, previewCol, {
					color: 'red',
					blink: 'red',
					dim: false,
					fast: false,
				});
			} else {
				this.serial.setLed('left', 0, previewCol, {
					color: 'green',
					blink: 'green',
					dim: false,
					fast: false,
				});
			}
		});

		this.modules.atem.mix.onTransitionSettings((params) => {
			const { style, preview } = params;

			this.serial.setLed('right', 0, 0, {
				color: preview ? 'red' : 'off',
				blink: preview ? 'red' : 'off',
				dim: false,
				fast: false,
			});

			['mix', 'dip', 'wipe', 'DVE'].forEach((element, col) => {
				this.serial.setLed('right', 1, col, {
					color: style === element ? 'yellow' : 'off',
					blink: style === element ? 'yellow' : 'off',
					dim: false,
					fast: false,
				});
			});
		});

		this.modules.atem.usk.onChange((params) => {
			const { ties, onair } = params;

			['bg', 'usk1', 'usk2'].forEach((key, index) => {
				const col = index + 1;
				const uskTie = ties[key as keyof TransitionTies];
				this.serial.setLed('right', 3, col, {
					color: uskTie ? 'yellow' : 'off',
					blink: uskTie ? 'yellow' : 'off',
					dim: false,
					fast: false,
				});

				if (key === 'bg') {
					return;
				}
				const uskOnair = onair[key as keyof TransitionOnairs];
				this.serial.setLed('right', 4, col, {
					color: uskOnair ? 'red' : 'off',
					blink: uskOnair ? 'red' : 'off',
					dim: false,
					fast: false,
				});
			});
		});

		this.modules.atem.dsk.onState((params) => {
			const { running, onair, tie } = params;
			const dsk = params.dsk as 'dsk1' | 'dsk2';
			const col = { dsk1: 6, dsk2: 7 }[dsk];

			this.serial.setLed('right', 4, col, {
				color: onair ? 'red' : 'off',
				blink: running || !onair ? 'off' : 'red',
				dim: false,
				fast: true,
			});

			this.serial.setLed('right', 3, col, {
				color: tie ? 'yellow' : 'off',
				blink: tie ? 'yellow' : 'off',
				dim: false,
				fast: false,
			});

			this.serial.setLed('right', 2, col, {
				color: running ? 'red' : 'off',
				blink: running ? 'red' : 'off',
				dim: false,
				fast: false,
			});
		});

		this.serial.onButton('left', (params) => {
			const { row, col, pressed, pressedAt } = params;

			if (row === 4 && (col === 6 || col === 7)) {
				if (this.outputButtonTimeouts[col]) {
					clearTimeout(this.outputButtonTimeouts[col]);
				}
				if (col === 6) {
					this.recordingPressed = pressed;
				} else {
					this.streamingPressed = pressed;
				}
				if (pressed) {
					this.serial.setLed('left', 4, col, {
						color: 'red',
						blink: 'off',
						dim: false,
						fast: false,
					});

					this.outputButtonTimeouts[col] = setTimeout(() => {
						this.serial.setLed('left', 4, col, {
							color: 'red',
							blink: 'off',
							dim: false,
							fast: true,
						});
						if (col === 6) {
							if (this.modules.obs.output.recording) {
								this.modules.obs.output.endRecording();
							} else {
								this.modules.obs.output.startRecording();
							}
						} else if (this.modules.obs.output.streaming) {
							this.modules.obs.output.endStream();
						} else {
							this.modules.obs.output.startStream();
						}
					}, 2000);
				} else if (col === 6) {
					if (!this.modules.obs.output.recording) {
						this.serial.setLed('left', 4, col, {
							color: 'off',
							blink: 'off',
							dim: false,
							fast: true,
						});
					} else {
						this.serial.setLed('left', 4, col, {
							color: 'red',
							blink: 'red',
							dim: false,
							fast: true,
						});
					}
				} else if (!this.modules.obs.output.streaming) {
					this.serial.setLed('left', 4, col, {
						color: 'off',
						blink: 'off',
						dim: false,
						fast: true,
					});
				} else {
					this.serial.setLed('left', 4, col, {
						color: 'red',
						blink: 'red',
						dim: false,
						fast: true,
					});
				}
				return;
			}

			if (!pressed) {
				return;
			}

			switch (row) {
				case 0:
				case 1: {
					// Shift does not do anything, just change the function of other buttons.
					if (col === 8) {
						return;
					}

					const channel = this.mapColToChannel(
						col,
						this.serial.getButton('left', row, 8).pressed,
					);
					if (row === 0) {
						return this.modules.atem.mix.prv(channel);
					}
					if (row === 1) {
						return this.modules.atem.mix.pgm(channel);
					}
					break;
				}
				case 2:
					console.log('This Row is Empty on this board');
					break;
				case 3:
					if (col === 8 && this.currentTab !== 'aux') {
						return this.changePage(-1);
					}
					return this.handleMultibus(col, pressed, pressedAt);
				case 4:
					switch (col) {
						case 0:
							return this.setTab('macro');
						case 1:
							return this.setTab('scene');
						case 2:
							return this.setTab('aux');
						case 3:
							return this.setTab('audio');
						case 4:
						case 5:
						case 6:
						case 7:
							return;
						case 8:
							return this.changePage(1);
						default:
					}
					break;
				default:
			}
		});

		this.serial.onFader((params) => {
			const { value } = params;
			let valueOut = value;
			if (this.faderReverse) {
				valueOut = 255 - value;
			}

			this.modules.atem.mix.pos(valueOut / 255);

			if (value === 255 && !this.faderReverse) {
				this.faderReverse = true;
			}
			if (value === 0 && this.faderReverse) {
				this.faderReverse = false;
			}
		});

		this.serial.onEncoder((params) => {
			if (this.rateChangeHandler) {
				this.rateChangeHandler({ direction: params.direction });
			}
		});

		this.serial.onButton('right', (params) => {
			const { row, col, pressed } = params;
			if (!pressed) {
				return;
			}

			switch (true) {
				case row === 0 && col === 0:
					return this.modules.atem.mix.previewTrans();

				case row === 0 && col === 2:
					return this.modules.atem.mix.cut();

				case row === 0 && col === 3:
					return this.modules.atem.mix.auto();

				case row === 0 && col === 7:
					if (this.rateChangeHandler) {
						this.rateChangeHandler({ push: true });
					}
					return;

				case row === 1 && col < 4:
					return this.modules.atem.mix.type(['mix', 'dip', 'wipe', 'DVE'][col]);

				case row === 3 && col < 4:
					return this.modules.atem.usk.tie({ usk: col - 1 });

				case row === 4 && col < 4:
					return this.modules.atem.usk.onair({ usk: col - 1 });

				case row >= 2 && col >= 6 && col <= 7: {
					const dsk = col - 5;

					if (row === 4) {
						return this.modules.atem.dsk.onair({ dsk });
					}
					if (row === 3) {
						return this.modules.atem.dsk.tie({ dsk });
					}
					if (row === 2) {
						return this.modules.atem.dsk.auto({ dsk });
					}
					return;
				}

				case row === 4 && col === 8:
					this.modules.atem.mix.black();
					return;

				case row === 1 && col === 8:
					this.macros.goExec(0);
					break;
				default:
			}
		});
		return Promise.resolve();
	}
}
