import OBSWebSocket from 'obs-websocket-js'
import { ObsModule } from '.'

export abstract class ObsSubModule {
    client: OBSWebSocket
    parent: ObsModule
    constructor(parent: ObsModule, client: OBSWebSocket) {
        this.client = client
        this.parent = parent
    }

    abstract setup() : Promise<void>
}