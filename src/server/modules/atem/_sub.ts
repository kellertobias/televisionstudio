import { Atem, AtemState } from 'atem-connection';
import { AtemModule } from '.';

export abstract class AtemSubModule {
	client: Atem;
	parent: AtemModule;
	constructor(parent: AtemModule, client: Atem) {
		this.parent = parent;
		this.client = client;
	}

	abstract setup(): Promise<void>;
	abstract update(status: AtemState, pathToChange: string[]): Promise<void>;
}
