import arrayEquals from '/server/backend/helpers/array-equals';
import { ObsSubModule } from './_sub';

export interface SceneListItem {
	name: string;
	live?: boolean;
	next?: boolean;
}

export class ObsModuleScenes extends ObsSubModule {
	scenes: SceneListItem[] = [];

	_update() {
		if (!this.parent.connected) return Promise.resolve();
		this.get().then((data: any) => {
			const allScenes = data.scenes;

			if (!arrayEquals(this.scenes, allScenes)) {
				this.scenes = allScenes;
				this.parent.runEventHandlers('scene-list', { allScenes });
			}
		});
	}

	_runDurationHandlers(duration: number | undefined) {
		if (duration === undefined) duration = 0;
		const rate = (duration / 1000) * Math.max(this.parent.generic.fps);
		this.parent.runEventHandlers('transition-rate', { rate });
	}

	setup(): Promise<void> {
		setInterval(() => this._update(), 5000);

		this.client.on('SwitchScenes', (data: any) => {
			console.log('[OBS] SwitchScenes');
			this.scenes = this.scenes.map((scene) => {
				return {
					name: scene.name,
					live: scene.name == data['scene-name'],
				};
			});
			this.parent.runEventHandlers('scene-list', { allScenes: this.scenes });
			this.parent.runEventHandlers('scene', { name: data['scene-name'] });
		});

		this.client.on('TransitionBegin', (data: any) => {
			this.scenes = this.scenes.map((scene) => {
				return {
					name: scene.name,
					live: data['from-scene'] == scene.name,
					next: data['to-scene'] == scene.name,
				};
			});
			this.parent.runEventHandlers('scene-list', { allScenes: this.scenes });
		});

		this.client.on('TransitionDurationChanged', (data: any) => {
			this._runDurationHandlers(data['new-duration']);
		});

		this.client.on('SwitchTransition', (data: any) => {
			this.parent.runEventHandlers('transition-type', {
				type: data['transition-name'],
			});
		});

		return this.client.send('GetCurrentTransition').then((data) => {
			this._runDurationHandlers(data['duration']);

			this.parent.runEventHandlers('transition-type', {
				type: data['name'],
			});

			return this._update();
		});
	}

	// Event Handlers
	onChanged(handler: (params: { currentScene: string }) => void) {
		this.parent.registerEventHandler('scene', handler);
	}

	onListChanged(handler: (params: { allScenes: SceneListItem[] }) => void) {
		// GetSceneList
		this.parent.registerEventHandler('scene-list', handler);
	}

	onTransitionRateChanged(handler: (params: { rate: number }) => void) {
		this.parent.registerEventHandler('transition-rate', handler);
	}

	onTransitionTypeChanged(handler: (params: { type: string }) => void) {
		this.parent.registerEventHandler('transition-type', handler);
	}

	//Actions
	set = async (params: { name: string } | string) => {
		if (!this.parent.connected) return Promise.resolve();
		const { name } = typeof params == 'object' ? params : { name: params };
		return this.client.send('SetCurrentScene', {
			'scene-name': name,
		});
	};

	get = async (_params?: {}) => {
		if (!this.parent.connected) return Promise.resolve();
		return this.client.send('GetSceneList').then((data: any) => {
			const current = data['current-scene'];
			const scenes = data.scenes.map((scene: any) => {
				return {
					name: scene.name,
					live: scene.name == current,
				};
			});

			return Promise.resolve({
				current,
				scenes,
			});
		});
	};

	type = async (params: { name: string } | string) => {
		if (!this.parent.connected) return Promise.resolve();
		const { name } = typeof params == 'object' ? params : { name: params };
		return this.client.send('SetCurrentTransition', {
			'transition-name': name,
		});
	};

	rate = async (params: { frames: number } | number) => {
		if (!this.parent.connected) return Promise.resolve();
		const { frames } = typeof params == 'object' ? params : { frames: params };

		const duration = (frames * 1000) / Math.max(this.parent.generic.fps, 1);
		return this.client.send('SetTransitionDuration', { duration });
	};
}
