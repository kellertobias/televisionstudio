import { ConfigBackend } from '../../engine/config';
import { BasicModule } from '../basic-module';
import OBSWebSocket from 'obs-websocket-js'

import { ObsModuleAudio } from './audio';
import { ObsModuleGeneric } from './generic';
import { ObsModuleOutput } from './output';
import { ObsModuleStorage } from './storage';
import { ObsModuleScenes } from './scene';

export class ObsModule extends BasicModule {
    connected: boolean = false;
    client : OBSWebSocket;
    
    scene: ObsModuleScenes
    audio: ObsModuleAudio;
    generic: ObsModuleGeneric;
    output: ObsModuleOutput;
    storage: ObsModuleStorage;

    printedConnectionError = false

    defaultAction = ['scenes', 'set']
    connectingTimeout?: NodeJS.Timeout;

    constructor(config : ConfigBackend) {
        super(config)
        this.client = new OBSWebSocket()

        this.client.on("ConnectionOpened", () => {
            this.connected = true
            console.log("[OBS] Connected")
            this.runEventHandlers('connection-status', {connected: true})
        })

        this.client.on("ConnectionClosed", () => {
            if(this.connected) {
                this.connected = false
                console.log("[OBS] Disconnected")
                this.runEventHandlers('connection-status', {connected: false})
            }

            // Try to reconnect
            this.connect()
        })

        this.scene = new ObsModuleScenes(this, this.client)
        this.audio = new ObsModuleAudio(this, this.client)
        this.generic = new ObsModuleGeneric(this, this.client)
        this.output = new ObsModuleOutput(this, this.client)
        this.storage = new ObsModuleStorage(this, this.client)
    }

    private _connect = (): Promise<boolean> => {
        if(this.connectingTimeout !== undefined) {
            clearTimeout(this.connectingTimeout)
        }
        return new Promise<boolean>((resolve, reject) => {
            this.connectingTimeout = setTimeout(() => {
                if(this.connectingTimeout !== undefined) {
                    clearTimeout(this.connectingTimeout)
                }
                    
                this.client.connect({
                    address: `${this.config.devices.obs.ip}:${this.config.devices.obs.port}`
                }).then(() => {
                    this.connected = true
                    this.printedConnectionError = false
                    return resolve(true)
                }).catch((err: any) => {
                    this.connected = false
                    if(!this.printedConnectionError) {
                        console.log("[OBS] Error", err)
                        this.printedConnectionError = true
                    }
                    return resolve(false)
                })
            }, 1000)
        })
    }

    connect = async () => {
        return this._connect().then((connected) => {
            if(connected) return this.setupAll()
        })
    }

    waitForConnection = () : Promise<void> => {
        console.log("[OBS] Wait for Connection")
        if(this.connected) return Promise.resolve()
        let resolved = false;
        return new Promise((resolve, reject) => {
            this.registerEventHandler('connection-status', (connected) => {
                if(!connected) return
                if(resolved) return
                resolved = true
                console.log("[OBS] Wait for Connection - Connected")
                return resolve()
            })
        })
    }

    // Event Handlers
    onStatus(handler: ((params: {connected: boolean}) => void)) {
        this.registerEventHandler('connection-status', handler)
    }

    setupAll = async () => {
        await this.generic.setup()
        await this.output.setup()
        await this.scene.setup()
        await this.audio.setup()
        await this.storage.setup()
        console.log("[OBS] Setup Done")
        return Promise.resolve()
    }
}