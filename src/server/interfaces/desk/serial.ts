import { Socket } from 'net';

import arrayEquals from '/server/backend/helpers/array-equals';

import { BasicInterface } from './../basic-interface';
import { ConfigBackend } from '../../engine/config';
import { IModules } from '../../modules';
import { MacroEngine } from '../../engine/macros';

export type LedColor =
	| 'red'
	| 'yellow'
	| 'green'
	| 'cyan'
	| 'blue'
	| 'pink'
	| 'white'
	| 'off';

export interface LedStatus {
	color: LedColor;
	blink: LedColor;
	dim: boolean;
	fast: boolean;
}

export interface ButtonStatus {
	pressed: boolean;
	pressedAt?: Date;
}

export interface MatrixCell {
	button: ButtonStatus;
	led: LedStatus;
}

export const LED_COLOR_MAP = {
	red: 0b100,
	yellow: 0b110,
	green: 0b010,
	cyan: 0b011,
	blue: 0b001,
	pink: 0b101,
	white: 0b111,
	off: 0b000,
};

export class DeskSerialBoardInterface extends BasicInterface {
	private matrix: MatrixCell[][][] = ['left', 'right'].map(() =>
		[...Array(5)].map(() => {
			return [...Array(9)].map((): MatrixCell => {
				return {
					led: {
						color: 'off',
						blink: 'off',
						dim: true,
						fast: false,
					},
					button: {
						pressed: false,
						pressedAt: undefined,
					},
				};
			});
		}),
	);

	brightness: number = 20;
	brightnessBlink: number = 20;
	brightnessDim: number = 3;
	brightnessBlinkDim: number = 3;

	willShutdown: boolean = false;

	socket?: Socket;
	parser: any;
	interval?: NodeJS.Timeout;
	reconnectInterval?: NodeJS.Timeout;
	statusOverwriteTimer = 0;

	lastStatus: number[] = [];

	warnedOfNonexistence = false;
	config: ConfigBackend;

	constructor(config: ConfigBackend, modules: IModules, macros: MacroEngine) {
		super(config, modules, macros);
		this.config = config;
	}

	async connect(): Promise<void> {
		if (this.reconnectInterval) clearTimeout(this.reconnectInterval);
		const serialPortServer = this.config.devices[`desk`].port;
		if (serialPortServer === undefined) {
			console.log(`[SERIAL-CLIENT] Missing Server Port`);
			return;
		}
		this.socket = new Socket();
		this.socket.on('error', (err) => {
			console.log(`[SERIAL-CLIENT] Connection Error`, String(err));
		});

		try {
			console.log(`[SERIAL-CLIENT] Open localhost:${serialPortServer}`);
			this.socket.connect(serialPortServer, '127.0.0.1', () => {
				console.log(`[SERIAL-CLIENT] Connected`);
				console.log('[SERIAL-CLIENT] Setting Status Update Interval');
				this.interval = setInterval(() => {
					try {
						this.sendStatus();
					} catch (error) {
						console.log('[SERIAL-CLIENT] Error while sending Status', error);
					}
				}, 100);
			});
		} catch (error) {
			console.log('[SERIAL-CLIENT] Could not connect', error);
			this.reconnectInterval = setTimeout(() => {
				this.connect();
			}, 500);
			return;
		}

		this.socket.on('data', this.onReceive.bind(this));

		this.socket.on('close', () => {
			console.log('[SERIAL-CLIENT] Closed');
			if (this.interval) clearInterval(this.interval);
			this.interval = undefined;
			this.reconnectInterval = setTimeout(() => {
				this.connect();
			}, 1000);
		});

		return Promise.resolve();
	}
	shutdown(): Promise<void> {
		if (this.interval) clearInterval(this.interval);
		this.interval = undefined;
		this.socket?.destroy();
		return Promise.resolve();
	}
	setup(): Promise<void> {
		return Promise.resolve();
	}

	private async send(data: number[]) {
		// Sends the Data on the serial Interface
		if (this.socket) {
			const msg = data
				.map((x) => x.toString(16).padStart(2, '0').toUpperCase())
				.join(',');
			this.socket.write(msg);
		} else {
			console.log('PORT NOT OPEN');
		}
		return;
	}

	onButton(
		side: 'left' | 'right',
		handler: (params: {
			row: number;
			col: number;
			pressed: boolean;
			pressedAt: Date;
		}) => void,
	) {
		this.registerEventHandler(`button-${side}`, handler);
	}

	onFader(handler: (params: { fader: number; value: number }) => void) {
		this.registerEventHandler('fader', handler);
	}

	onEncoder(handler: (params: { encoder: number; direction: 1 | -1 }) => void) {
		this.registerEventHandler('encoder', handler);
	}

	setLed(side: 'left' | 'right', row: number, col: number, status: LedStatus) {
		const submatrix = this.matrix[side == 'left' ? 0 : 1];
		const _row = submatrix.length - row - 1;
		const cell = submatrix[_row][col];
		if (!cell) throw Error(`Cell ${_row}:${col} does not exist.`);

		cell.led = status;
	}

	setLedRow(side: 'left' | 'right', row: number, status: LedStatus[]) {
		const submatrix = this.matrix[side == 'left' ? 0 : 1];
		const _row = submatrix.length - row - 1;

		status.forEach((led, col) => {
			const cell = submatrix[_row][col];
			if (!cell) throw Error(`Cell ${_row}:${col} does not exist.`);
			cell.led = led;
		});
	}

	getButton(side: 'left' | 'right', row: number, col: number): ButtonStatus {
		const cell = this.matrix[side == 'left' ? 0 : 1][row][col];
		if (!cell) throw Error(`Cell ${row}:${col} does not exist.`);
		return cell.button;
	}

	onReceive(buf: Buffer): void {
		const data = buf.toString();
		const [address, valueRaw] = data.split('=');
		const [side, row, col] = address.split(':').map((x) => Number(x));
		const value = Number(valueRaw);
		switch (true) {
			case side === 3:
				const encoderAddress = row;
				const encoderDirection = (value & 0b00000011) == 0b00000001 ? -1 : 1;

				console.log(`BTN fader:${row}:${col}=${encoderDirection}`);
				this.runEventHandlers('encoder', {
					encoder: encoderAddress,
					direction: encoderDirection,
				});
				break;

			case side === 2:
				const faderAddress = row;
				const faderValue = value;

				console.log(`BTN fader:${row}:${col}=${value}`);
				this.runEventHandlers('fader', {
					fader: faderAddress,
					value: faderValue,
				});
				break;

			default:
				if (side == -1 || row == -1 || col == -1) {
					console.log('Address Invalid');
					break;
				}

				//The Value of a button is either pressed (0b00000001) or released (0b00000000)
				const pressed = !value;
				let pressedAt: Date | undefined = undefined;
				try {
					const cell = this.matrix[side][row][col];

					if (pressed) pressedAt = new Date();
					else pressedAt = cell.button.pressedAt;

					cell.button.pressed = pressed;
					cell.button.pressedAt = pressedAt;
				} catch (error) {
					console.log(`Cell ${side}:${row}:${col} does not exist.`);
				}

				this.runEventHandlers(`button-${side ? 'right' : 'left'}`, {
					row,
					col,
					pressed,
					pressedAt,
				});

				break;
		}
	}

	sendStatus(): Promise<void> {
		const statusMessage: number[] = [];

		//Add Global Status
		statusMessage.push(this.brightness);
		statusMessage.push(this.brightnessBlink);
		statusMessage.push(this.brightnessDim);
		statusMessage.push(this.brightnessBlinkDim);
		this.matrix.forEach((side) => {
			side.forEach((row) => {
				row.forEach((cell) => {
					const led = cell.led;

					let ledColor = LED_COLOR_MAP[led.color] << 5;
					let ledBlinkColor = LED_COLOR_MAP[led.blink] << 2;
					let ledDim = (led.dim ? 0b1 : 0b0) << 1;
					let ledFast = led.fast ? 0b1 : 0b0;
					let ledStatus = ledColor | ledBlinkColor | ledDim | ledFast;
					statusMessage.push(ledStatus);
				});
			});
		});

		if (
			!arrayEquals(statusMessage, this.lastStatus) ||
			this.statusOverwriteTimer == 0
		) {
			this.lastStatus = statusMessage;
			this.statusOverwriteTimer = 10;
			return this.send(statusMessage.map((x) => Math.max(0, Math.min(255, x))));
		}

		this.statusOverwriteTimer--;

		return Promise.resolve();
	}
}
