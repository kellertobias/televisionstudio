export type TStatusMessage = {
	message: null | string;
	type: null | 'green' | 'yellow' | 'red';
	date?: string;
};

export type TMessageError = {
	reason: string;
};
