import { ConfigBackend } from '../engine/config';
import { BasicModule } from './basic-module';
import os from 'os-utils'
import fetch from 'node-fetch'

export class SystemStateModule extends BasicModule {
    connected: boolean = true
    timeouts: NodeJS.Timeout[] = []

    defaultAction = ['']
    interval?: NodeJS.Timeout;

    status : {[key: string]: {cpu: number, ram: number, disk?: number}} = {
        desk: {
            cpu: 0,
            ram: 0,
        },
        obs: {
            cpu: 0,
            ram: 0,
            disk: 0,
        }
    }

    errorPrinted = false

    constructor(config : ConfigBackend) {
        super(config)
        this.config = config
    }

    getRemoteStatus() {
        if(!this.config.devices.textgen.ip) throw Error("No IP for Textgen")
        if(!this.config.devices.textgen.port) throw Error("No PORT for Textgen")
        return fetch(`http://${this.config.devices.textgen.ip}:${this.config.devices.textgen.port}/status`, {
            headers: { "Content-Type": "application/json" },
            method: "GET",
        }).then((data) => {
            if(!data) return
            return data.json()
        }).then((data) => {
            this.errorPrinted = false
            return data
        }).catch((err) => {
            if(!this.errorPrinted) {
                if(err.code == 'ECONNREFUSED') {
                    console.error("[STATUS] ERROR: Connection Refused")
                } else {
                    console.log("[STATUS] ERROR: ", err)
                }
                this.errorPrinted = true
            }
        })
    }
    
    onUpdate(handler: ((params: {
        obs: {cpu: number, ram: number, disk: number},
        desk: {cpu: number, ram: number},
    }) => void)) {
        this.registerEventHandler('status', handler)
    }

    async connect() {
        this.interval = setInterval(() => {
            this.getRemoteStatus().then((data) => {
                const obs = data ? {
                    cpu: data.cpu, ram: data.ram, disk: data.disk.used / data.disk.total
                } : {cpu: 1, ram: 1, disk: 1}

                this.runEventHandlers('status', {
                    obs: obs,
                    desk: {
                        cpu: os.loadavg(1) / os.cpuCount(),
                        ram: 1 - os.freememPercentage()
                    }
                })
            })
        }, 1000)
        return Promise.resolve()
    }

}