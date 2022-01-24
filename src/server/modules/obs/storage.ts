import { ObsSubModule } from './_sub';

export class ObsModuleStorage extends ObsSubModule {
	public setup(): Promise<void> {
		return Promise.resolve();
	}

	public setProfile = async (
		params: { name: string } | string,
	): Promise<void> => {
		if (!this.parent.connected) {
			return Promise.resolve();
		}
		const { name } = typeof params === 'object' ? params : { name: params };
		return this.client.send('SetCurrentProfile', {
			'profile-name': name,
		});
	};

	public getProfile = async (): Promise<string | void> => {
		if (!this.parent.connected) {
			return Promise.resolve();
		}
		const data = await this.client.send('GetCurrentProfile');
		return data['profile-name'];
	};

	public listProfiles = async (): Promise<void | string[]> => {
		if (!this.parent.connected) {
			return Promise.resolve();
		}
		const data = await this.client.send('ListProfiles');
		return data.profiles.map((p) => p['profile-name']);
	};

	public setSceneCollection = async (
		params: { name: string } | string,
	): Promise<void> => {
		const { name } = typeof params === 'object' ? params : { name: params };
		console.log(
			`[OBS] TRY Set Scene Collection to > ${name}`,
			this.parent.connected,
		);
		if (!this.parent.connected) {
			return Promise.resolve();
		}
		console.log(`[OBS] Set Scene Collection to > ${name}`);

		return this.client.send('SetCurrentSceneCollection', {
			'sc-name': name,
		});
	};

	public getSceneCollection = async (): Promise<string | void> => {
		if (!this.parent.connected) {
			return Promise.resolve();
		}
		const data = await this.client.send('GetCurrentSceneCollection');
		return data['sc-name'];
	};

	public listSceneCollection = async (): Promise<void | string[]> => {
		if (!this.parent.connected) {
			return Promise.resolve();
		}
		const data = await this.client.send('ListSceneCollections');

		return data['scene-collections'].map((p) => p['sc-name']);
	};
}
