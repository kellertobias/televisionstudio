import { Atem, AtemState, Commands } from 'atem-connection'


import { BasicModule } from '../basic-module';
import { ConfigBackend } from '../../engine/config';

import { AtemModuleMixer } from './mixer';
import { AtemModuleDsk } from './dsk';
import { AtemModuleUsk } from './usk';
import { AtemModuleMedia } from './media';
import { AtemModuleMacro } from './macro';
import { STYLES, STYLESREV, VIDEO_MODES } from './constants';
import { AtemSubModule } from './_sub';

type TransitionStyleNames = 'DVE' | 'mix' | 'stinger' | 'dip' | 'wipe'

export class AtemModule extends BasicModule {
    connected: boolean = false;
    client: Atem

    public mix: AtemModuleMixer
    public dsk: AtemModuleDsk
    public usk: AtemModuleUsk
    public media: AtemModuleMedia
    public macro: AtemModuleMacro

    defaultAction = ['macro', 'run']

    public channelMap: number[] = [1,2,3,4,5,6,7,8]

    static SOURCEMAP = ['CH1','CH2','CH3','CH4','CH5','CH6','CH7','CH8']

    private SOURCES : {[key: string]: number} = {
        CH1: 1,
        CH2: 2,
        CH3: 3,
        CH4: 4,
        CH5: 5,
        CH6: 6,
        CH7: 7,
        CH8: 8,
        BARS: 1000,
        COL1: 2001,
        COL2: 2002,
        MP1: 3010,
        MP1K: 3011,
        MP2: 3020,
        MP2K: 3021,
        AUX: 8001,
        BLACK: 0,
    }

    private SOURCESREV: {[key: number]: string} = {}

    videoMode : {height: number, fps: number, ratio: '16:9' | '4:3', mode: 'p' | 'i' } = {
        height: 1080,
        fps: 1,
        ratio: '16:9',
        mode: 'p'
    }

    _allModules: AtemSubModule[] = []

    constructor(config : ConfigBackend) {
        super(config)

        this.client = new Atem()

        this.updateSourcesRev()

        this.mix = new AtemModuleMixer(this, this.client)
        this.dsk = new AtemModuleDsk(this, this.client)
        this.usk = new AtemModuleUsk(this, this.client)
        this.media = new AtemModuleMedia(this, this.client)
        this.macro = new AtemModuleMacro(this, this.client)

        this._allModules = [
            this.mix, this.dsk,
            this.usk, this.media,
            this.macro
        ]

        this.client.on('stateChanged', (state, pathToChange) => {
            this._allModules.forEach(sub => sub.update(state, pathToChange))
            const videoMode = this.getVideoMode(state.settings.videoMode)

            if(videoMode.height != this.videoMode.height || videoMode.fps != this.videoMode.fps || videoMode.mode != this.videoMode.mode  || videoMode.ratio != this.videoMode.ratio) {
                this.runEventHandlers('video-mode', Object.assign({}, videoMode))
                this.videoMode = videoMode
            }
        })
    }

    onVideoModeChanged(handler: ((param: {height: number, fps: number, ratio: '16:9' | '4:3', mode: 'i' | 'p' }) => void)) {
        this.registerEventHandler('video-mode', handler)
    }

    private updateSourcesRev() {
        Object.keys(this.SOURCES).forEach((name: string) => {
            const index : number = this.SOURCES[name]
            this.SOURCESREV[index] = name
        })
    }

    connect(): Promise<void> {
        this.setChannelMap(this.config.generic.channelMap)

        return new Promise<void>((resolve, reject) => {
            console.log("[ATEM] Connecting...")
            const switcherConfig = this.config.devices.switcher
            if(switcherConfig.ip == undefined) return
            this.client.connect(switcherConfig.ip)

            this.client.on('connected', () => {
                this.connected = true
                console.log("[ATEM] Connection Opened")
                resolve()
            })

        }).then(() => {
            this._allModules.forEach(sub => sub.setup())
        }).then(() => {
            return this.client.setTransitionPosition(1).then(() => {
                this.client.setTransitionPosition(0).then(() => {})
            })
        }).then(() => {
            return this.setupMultiview(this.channelMap)
        })
    }

    setChannelMap(input: number[]) {
        input.forEach((value, index) => {
            const channel = AtemModule.SOURCEMAP[index]
            if(!value) return
            this.channelMap[index] = value
            this.SOURCES[channel] = value
        })

        this.config.generic.channelMap = this.channelMap

        this.updateSourcesRev()
        if(this.connected)
            return this.setupMultiview(input)
        return Promise.resolve()
    }

    setupMultiview(input: number[]) {
        //Index 0 and 1 are the big screens
        return Promise.all(input.map((channel, index) => {
            index = index + 2
            const c = new Commands.MultiViewerSourceCommand(0, index, channel)
            return this.client.sendCommand(c)
        })).then(() => {return Promise.resolve()})
    }

    getVideoMode(input: number) {
        return VIDEO_MODES[input]
    }

    getSourceNumber(input: string) {
        return this.SOURCES[input]
    }

    getSourceName(input: number) {
        return this.SOURCESREV[input]
    }

    getStyleName(input: number) : TransitionStyleNames {
        return STYLESREV[input] as TransitionStyleNames
    }

    getStyleNumber(input: 'DVE' | 'mix' | 'stinger' | 'dip' | 'wipe')  {
        return STYLES[input]
    }
}