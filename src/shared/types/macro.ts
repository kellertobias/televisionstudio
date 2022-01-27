export type TTrigger = 'GO' | number;

export type TMacroStep = {
	name: string;
	trigger: TTrigger;
	running: boolean;
	index: number;
	done: boolean;
	started: Date;
	triggerAt: Date;
	duration: number;
	iteration: number;
	isLast: boolean;
};

export type TMacroStepEmpty = Record<string, never>;

export type TMessageMacroEmpty = {
	exec: [number, number];
	empty: true;
};

export type TMessageMacro = {
	name: string;
	exec: [number, number];
	isMaster: boolean;
	index: number;
	loop: boolean;
	run: boolean;
	wait: boolean;
	currentIndex: number;
	total: number;
	next: (TMacroStep | TMacroStepEmpty)[];
	empty?: false;
};
