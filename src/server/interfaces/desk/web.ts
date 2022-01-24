import fs from 'fs'
import { BasicInterface } from "./../basic-interface";
import { MicroWebsocketServer } from '../../engine/websocket-server';
import { MacroEngine } from '../../engine/macros';
import { ConfigBackend, DeviceParameters } from "../../engine/config";
import { iModules } from "../../modules";
import { Macro } from '../../engine/macros/macro';
import { MacroStep } from "../../engine/macros/step";
import { DeskKeyboardInterface } from "./keyboard";
import { address } from '../../helpers/server-ip'
import {exec} from 'child_process'

interface TransitionRates {obs: number, master: number, dsk1: number, dsk2: number}
interface SingleNorm {size: string, fps: number}
interface Norms {obs: SingleNorm, atem: SingleNorm}
export class DeskWebInterface extends BasicInterface {
    server: MicroWebsocketServer;
    public rateSelected: string = 'master'
    public currentRates: TransitionRates = {obs: 1, master: 1, dsk1: 1, dsk2: 1}
    public showTime: Date 
    public norms: Norms = {
        obs: {
            size: '0x0',
            fps: 1
        },
        atem: {
            size: '0x0',
            fps: 1
        },
    }
    public connectionStatus = {
        atem: false,
        obs: false,
        textgen: false
    }

    keyboard: DeskKeyboardInterface;
    bootedAt: Date;
    config: ConfigBackend;

    constructor(config: ConfigBackend, modules: iModules, macros: MacroEngine, server: MicroWebsocketServer) {
        super(config, modules, macros)
        this.config = config
        this.server = server
        this.showTime = new Date((new Date()).getTime() + 1000 * 3600)
        this.keyboard = new DeskKeyboardInterface(config, this.modules, this.macros),
        this.bootedAt = new Date()
    }

    connect(): Promise<void> {
        this.keyboard.connect()
        this.showTime = this.config.generic.showStart
        return Promise.resolve()
    }
    shutdown(): Promise<void> {
        this.keyboard.shutdown()
        return Promise.resolve()
    }

    _buildRatesAnswer(ratesIn: Partial<TransitionRates>) {
        return {
            _rateSelected: this.rateSelected,
            ...this.currentRates, ...ratesIn
        }
    }

    _macroStepMap(macro: Macro, step: MacroStep | undefined) {
        if(!step) return {}
        return {
            name: step.name,
            trigger: step.trigger,
            running: step.running,
            index: step.stepNumber,
            done: step.done,
            started: step.started,
            triggerAt: step.triggerAt,
            duration: step.duration,
            iteration: 0,
            isLast: step.stepNumber == macro.steps.length - 1,
        }
    }

    _macroMap(macro: Macro | null, page: number, exec: number) {
        if(!macro) return {exec: [page, exec], empty: true}
        const maxSteps = 9
        const currentStepNumber = (macro.earliestStepRunning - 1) % macro.steps.length
        const maxStepNumber = (macro.latestStepRunning - 1) % macro.steps.length
        const nextSteps = macro.steps.slice(Math.max(0, currentStepNumber)).map((step) => {
            return this._macroStepMap(macro, step)
        }).filter(x => x).slice(0, maxSteps + 1)

        const offset = currentStepNumber + nextSteps.length


        if(macro.loop && nextSteps.length < maxSteps) {
            for (let extraIndex = 0; extraIndex < maxSteps; extraIndex++) {
                const extraStep = macro.steps[extraIndex % macro.steps.length]
                const mappedStep = this._macroStepMap(macro, extraStep)

                if(extraIndex + offset > maxStepNumber) {
                    mappedStep.done = false
                    mappedStep.running = false
                    mappedStep.started = undefined
                    mappedStep.triggerAt = undefined
                }
                if(currentStepNumber > extraIndex) {
                    mappedStep.iteration = 0
                } else {
                    mappedStep.iteration = Math.floor(extraIndex / macro.steps.length) + 1
                    mappedStep.done = false
                    mappedStep.running = false
                    mappedStep.started = undefined
                    mappedStep.triggerAt = undefined
                }

                nextSteps.push(mappedStep)
            }
        }
        return {
            name: macro.name,
            exec: macro.executor,
            isMaster: macro.isMaster,
            index: macro.index,
            loop: macro.loop,
            run: macro.running,
            wait: macro.waiting,
            currentIndex: currentStepNumber + 1,
            total: macro.steps.length,
            next: nextSteps
        }
    }

    publishGlobalSettings() {
        this.server.publish('/d/system-settings', {
            channelMap: this.modules.atem.channelMap,
            brightnessMain: this.keyboard.brightnessMain,
            brightnessDim: this.keyboard.brightnessDim,
            panelIp: address,
            panelBoot: this.bootedAt,
        })
    }

    publishInitialMacos() {
        if(this.macros.master) this.server.publish('/d/macros/master', this._macroMap(this.macros.master, 0, 0))
        for (let index = 1; index <= 8; index++) {
            const macro = this.macros.getMacro(index)
            if(!macro) {
                this.server.publish(`/d/macros/${index}`, this._macroMap(null, this.macros.page, index + 1))
            } else {
                this.server.publish(`/d/macros/${index}`, this._macroMap(macro, macro.executor[0], macro.executor[1]))
            }
            
        }
    }

    setupActions() {
        this.server.methods({
            '/action/macros/reset': (params: {exec: number}) => {
                const {exec} = params
                return this.macros.resetExec(exec)
                
            },
            '/action/macros/go': (params: {exec: number}) => {
                const {exec} = params
                return this.macros.goExec(exec)
            },
            '/action/macros/master': (params: {macroIndex: number}) => {
                const {macroIndex} = params
                return this.macros.selectMaster({macroIndex})
            },
            '/action/rate/change': (params: {selectRate: string}) => {
                const { selectRate } = params
                this.rateSelected = selectRate

                this.server.publish('/d/trans-rate', this._buildRatesAnswer({}))

                return Promise.resolve()
            },
            '/action/scene/set': (params: {name: string}) => {
                this.modules.obs.scene.set(params)
                return Promise.resolve()
            },
            '/action/system/set-target-time': (params: {time: string}) => {
                const { time } = params
                this.showTime = new Date(time)
                this.server.publish('/d/calendar', {showStart: this.showTime})
                this.config.generic.showStart = this.showTime
                this.config.store()
                return Promise.resolve()
            },
            '/action/system-settings/brightness': (params: {main: number, dim: number}) => {
                const {main, dim} = params
                this.keyboard.setBrightness(Number(main || 0), Number(dim || 0))
                this.publishGlobalSettings()
                return this.config.store()
            },
            '/action/system-settings/channel-map': (params: {channelMap: number[]}) => {
                const {channelMap} = params
                this.modules.atem.setChannelMap(channelMap)
                this.publishGlobalSettings()
                return this.config.store()
            },
            '/action/system-settings/power': (params: {reload?: boolean, shutdown?:boolean, reboot?: boolean}) => {
                switch(true) {
                    case params.reload:
                        this.macros.loadMacroStore()
                        this.macros.init()
                        return
                    case params.shutdown:
                        console.log("GRACEFUL SHUTDOWN")
                        process.exit()
                        return
                    case params.reboot:
                        console.log("REBOOT OF SERVER")
                        exec('shutdown now', (nodeErr, out, err) => {
                            console.log("SHUTDOWN", out);
                        });

                        return
                }
            },
            '/action/system-settings/devices': (params: {section: keyof ConfigBackend["devices"], parameter: keyof DeviceParameters, value: any}) => {
                const {section, parameter, value} = params
                if(this.config.devices[section] == undefined) {
                    throw Error("Wrong Section Name")
                }
                this.config.devices[section][parameter] = value
                return this.config.store()
                
            },
            '/action/loader/browser': (params: {subpath?: string[]}) => {
                return this.config.listShowFiles(params.subpath || []).then((files) => {
                    return {
                        files,
                        current: {
                            file: this.config.showfile,
                            title: this.config.showfileTitle
                        }
                    }
                })
            },
            '/action/loader/load': (params: {subpath: string[]}) => {
                this.config.setShowFile(params.subpath)
                this.macros.loadMacroStore()
                this.macros.init()

                this.publishInitialMacos()
            },
        })

        this.server.publish('/d/trans-rate', this._buildRatesAnswer({}))
    }

    setupDataSourcesMixer() {
        this.modules.atem.mix.onTransitionPosition((params) => {
            const {pos} = params
            this.server.publish('/d/trans-pos', pos)
        })

        this.modules.atem.mix.onTransitionRate((params) => {
            const {rate} = params
            this.currentRates.master = rate
            this.server.publish('/d/trans-rate', this._buildRatesAnswer({master: rate}))
        })

        this.modules.atem.dsk.onRate((param) => {
            const {rate} = param
            const dsk = param.dsk as ('dsk1' | 'dsk2')
            

            this.currentRates[dsk] = rate
            this.server.publish('/d/trans-rate', this._buildRatesAnswer({[dsk]: rate}))
        })

        this.modules.atem.onVideoModeChanged((param) => {
            const {height, mode, fps} = param
            this.norms.atem = {
                size: `${height}${mode}`,
                fps: fps
            }

            this.server.publish('/d/global', this.norms)

            this.connectionStatus.atem = true
            this.server.publish('/d/module-connection', this.connectionStatus)
        })

    }

    setupDataSourcesObs() {
        this.modules.obs.onStatus((params) => {
            this.connectionStatus.obs = params.connected
            this.server.publish('/d/module-connection', this.connectionStatus)
        })
        this.modules.obs.scene.onListChanged((params) => {
            const {allScenes} = params
            this.server.publish('/d/scenes', allScenes)
        })

        this.modules.obs.scene.onTransitionRateChanged((params) => {
            const {rate} = params
            this.currentRates.obs = rate
            this.server.publish('/d/trans-rate', this._buildRatesAnswer({obs: rate}))
        })

        this.modules.obs.generic.onVideoSetupChanged((params) => {
            const {height, fps} = params
            this.norms.obs = {
                size: `${height}p`,
                fps: fps
            }

            this.server.publish('/d/global', this.norms)
        })

        this.modules.obs.output.onRecordingChanged((params) => {
            const {status, time} = params

            this.server.publish('/d/recording', {status, time})
        })

        this.modules.obs.output.onStreamChanged((params) => {
            const {status, time, skipped, bandwidth, server} = params

            this.server.publish('/d/streaming', {status, time, skipped, bandwidth, server})
        })

        this.server.publish('/d/scenes', [])

    }

    setupDataSourcesMacros() {
        this.macros.onMasterExecutorChange((param) => {
            const {macro} = param
            this.server.publish('/d/macros/master', this._macroMap(macro, 0, 0))
        })

        this.macros.onExecutorChange((param) => {
            const {macro, pageNumber, executorNumber} = param
            this.server.publish(`/d/macros/${executorNumber}`, this._macroMap(macro, pageNumber, executorNumber))
        })

        this.publishInitialMacos()
    }

    setup(): Promise<void> {
        this.keyboard.onRateChange((params) => {
            const {push, direction} = params
            if(push) {
                let selectRate = 'master'
                switch(this.rateSelected) {
                    case 'master':
                        selectRate = 'obs'
                        break
                    case 'obs':
                        selectRate = 'dsk1'
                        break
                    case 'dsk1':
                        selectRate = 'dsk2'
                        break
                    case 'dsk2':
                        selectRate = 'master'
                        break
                }
                this.rateSelected = selectRate
            }
            if(direction) {
                switch(this.rateSelected) {
                    case 'obs':
                        this.modules.obs.scene.rate(this.currentRates.obs + direction)
                        break
                    case 'master':
                        this.modules.atem.mix.rate(this.currentRates.master + direction)
                        break
                    case 'dsk1':
                        this.modules.atem.dsk.rate({dsk: 1, rate: this.currentRates.dsk1 + direction})
                        break
                    case 'dsk2':
                        this.modules.atem.dsk.rate({dsk: 2, rate: this.currentRates.dsk1 + direction})
                        break
                }
            }

            this.server.publish('/d/trans-rate', this._buildRatesAnswer({}))
        })

        this.modules.status.onUpdate((params) => {
            this.server.publish('/d/usage', params)
        })

        this.keyboard.setup()

        this.setupActions()

        this.setupDataSourcesMixer()
        this.setupDataSourcesObs()
        this.setupDataSourcesMacros()
        this.publishGlobalSettings()

        this.server.publish('/d/calendar', {showStart: this.showTime})
        this.server.publish('/d/module-connection', this.connectionStatus)

        this.config.onSaveCallback(() => {
            this.server.publish('/d/message', {date: new Date(), message: "Config Saved", type: 'green'})
        })

        process.on('unhandledRejection', (error: PromiseRejectionEvent) => {
            // Will print "unhandledRejection err is not defined"
            const msg = error?.reason ?? (error ? String(error) : 'Unknown Server Error')
            console.log(error, msg)
            this.server.publish('/d/message', {date: new Date(), message: msg, type: 'banner-yellow'})
          });

        return Promise.resolve()
    }
    
}