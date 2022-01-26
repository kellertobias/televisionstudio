# Tobisk Television Studio Control Panel (ToskTVStudio)

This Project contains all software and hardware sources necessary to control a setup consisting of:

- ATEM Television Studio HD Video Switcher
- Web Presenter/ Hyperdeck (Work in Progress)
- OBS for graphics optionally streaming/recording
- Website based text generator for OBS
- MOTU828es based Audio Mixing (Work in Progress)
- LoRa Based Camera Tallys and Python based Tally base

The main part of this project is a nodejs based application that provides the control of the infrastructure via macros and all required additional services.

This System contains of these services:
- Main Control Desk Software
- Server to send Tally Signals (might run on the same raspberry pi as the control desk)
- Server to communicate with the hardware of the control desk
- Web based Textgenerator for OBS (or any other web browser)

as well as the firmware and schematics for these hardware components:
- LoRa Based Tally Sender and Receiver
- Desk Hardware Buttons, faders and encoders

## Control desk Software

![Control Desk](docs/desk.jpg)

The main part of this software is the control desk software which is capable of controlling ATEM switchers and OBS (Hyperdeck and Web Presenter Support is work in progress). This software is meant to run on a raspberry PI and provides the user interface via a website. there is also a serial interface to an arduino based keyboard interface (split up in a separate server for easier developing).

## Control desk Hardware

The main part of this software is the control desk software which is capable of controlling ATEM switchers and OBS (Hyperdeck and Web Presenter Support is work in progress). This software is meant to run on a raspberry PI and provides the user interface via a website. there is also a serial interface to an arduino based keyboard interface (split up in a separate server for easier developing).

## Tally System

![Tally PCB](docs/tally-pcb.png)
![Tally Enclosure](docs/tally-enclosure.jpg)

The tally system is based on LoRa communications.
There is a server that is meant to run on the same raspberry pi as the control desk software. The control desk software sends to the LoRa server which channel is on program and which is on preview. This happens over a simple REST api.
However if you want to use the tally system without the control desk software, you can do so, but need to write this part your own. there are multiple libraries providing this.

The tally system consists out of:

- Tally Server: `/services/tally-lora-server`
- Tally Client Firmware & Hardware: `/services/tally-lora-client`

More information on this is in the README.md of that subproject: ![Tally Enclosure](services/tally-lora-client/README.md)

## Text-Generator

The last part of this software is a textgenerator. It is meant to be embedded as a webpage in OBS or as Fullscreen Browser Screen on a second raspberry pi and connected to the ATEM.

The textgenerator supports countdowns, scrolling texts and lower thirds

# Development and Operations

The software is written in Typescript and requires `node` and `npm` to be installed. You can then use `npm`'s scripts to execute development scripts.  

-   `npm i -D` for installing all the dependencies
-   `npm run dev` - Start Development Environment. Client and server are in watch mode with source maps, opens [http://localhost:3000](http://localhost:3000)

### Deploying

-   `npm run build` - `dist` folder will include all the needed files, both client (Bundle) and server.
-   `npm start` - Just runs `node ./dist/server/server.js`
-   `npm start:prod` - sets `NODE_ENV` to `production` and then runs `node ./dist/server/server.js`. (Bypassing webpack proxy)

### Technology Stack

Backend:

- `node.js` as runtime
- `typescript` as programming language
- `express` for APIs

Frontend:

- `webpack 5` for bundling
- `react` as UI Framework
- `storybook` for developing components
- `axios` for contacting the REST APIs

# Todo-List/ Roadmap

- [ ] get rid of meteor and move to a more modern build stack
- [ ] rewrite Web UI to be Typescript
- [ ] re-send tally commands multiple times
- [ ] Add Web Presenter Support (Start/Stop Stream, Show Stream Status, Set Stream Target configured in the showfile)
- [ ] Add Support for Audio Level Monitoring and Audio Control
- [ ] Add a second web interface for configuring the software, e.g. over an iPad or Laptop
- [ ] allow in-software macro editing and showfile configuration

# License

This software might only be used for non-commercial purposes, this means, you may not sell it or anything that builds upon it. You may however use your own products based on this software for commercial purposes.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software with the abovegiven restrictions, including with the abovegiven limitations the rights to use, copy, modify, merge, publish, distribute, of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## References to packages and content this work is based on
- Boilerplate: https://github.com/gilamran/fullstack-typescript.git
