import { ConfigBackend } from '../engine/config';
import { BasicModule } from './basic-module';
import fetch from 'node-fetch'

export class TextgenModule extends BasicModule {
    connected: boolean = true
    timeouts: NodeJS.Timeout[] = []

    defaultAction = ['show']

    constructor(config : ConfigBackend) {
        super(config)
        this.config = config
    }

    async connect() {
        return Promise.resolve()
    }

    async updateAll() {
        return Promise.resolve()
    }

    private _send(path: string, method: string, body: any) {
        if(typeof body === 'object') {
            body = JSON.stringify(body)
        }

        return fetch(`http://${this.config.devices.textgen.ip}:${this.config.devices.textgen.port}${path}`, {
            headers: { "Content-Type": "application/json" },
            method,
            body,
        }).catch((err: any) => {
            console.log("[TXT] ERROR: ", String(err))
            return Promise.reject('TextGen Server Error: ' + String(err))
        })
    }

    clear = async (_params?: {}) => {
        return this._send('/text', 'post', {lines: ["", "", ""]})
    }

    show = async (params: {content?: any, scope?: string} | string) => {
        const {content, scope} = typeof(params) == 'object' ? params : {content: [params || ''], scope: 'textgen'}
        return this._send('/text', 'post', {content, scope})
        
    }
}
