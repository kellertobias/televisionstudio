import { ObsSubModule } from './_sub';

export class ObsModuleStorage extends ObsSubModule {
    setup() {
        return Promise.resolve()
    }
    
    setProfile = async(params: {name: string} | string) => {
        if(!this.parent.connected) return Promise.resolve()
        const {name} = typeof(params) == 'object' ? params : {name: params}
        return this.client.send('SetCurrentProfile', {
            "profile-name": name
        })
    }

    getProfile = async(_params?: {})  => {
        if(!this.parent.connected) return Promise.resolve()
        return this.client.send('GetCurrentProfile').then((data: {'profile-name': string}) => {
            return Promise.resolve(data['profile-name'])
        })
    }

    listProfiles = async(_params?: {})  => {
        if(!this.parent.connected) return Promise.resolve()
        return this.client.send('ListProfiles').then((data: any) => {
            const profiles : string[] = data['profiles'].map((p: any) => p['profile-name'])
            return Promise.resolve(profiles)
        })
    }

    setSceneCollection = async(params: {name: string} | string) => {
        const {name} = typeof(params) == 'object' ? params : {name: params}
        console.log(`[OBS] TRY Set Scene Collection to > ${name}`, this.parent.connected)
        if(!this.parent.connected) return Promise.resolve()
        console.log(`[OBS] Set Scene Collection to > ${name}`)
        return this.client.send('SetCurrentSceneCollection', {
            "sc-name": name
        })
    }

    getSceneCollection = async(_params?: {})  => {
        if(!this.parent.connected) return Promise.resolve()
        return this.client.send('GetCurrentSceneCollection').then((data: {'sc-name': string}) => {
            return Promise.resolve(data['sc-name'])
        })
    }

    listSceneCollection = async(_params?: {})  => {
        if(!this.parent.connected) return Promise.resolve()
        return this.client.send('ListProfiles').then((data: any) => {
            const profiles : string[] = data['scene-collections'].map((p: any) => p['sc-name'])
            return Promise.resolve(profiles)
        })
    }
}