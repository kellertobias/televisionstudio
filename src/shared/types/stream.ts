export type TLiveStatus = 'idle' | 'starting' | 'stopping' | 'running';

export type TMessageStream = {
	status: TLiveStatus;
	time: string;
	skipped: number;
	bandwidth: number;
	server?: { server: string; key: string };
};

export type TMessageRecord = {
	status: TLiveStatus;
	time: string;
};
