import { BasicInterface } from "./../basic-interface";
import { ConfigBackend } from "../../engine/config";
import { iModules } from "../../modules";
import { MacroEngine } from "../../engine/macros";
import { startsWith, endsWith } from '../../helpers/array-equals'
import SerialPort from 'serialport'
import Delimiter from '@serialport/parser-delimiter'
import arrayEquals from '/server/backend/helpers/array-equals';
import fs from "fs";

export type LedColor = 'red' | 'yellow' | 'green' | 'cyan' | 'blue' | 'pink' | 'white' | 'off'

export interface LedStatus {
    color: LedColor,
    blink: LedColor,
    dim: boolean,
    fast: boolean
}

export interface MatrixCell {
    button: ButtonStatus,
    led: LedStatus
}

export interface ButtonStatus {
    pressed: boolean,
    pressedAt?: Date
}

export class DeskSerialBoardInterface extends BasicInterface {
    static MESSAGE_HEADER : number[] = [0b10101010, 0b00000000]
    static MESSAGE_FOOTER : number[] = [0b11111111, 0b00000000]

    static LED_COLOR_MAP = {
        'red': 0b100,
        'yellow': 0b110,
        'green': 0b010,
        'cyan': 0b011,
        'blue': 0b001,
        'pink': 0b101,
        'white': 0b111,
        'off': 0b000
    }

    matrix : MatrixCell[][] = [...Array(5)].map((_row, x) => {
        return [...Array(9)].map((_col, y) : MatrixCell => {
            const isEven = (x + y) % 2 == 0

            return {
                led: {
                    color: 'off',
                    blink: 'off',
                    dim: true,
                    fast: false
                },
                button: {
                    pressed: false,
                    pressedAt: undefined
                }
            }
        })
    })
    
    brightness : number = 20
    brightnessBlink : number = 20
    brightnessDim : number = 3
    brightnessBlinkDim : number = 3

    willShutdown : boolean = false
    debugAllowed : boolean = false

    port?: SerialPort;
    parser: any;
    interval?: NodeJS.Timeout;
    reconnectInterval?: NodeJS.Timeout;
    statusOverwriteTimer = 0

    lastStatus: number[] = []


    warnedOfNonexistence = false
    config: ConfigBackend;
    side: string;

    constructor(config: ConfigBackend, modules: iModules, macros: MacroEngine, side: 'left' | 'right') {
        super(config, modules, macros)
        this.config = config
        this.side = side
    }

    connect(): Promise<void> {
        if(this.reconnectInterval) clearTimeout(this.reconnectInterval)
        const serialPort = this.config.devices[`desk${this.side}` as 'deskleft' | 'deskright'].dev

        try {
            if(serialPort == undefined || serialPort == '' || !fs.existsSync(serialPort)) {
                if(!this.warnedOfNonexistence) {
                    console.warn("[SERIAL] DEVICE DOES NOT EXIST", {side: this.side, dev: serialPort})
                    this.warnedOfNonexistence = true
                }
                this.reconnectInterval = setTimeout(() => {
                    this.connect()
                }, 500)
                return Promise.resolve()
            }
            console.log("[SERIAL] Open")
            this.port = new SerialPort(serialPort , { baudRate: 115200 })
            this.parser = this.port.pipe(new Delimiter({ delimiter: DeskSerialBoardInterface.MESSAGE_FOOTER }))
        } catch (error) {
            console.log("[SERIAL] Could not connect", error)
            this.reconnectInterval = setTimeout(() => {
                this.connect()
            }, 500)
            return Promise.resolve()
        }

        this.parser.on('data', this.onReceive)
        // The open event is always emitted
        this.port.on('open', () => {
            console.log("[SERIAL] Setting Status Update Interval")
            this.interval = setInterval(() => {
                try {
                    this.sendStatus()
                    
                } catch (error) {
                    console.log("[SERIAL] Error while sending Status", error)
                }
            }, 100)        
        })
        this.port.on('close', () => {
            console.log("[SERIAL] Closed")
            if(this.interval) clearInterval(this.interval)
            this.interval = undefined
            this.reconnectInterval = setTimeout(() => {
                this.connect()
            }, 1000)

        })

        return Promise.resolve()
    }
    shutdown(): Promise<void> {
        if(this.interval) clearInterval(this.interval)
        this.interval = undefined
        this.port?.close()
        return Promise.resolve()
    }
    setup(): Promise<void> {
        return Promise.resolve()
    }

    private send(data: number[]) {
        // Sends the Data on the serial Interface
        // Dummy Implementation at the moment
        if(this.port) this.port.write(data)
        else console.log("PORT NOT OPEN")
        return Promise.resolve()
    }

    onButton(handler: ((params: {row: number, col: number, pressed: boolean, pressedAt: Date}) => void)) {
        this.registerEventHandler("button", handler)
    }

    onFader(handler: ((params: {fader: number, value: number}) => void)) {
        this.registerEventHandler("fader", handler)
    }

    onEncoder(handler: ((params: {encoder: number, direction: 1 | -1}) => void)) {
        this.registerEventHandler("encoder", handler)
    }

    setLed(row: number, col: number, status: LedStatus) {
        const _row = this.matrix.length - row - 1

        const cell = this.matrix[_row][col]
        if(!cell) throw Error(`Cell ${_row}:${col} does not exist.`)

        cell.led = status
    }

    setLedRow(row: number, status: LedStatus[]) {
        const _row = this.matrix.length - row - 1

        status.forEach((led, col) => {
            const cell = this.matrix[_row][col]
            if(!cell) throw Error(`Cell ${_row}:${col} does not exist.`)
            cell.led = led
        })
    }

    getButton(row:number, col:number) : ButtonStatus {
        const cell = this.matrix[row][col]
        if(!cell) throw Error(`Cell ${row}:${col} does not exist.`)
        return cell.button
    }
        
    onReceive = (buf: Buffer) => {
        const data: number[] = Array.from(buf);
        
        if(!startsWith(data, DeskSerialBoardInterface.MESSAGE_HEADER)) {
            console.log("Got invalid Message. Header Wrong.")
            return
        }
        //Remove Header from Array
        data.shift()
        data.shift()
        
        const _command = data.shift()
        const command : number = _command !== undefined ? _command : 0

        switch (true) {
            case command == 0x00 || command == 0xFF :
                //Is not allowed
                console.log("Commands 0x00 or 0xFF are not allowed.")
                break;

            case (command & 0b10000000) == 0b10000000:
                //if the first bit is one followed by three bits of zero
                //the last four bits indicate up to 16 Encoders.
                //The data will be 0b0X000010 for left and 0b0X000001 for right
                //the second bit is encoder push
                const encoderAddress = command & 0b00001111
                const encoderDirection = (data[0] & 0b00000011) == 0b00000001 ? -1 : 1
                const encoderPushed = (data[0] & 0b01000000) == 0b01000000
                
                this.runEventHandlers("encoder", {
                    encoder: encoderAddress,
                    direction: encoderDirection
                })
                break;
            
            case (command & 0b11110000) == 0b00000000:
                //If the first four bits are zero, the last bits index up to 15 faders.
                //We expect two bytes of data containing ten bits of information.
                //The leading bytes, that we will ignore should not be 1
                const faderAddress = command & 0b00001111
                const faderValue = data[0]

                this.runEventHandlers("fader", {
                    fader: faderAddress,
                    value: faderValue
                })
                break;

            default:
                //in every other case, the first bit is zero,
                //the next three bits index the button row from top to bottom, (1-7)
                //the next four bits index the button column from left to right, (0-15)
                const row = ((command & 0b01110000) >>> 4) - 1
                const col = (command & 0b00001111)
                
                //The Value of a button is either pressed (0b00000001) or released (0b00000000)
                const pressed = !data[0]
                let pressedAt : Date | undefined = undefined
                try {
                    const cell = this.matrix[row][col]

                    if(pressed) pressedAt = new Date()
                    else pressedAt = cell.button.pressedAt

                    cell.button.pressed = pressed
                    cell.button.pressedAt = pressedAt
                } catch (error) {
                    console.log(`Cell ${row}:${col} does not exist.`)
                }

                this.matrix[row][col].button.pressed;
                this.runEventHandlers("button", {
                    row, col, pressed, pressedAt
                })

                break;

        }
    }

    sendStatus(): Promise<void> {
        const statusMessage : number[] = [...DeskSerialBoardInterface.MESSAGE_HEADER]
        statusMessage

        //Add Global Status
        statusMessage.push(this.debugAllowed ? 0xff : 0x00)
        statusMessage.push(Math.max(0, Math.min(255, this.brightness)))
        statusMessage.push(Math.max(0, Math.min(255, this.brightnessBlink)))
        statusMessage.push(Math.max(0, Math.min(255, this.brightnessDim)))
        statusMessage.push(Math.max(0, Math.min(255, this.brightnessBlinkDim)))
        this.matrix.forEach(row => {
            row.forEach(cell => {
                const led = cell.led

                let ledColor = DeskSerialBoardInterface.LED_COLOR_MAP[led.color] << 5
                let ledBlinkColor = DeskSerialBoardInterface.LED_COLOR_MAP[led.blink]  << 2
                let ledDim = (led.dim ? 0b1 : 0b0) << 1
                let ledFast = led.fast ? 0b1 : 0b0
                let ledStatus = ledColor | ledBlinkColor | ledDim | ledFast
                statusMessage.push(ledStatus)
            })
        });

        if(!arrayEquals(statusMessage, this.lastStatus) || this.statusOverwriteTimer == 0) {
            this.lastStatus = statusMessage
            if(!arrayEquals(statusMessage, this.lastStatus)) {
                console.log("[SERIAL] UPDATE LED: ", statusMessage)
            }
            this.statusOverwriteTimer = 10
            return this.send(statusMessage)
        }

        this.statusOverwriteTimer--

        return Promise.resolve()
    }
    
}