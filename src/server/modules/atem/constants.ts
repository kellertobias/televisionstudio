const VIDEO_MODES: {
	[key: number]: {
		height: number;
		fps: number;
		ratio: '4:3' | '16:9';
		mode: 'i' | 'p';
	};
} = {
	'0': { fps: 59.94, height: 525, ratio: '4:3', mode: 'i' },
	'2': { fps: 59.94, height: 525, ratio: '16:9', mode: 'i' },
	'1': { fps: 50, height: 625, ratio: '4:3', mode: 'i' },
	'3': { fps: 50, height: 625, ratio: '16:9', mode: 'i' },
	'4': { fps: 50, height: 720, ratio: '16:9', mode: 'p' },
	'5': { fps: 59.94, height: 720, ratio: '16:9', mode: 'p' },
	'6': { fps: 50, height: 1080, ratio: '16:9', mode: 'i' },
	'7': { fps: 59.94, height: 1080, ratio: '16:9', mode: 'i' },
	'8': { fps: 23.98, height: 1080, ratio: '16:9', mode: 'p' },
	'9': { fps: 24, height: 1080, ratio: '16:9', mode: 'p' },
	'10': { fps: 25, height: 1080, ratio: '16:9', mode: 'p' },
	'11': { fps: 29.97, height: 1080, ratio: '16:9', mode: 'p' },
	'12': { fps: 50, height: 1080, ratio: '16:9', mode: 'p' },
	'13': { fps: 59.94, height: 1080, ratio: '16:9', mode: 'p' },
};

const STYLES: { [key: string]: number } = {
	mix: 0,
	dip: 1,
	wipe: 2,
	DVE: 3,
};

const STYLESREV: { [key: number]: string } = {};
Object.keys(STYLES).forEach((name: string) => {
	const index: number = STYLES[name];
	STYLESREV[index] = name;
});

const ME = 0;
const AUXBUS = 0;

export { ME, AUXBUS, STYLES, STYLESREV, VIDEO_MODES };
