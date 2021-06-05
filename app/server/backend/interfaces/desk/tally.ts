import { BasicInterface } from "./../basic-interface";
import { MacroEngine } from '../../engine/macros';
import { ConfigBackend } from "../../engine/config";
import { iModules } from "../../modules";
import fetch from 'node-fetch'

export class DeskTallyInterface extends BasicInterface {
    connected: boolean = false;
    config: ConfigBackend;
    tallyUpdateInterval?: NodeJS.Timeout;

    constructor(config: ConfigBackend, modules: iModules, macros: MacroEngine) {
        super(config, modules, macros)
        this.config = config
    }

    private send(path: string, method: string, body?: any) {
        return fetch(`http://${this.config.devices.tally.ip}:${this.config.devices.tally.port}${path}`, {
            headers: { "Content-Type": "application/json" },
            method,
            body,
        }).catch((err: any) => {
            console.log("[TLY] ERROR: ", String(err))
            return Promise.reject('Tally Server not Responding')
        })
    }

    sendTally(pgm: number, pvw: number) {
        if(!this.connected) return
        this.send(`/tally?pgm=${pgm}&pvw=${pvw}`, 'GET')
    }

    connect(): Promise<void> {
        this.connected = true
        return Promise.resolve()
    }
    shutdown(): Promise<void> {
        this.connected = false
        if(this.tallyUpdateInterval) {
            clearInterval(this.tallyUpdateInterval)
        }
        return Promise.resolve()
    }
    setup(): Promise<void> {
        this.modules.atem.mix.onChange(({pgm, pvw}) => {
            console.log("TALLY", {pgm, pvw})
            this.sendTally(
                this.modules.atem.getSourceNumber(pgm), 
                this.modules.atem.getSourceNumber(pvw)
            )
        })

        this.tallyUpdateInterval = setInterval(() => {
            const pgm = this.modules.atem.mix.current.pgm
            const pvw = this.modules.atem.mix.current.pvw

            this.sendTally(
                this.modules.atem.getSourceNumber(pgm), 
                this.modules.atem.getSourceNumber(pvw)
            )
        }, 10000)

        return Promise.resolve()
    }
    
}
