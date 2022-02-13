export type TStatusMessage = {
	message: null | string;
	type: null | 'green' | 'yellow' | 'red';
	date?: string;
};

export type TMessageError = {
	reason: string;
};

export type TServerName =
	| 'atem'
	| 'desk'
	| 'obs'
	| 'text'
	| 'tally'
	| 'serial'
	| 'audio'
	| 'hyperdeck'
	| 'webpresenter';

export type TServerStatus = {
	workload: {
		obs: { cpu: number };
		desk: { cpu: number; ram: number };
	};
	warnings: Partial<Record<TServerName, string>>;
};
