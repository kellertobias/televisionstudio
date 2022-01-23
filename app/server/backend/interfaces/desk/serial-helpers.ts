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

export const matrix: MatrixCell[][][] = ['left', 'right'].map(() =>
	[...Array(5)].map(() => {
		return [...Array(9)].map(
			(): MatrixCell => {
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
			},
		);
	}),
);
