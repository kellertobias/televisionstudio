export type TStatusMessage = {
	message: null | string;
	type: null | 'green' | 'yellow' | 'red';
	date?: string;
};

export type TMessageError = {
	reason: string;
};

export type TServerName =
	| 'desk'
	| 'obs'
	| 'tally'
	| 'serial'
	| 'audio'
	| 'hyperdeck'
	| 'webpresenter';

export type TServerStatus = {
	workload: {
		obs: { cpu: number; ram: number; disk: number };
		desk: { cpu: number; ram: number };
	};
	warnings: TServerName[];
};
