import { ObsSubModule } from './_sub';

export class ObsModuleGeneric extends ObsSubModule {
    fps: number = 0
    outputWidth: number = 0
    outputHeight: number = 0

    _update() {
        if(!this.parent.connected) return Promise.resolve()
        return this.get().then((data: any) => {
            const fps = data.fps
            const width = data.outputWidth
            const height = data.outputHeight
            
            if(fps != this.fps || width != this.outputWidth || height != this.outputHeight) {
                this.fps = fps
                this.outputHeight = height
                this.outputWidth = width

                this.parent.runEventHandlers('output', {width, height, fps})
            }
        })
    }

    setup = () => {
        setInterval(() => this._update(), 5000)
        return this._update()
    }

    // Event Handlers
    onVideoSetupChanged(handler: ((params: {
        width: number,
        height: number,
        fps: number
    }) => void)) {
        this.parent.registerEventHandler('output', handler)
    }

    //Actions

    get = async (_params?: {}) => {
        return this.client.send("GetVideoInfo").then((data: any) => {
            const fps = data.fps
            const outputWidth = data.outputWidth
            const outputHeight = data.outputHeight
            
            return {fps, outputHeight, outputWidth}
        })
    }
}