import OBSWebSocket from 'obs-websocket-js';

import type { ObsModule } from '.';

export abstract class ObsSubModule {
	protected client: OBSWebSocket;
	protected parent: ObsModule;
	constructor(parent: ObsModule, client: OBSWebSocket) {
		this.client = client;
		this.parent = parent;
	}

	abstract setup(): Promise<void>;
}
