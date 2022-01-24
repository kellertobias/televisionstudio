import arrayEquals from '@/shared/array-equals';

import { ObsSubModule } from './_sub';

export interface SceneListItem {
	name: string;
	live?: boolean;
	next?: boolean;
}

export class ObsModuleScenes extends ObsSubModule {
	public scenes: SceneListItem[] = [];

	private async update() {
		if (!this.parent.connected) {
			return;
		}

		const data = await this.get();

		const allScenes = data?.scenes;

		if (!arrayEquals(this.scenes, allScenes)) {
			this.scenes = allScenes;
			this.parent.runEventHandlers('scene-list', { allScenes });
		}

		return data;
	}

	private runDurationHandlers(duration: number | undefined) {
		if (duration === undefined) {
			// eslint-disable-next-line no-param-reassign
			duration = 0;
		}

		const rate = (duration / 1000) * Math.max(this.parent.generic.fps);
		this.parent.runEventHandlers('transition-rate', { rate });
	}

	public async setup(): Promise<void> {
		setInterval(() => this.update(), 5000);

		this.client.on('SwitchScenes', (data) => {
			console.log('[OBS] SwitchScenes');
			this.scenes = this.scenes.map((scene) => {
				return {
					name: scene.name,
					live: scene.name === data['scene-name'],
				};
			});
			this.parent.runEventHandlers('scene-list', { allScenes: this.scenes });
			this.parent.runEventHandlers('scene', { name: data['scene-name'] });
		});

		this.client.on('TransitionBegin', (data) => {
			this.scenes = this.scenes.map((scene) => {
				return {
					name: scene.name,
					live: data['from-scene'] === scene.name,
					next: data['to-scene'] === scene.name,
				};
			});
			this.parent.runEventHandlers('scene-list', { allScenes: this.scenes });
		});

		this.client.on('TransitionDurationChanged', (data) => {
			this.runDurationHandlers(data['new-duration']);
		});

		this.client.on('SwitchTransition', (data) => {
			this.parent.runEventHandlers('transition-type', {
				type: data['transition-name'],
			});
		});

		const currentTransition = await this.client.send('GetCurrentTransition');
		this.runDurationHandlers(currentTransition.duration);
		this.parent.runEventHandlers('transition-type', {
			type: currentTransition.name,
		});

		await this.update();
	}

	// Event Handlers
	public onChanged(handler: (params: { currentScene: string }) => void): void {
		this.parent.registerEventHandler('scene', handler);
	}

	public onListChanged(
		handler: (params: { allScenes: SceneListItem[] }) => void,
	): void {
		// GetSceneList
		this.parent.registerEventHandler('scene-list', handler);
	}

	public onTransitionRateChanged(
		handler: (params: { rate: number }) => void,
	): void {
		this.parent.registerEventHandler('transition-rate', handler);
	}

	public onTransitionTypeChanged(
		handler: (params: { type: string }) => void,
	): void {
		this.parent.registerEventHandler('transition-type', handler);
	}

	// Actions
	public set = async (params: { name: string } | string): Promise<void> => {
		if (!this.parent.connected) {
			return Promise.resolve();
		}
		const { name } = typeof params === 'object' ? params : { name: params };
		return this.client.send('SetCurrentScene', {
			'scene-name': name,
		});
	};

	public get = async (): Promise<{
		current: string;
		scenes: { name: string; live: boolean }[];
	}> => {
		if (!this.parent.connected) {
			return null;
		}

		const data = await this.client.send('GetSceneList');
		const current = data['current-scene'];
		const scenes = data.scenes.map((scene) => {
			return {
				name: scene.name,
				live: scene.name === current,
			};
		});

		return {
			current,
			scenes,
		};
	};

	public type = async (params: { name: string } | string): Promise<void> => {
		if (!this.parent.connected) {
			return Promise.resolve();
		}
		const { name } = typeof params === 'object' ? params : { name: params };
		return this.client.send('SetCurrentTransition', {
			'transition-name': name,
		});
	};

	public rate = async (params: { frames: number } | number): Promise<void> => {
		if (!this.parent.connected) {
			return Promise.resolve();
		}
		const { frames } = typeof params === 'object' ? params : { frames: params };

		const duration = (frames * 1000) / Math.max(this.parent.generic.fps, 1);
		return this.client.send('SetTransitionDuration', { duration });
	};
}
