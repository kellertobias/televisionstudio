import SerialPort from "serialport";

// @ts-expect-error
import Delimiter from "@serialport/parser-delimiter";

import { BasicInterface } from "./../basic-interface";
import { ConfigBackend } from "../../engine/config";
import { iModules } from "../../modules";
import { MacroEngine } from "../../engine/macros";
import { startsWith, endsWith } from "../../helpers/array-equals";
import arrayEquals from "/server/backend/helpers/array-equals";
import fs from "fs";

export type LedColor =
  | "red"
  | "yellow"
  | "green"
  | "cyan"
  | "blue"
  | "pink"
  | "white"
  | "off";

export interface LedStatus {
  color: LedColor;
  blink: LedColor;
  dim: boolean;
  fast: boolean;
}

export interface MatrixCell {
  button: ButtonStatus;
  led: LedStatus;
}

export interface ButtonStatus {
  pressed: boolean;
  pressedAt?: Date;
}
let addressIterator = 0;
const NUMROW = 5;
const NUMCOL = 9;

export class DeskSerialBoardInterface extends BasicInterface {
  static MESSAGE_HEADER: number[] = [0b10101010, 0b00000000];
  static MESSAGE_FOOTER: number[] = [0b11111111, 0b00000000];
  static ADDR_FADER: number = 0b00000001;
  static ADDR_ENCODER: number = 0b10000001;
  private static EXISING_ADDRESSES = [
    DeskSerialBoardInterface.ADDR_ENCODER,
    DeskSerialBoardInterface.ADDR_FADER,
    ...DeskSerialBoardInterface.MESSAGE_HEADER,
    ...DeskSerialBoardInterface.MESSAGE_FOOTER,
  ];

  static LED_COLOR_MAP = {
    red: 0b100,
    yellow: 0b110,
    green: 0b010,
    cyan: 0b011,
    blue: 0b001,
    pink: 0b101,
    white: 0b111,
    off: 0b000,
  };

  private static addresses: Record<number, [number, number, number]> = {};

  private matrix: MatrixCell[][][] = ["left", "right"].map((_side, k) =>
    [...Array(5)].map((_row, r) => {
      return [...Array(9)].map(
        (_col, c): MatrixCell => {
          addressIterator++;
          while (
            DeskSerialBoardInterface.EXISING_ADDRESSES.includes(addressIterator)
          ) {
            addressIterator++;
          }
          DeskSerialBoardInterface.addresses[addressIterator] = [k, r, c];
          return {
            led: {
              color: "off",
              blink: "off",
              dim: true,
              fast: false,
            },
            button: {
              pressed: false,
              pressedAt: undefined,
            },
          };
        }
      );
    })
  );

  brightness: number = 20;
  brightnessBlink: number = 20;
  brightnessDim: number = 3;
  brightnessBlinkDim: number = 3;

  willShutdown: boolean = false;
  debugAllowed: boolean = false;

  port?: SerialPort;
  parser: any;
  interval?: NodeJS.Timeout;
  reconnectInterval?: NodeJS.Timeout;
  statusOverwriteTimer = 0;

  lastStatus: number[] = [];

  warnedOfNonexistence = false;
  config: ConfigBackend;

  constructor(config: ConfigBackend, modules: iModules, macros: MacroEngine) {
    super(config, modules, macros);
    this.config = config;
  }

  connect(): Promise<void> {
    if (this.reconnectInterval) clearTimeout(this.reconnectInterval);
    const serialPort = this.config.devices[`desk`].dev;

    try {
      if (
        serialPort == undefined ||
        serialPort == "" ||
        !fs.existsSync(serialPort)
      ) {
        if (!this.warnedOfNonexistence) {
          console.warn("[SERIAL] DEVICE DOES NOT EXIST", {
            dev: serialPort,
          });
          this.warnedOfNonexistence = true;
        }
        this.reconnectInterval = setTimeout(() => {
          this.connect();
        }, 500);
        return Promise.resolve();
      }
      console.log(`[SERIAL] Open ${serialPort}`);
      this.port = new SerialPort(serialPort, { baudRate: 250000 });
      this.parser = this.port.pipe(
        new Delimiter({ delimiter: DeskSerialBoardInterface.MESSAGE_FOOTER })
      );
    } catch (error) {
      console.log("[SERIAL] Could not connect", error);
      this.reconnectInterval = setTimeout(() => {
        this.connect();
      }, 500);
      return Promise.resolve();
    }

    this.parser.on("data", this.onReceive);
    // The open event is always emitted
    this.port.on("open", () => {
      console.log("[SERIAL] Setting Status Update Interval");
      this.interval = setInterval(() => {
        try {
          this.sendStatus();
        } catch (error) {
          console.log("[SERIAL] Error while sending Status", error);
        }
      }, 100);
    });
    this.port.on("close", () => {
      console.log("[SERIAL] Closed");
      if (this.interval) clearInterval(this.interval);
      this.interval = undefined;
      this.reconnectInterval = setTimeout(() => {
        this.connect();
      }, 1000);
    });

    return Promise.resolve();
  }
  shutdown(): Promise<void> {
    if (this.interval) clearInterval(this.interval);
    this.interval = undefined;
    this.port?.close();
    return Promise.resolve();
  }
  setup(): Promise<void> {
    return Promise.resolve();
  }

  private send(data: number[]) {
    // Sends the Data on the serial Interface
    // Dummy Implementation at the moment
    if (this.port) this.port.write(data);
    else console.log("PORT NOT OPEN");
    return Promise.resolve();
  }

  onButton(
    side: "left" | "right",
    handler: (params: {
      row: number;
      col: number;
      pressed: boolean;
      pressedAt: Date;
    }) => void
  ) {
    this.registerEventHandler(`button-${side}`, handler);
  }

  onFader(handler: (params: { fader: number; value: number }) => void) {
    this.registerEventHandler("fader", handler);
  }

  onEncoder(handler: (params: { encoder: number; direction: 1 | -1 }) => void) {
    this.registerEventHandler("encoder", handler);
  }

  setLed(side: "left" | "right", row: number, col: number, status: LedStatus) {
    const submatrix = this.matrix[side == "left" ? 0 : 1];
    const _row = submatrix.length - row - 1;
    const cell = submatrix[_row][col];
    if (!cell) throw Error(`Cell ${_row}:${col} does not exist.`);

    cell.led = status;
  }

  setLedRow(side: "left" | "right", row: number, status: LedStatus[]) {
    const submatrix = this.matrix[side == "left" ? 0 : 1];
    const _row = submatrix.length - row - 1;

    status.forEach((led, col) => {
      const cell = submatrix[_row][col];
      if (!cell) throw Error(`Cell ${_row}:${col} does not exist.`);
      cell.led = led;
    });
  }

  getButton(side: "left" | "right", row: number, col: number): ButtonStatus {
    const cell = this.matrix[side == "left" ? 0 : 1][row][col];
    if (!cell) throw Error(`Cell ${row}:${col} does not exist.`);
    return cell.button;
  }

  onReceive = (buf: Buffer) => {
    const data: number[] = Array.from(buf);
    console.log("SERIAL DATA", buf.toString());

    if (!startsWith(data, DeskSerialBoardInterface.MESSAGE_HEADER)) {
      console.log("Got invalid Message. Header Wrong.");
      return;
    }
    //Remove Header from Array
    data.shift();
    data.shift();

    const _command = data.shift();
    const command: number = _command !== undefined ? _command : 0;

    switch (true) {
      case command == 0x00 || command == 0xff:
        //Is not allowed
        console.log("Commands 0x00 or 0xFF are not allowed.");
        break;

      case command === DeskSerialBoardInterface.ADDR_ENCODER:
        //if the first bit is one followed by three bits of zero
        //the last four bits indicate up to 16 Encoders.
        //The data will be 0b0X000010 for left and 0b0X000001 for right
        //the second bit is encoder push
        const encoderAddress = command & 0b00001111;
        const encoderDirection = (data[0] & 0b00000011) == 0b00000001 ? -1 : 1;
        const encoderPushed = (data[0] & 0b01000000) == 0b01000000;

        this.runEventHandlers("encoder", {
          encoder: encoderAddress,
          direction: encoderDirection,
        });
        break;

      case command === DeskSerialBoardInterface.ADDR_FADER:
        //If the first four bits are zero, the last bits index up to 15 faders.
        //We expect two bytes of data containing ten bits of information.
        //The leading bytes, that we will ignore should not be 1
        const faderAddress = command & 0b00001111;
        const faderValue = data[0];

        this.runEventHandlers("fader", {
          fader: faderAddress,
          value: faderValue,
        });
        break;

      default:
        const [side, row, col] = DeskSerialBoardInterface.addresses[
          command
        ] ?? [-1, -1, -1];
        console.log({ side, row, col });

        if (side == -1 || row == -1 || col == -1) {
          console.log("Address Invalid");
          break;
        }
        //in every other case, the first bit is zero,
        //the next three bits index the button row from top to bottom, (1-7)
        //the next four bits index the button column from left to right, (0-15)

        //The Value of a button is either pressed (0b00000001) or released (0b00000000)
        const pressed = !data[0];
        let pressedAt: Date | undefined = undefined;
        try {
          const cell = this.matrix[side][row][col];

          if (pressed) pressedAt = new Date();
          else pressedAt = cell.button.pressedAt;

          cell.button.pressed = pressed;
          cell.button.pressedAt = pressedAt;
        } catch (error) {
          console.log(`Cell ${side}:${row}:${col} does not exist.`);
        }

        this.runEventHandlers(`button-${side}`, {
          row,
          col,
          pressed,
          pressedAt,
        });

        break;
    }
  };

  sendStatus(): Promise<void> {
    const statusMessage: number[] = [
      ...DeskSerialBoardInterface.MESSAGE_HEADER,
    ];
    statusMessage;

    //Add Global Status
    statusMessage.push(this.debugAllowed ? 0xff : 0x00);
    statusMessage.push(this.brightness);
    statusMessage.push(this.brightnessBlink);
    statusMessage.push(this.brightnessDim);
    statusMessage.push(this.brightnessBlinkDim);
    this.matrix.forEach((side) => {
      side.forEach((row) => {
        row.forEach((cell) => {
          const led = cell.led;

          let ledColor = DeskSerialBoardInterface.LED_COLOR_MAP[led.color] << 5;
          let ledBlinkColor =
            DeskSerialBoardInterface.LED_COLOR_MAP[led.blink] << 2;
          let ledDim = (led.dim ? 0b1 : 0b0) << 1;
          let ledFast = led.fast ? 0b1 : 0b0;
          let ledStatus = ledColor | ledBlinkColor | ledDim | ledFast;
          statusMessage.push(ledStatus);
        });
      });
    });

    if (
      !arrayEquals(statusMessage, this.lastStatus) ||
      this.statusOverwriteTimer == 0
    ) {
      this.lastStatus = statusMessage;
      if (!arrayEquals(statusMessage, this.lastStatus)) {
        console.log("[SERIAL] UPDATE LED: ", statusMessage);
      }
      this.statusOverwriteTimer = 10;
      console.log("[SERIAL] UPDATE LED: ", statusMessage, statusMessage.length);
      return this.send(statusMessage.map((x) => Math.max(0, Math.min(255, x))));
    }

    this.statusOverwriteTimer--;

    return Promise.resolve();
  }
}
