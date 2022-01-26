import React from 'react';
import _ from 'underscore'
import moment from 'moment'
import 'moment-duration-format';
import { Dropdown } from '../../widgets/dropdown'
import { Button } from '../../widgets/button'
import { api } from '/client/model'


export class SettingsModal extends React.Component
	constructor: (props) ->
		super(props)

		this.buttonOptions = {
			"1": "CH1"
			"2": "CH2"
			"3": "CH3"
			"4": "CH4"
			"5": "CH5"
			"6": "CH6"
			"7": "CH7"
			"8": "CH8"
		}

		this.state = {
			channelMap: [undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined]
			brightnessMain: undefined
			brightnessDim: undefined
			panelIp: '-/-'
			panelBoot: moment().toDate()
		}

	componentDidMount: () =>
		this.stopSubscription = api.subscribe('/d/system-settings', (err, ret) =>
			if err
				return console.error(err)

			stateUpdate = {
				channelMap: ret.channelMap
				panelIp: ret.panelIp
				panelBoot: moment(ret.panelBoot).toDate()
			}

			if not this.state.brightnessMain?
				stateUpdate.brightnessMain = ret.brightnessMain
			
			if not this.state.brightnessDim?
				stateUpdate.brightnessDim = ret.brightnessDim

			this.setState(stateUpdate)
		)
	
	componentWillUnmount: () =>
		this.stopSubscription()


	renderChannelSelect: (buttonNumber) =>
		return <div className="button-channel-selector" key={"button-"+buttonNumber}>
			<div className="button-channel-button">{buttonNumber}</div>
			<div className="button-channel-channel">
				<Dropdown
					value={this.state.channelMap[buttonNumber - 1]}
					placeholder="Select Channel"
					onChange={(value) =>
						channelMap = this.state.channelMap
						channelMap[buttonNumber - 1] = parseInt(value)
						this.setState({channelMap})

						api.send('/action/system-settings/channel-map', {channelMap})
					}
					options={this.buttonOptions}
				/>
			</div>
		</div>

	renderBrightnessFader: (key) =>
		faderName = switch key
			when 'brightnessMain' then 'Main Brightness'
			when 'brightnessDim' then 'Dimmed Brightness'

		return <div className="brightness-fader" key={faderName}>
			<div className="brightness-fader-position">
				<input
					type="range"
					id={key}
					name={key}
					min="0"
					max="255"
					value={this.state[key] ? 0}
					onChange={(e) =>
						value = e.currentTarget.value
						console.log({key, value})

						this.state[key] = value

						this.setState({[key]: value})
						api.send('/action/system-settings/brightness', {
							main: this.state.brightnessMain
							dim: this.state.brightnessDim
						})
					}
				/>
				<label htmlFor={key}>{this.state[key]}<br/><b>{faderName}</b></label>
			</div>
		</div>

	render: ->
		return <>
			<div className="settings-modal">
				<div className="modal-section">
					<h2>Button Mapping</h2>
					<div className="button-channel-selector-section">
						<div className="button-channel-selector-part">
							{_.range(0, 4, 1).map (buttonNumber) =>
								return this.renderChannelSelect(buttonNumber + 1)
							}
						</div>
						<div className="button-channel-selector-part">
							{_.range(4, 8, 1).map (buttonNumber) =>
								return this.renderChannelSelect(buttonNumber + 1)
							}
						</div>
					</div>
				</div>
				<div className="modal-section">
					<h2>Button Brightness</h2>
					<div className="brightness-faders-section">
						{['brightnessMain', 'brightnessDim'].map((key) => this.renderBrightnessFader(key))}
					</div>
				</div>
				<div className="modal-section">
					<h2>Misc.</h2>
					<div className="">
						<div className="system-status">
							Uptime: {moment(this.state.panelBoot).fromNow()}<br/>
							Panel IP: {this.state.panelIp}
						</div>
						<div className="system-section">
							<Button onClick={() =>
								api.send('/action/system-settings/power', {reload: true})
							}>
								Reload Macros
							</Button>
							<Button onClick={() =>
								api.send('/action/system-settings/power', {shutdown: true})
							}>
								Shutdown
							</Button>
						</div>
					</div>
				</div>
			</div>
		</>