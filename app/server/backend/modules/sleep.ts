import { ConfigBackend } from '../engine/config';
import { BasicModule } from './basic-module';

export class SleepModule extends BasicModule {
    connected: boolean = true
    timeouts: NodeJS.Timeout[] = []

    defaultAction = ['wait']

    constructor(config : ConfigBackend) {
        super(config)

    }

    async connect() {
        return Promise.resolve()
    }

    async updateAll() {
        return Promise.resolve()
    }

    abort = async (_params?: {}) => {
        this.timeouts.forEach(t => {
            clearTimeout(t)
        })
        return Promise.resolve()
    }

    wait = async (params: {time: number} | number): Promise<void> => {
        const {time} = typeof(params) == 'object' ? params : {time: params}

        return new Promise((resolve, _reject) => {
            const t = setTimeout(() => {
                return resolve()
            }, time * 1000)
            this.timeouts.push(t)

        })
    }
}