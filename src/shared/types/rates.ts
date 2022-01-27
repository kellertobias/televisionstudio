export type TRateTypes = 'obs' | 'master' | 'dsk1' | 'dsk2';
export type TMessageRates = {
	[key in TRateTypes]: number;
} & {
	_rateSelected: TRateTypes;
};

interface SingleNorm {
	size: string;
	fps: number;
}

export type TMessageGlobalNorm = {
	obs: SingleNorm;
	atem: SingleNorm;
};
