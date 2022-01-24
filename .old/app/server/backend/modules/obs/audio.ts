import { ObsSubModule } from './_sub';

export class ObsModuleAudio extends ObsSubModule {
    setup(): Promise<void> {
        return Promise.resolve()
    }

    volume = async (params: {source: string, volume: number}) => {
        if(!this.parent.connected) return Promise.resolve()
        const {source, volume} = params
        return this.client.send('SetVolume', {
            source, volume, useDecibel: false
        })
    }

    mute = async (params: {source: string} | string) => {
        if(!this.parent.connected) return Promise.resolve()
        const {source} = typeof(params) == 'object' ? params : {source: params}
        return this.client.send('SetMute', {
            source, mute: true
        })
    }

    unmute = async (params: {source: string} | string) => {
        if(!this.parent.connected) return Promise.resolve()
        const {source} = typeof(params) == 'object' ? params : {source: params}
        return this.client.send('SetMute', {
            source, mute: false
        })
    }

    sync = async (params: {source: string, offset: number}) => {
        if(!this.parent.connected) return Promise.resolve()
        const {source, offset} = params
        return this.client.send('SetSyncOffset', {
            source, offset
        })
    }

}