import React from 'react';
import {Component} from 'react';
import { Meteor } from 'meteor/meteor';
import { MacrosView } from './windows/macros'
import { OBSView } from './windows/obs'
import { TimeView } from './windows/time'
import { StateView } from './windows/status'
import { RateView } from './windows/rate'
import { SettingsView } from './windows/settings'
import { AudioView } from './windows/audio'
import { Modal, ModalPortal } from './widgets/modal'


import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'

import { api } from './model'

library.add(fas, far, fab)

class ConnectionStatus extends React.Component
	constructor: (params) ->
		super(params)
		this.state = {}
	
	componentDidMount: () =>
		api.onStatus((connected) =>
			this.setState({connected: connected})
		)

		this.setState({
			message: "Loaded. Size: #{window.innerWidth}x#{window.innerHeight}",
			type: "green"
		})

		setTimeout(() =>
			this.setState({
				message: null
				type: null
			})
		, 2500)

		sub1Stop = api.subscribe('/d/module-connection', (err, ret) =>
			if err
				return console.error(err)
			this.setState(ret)
		)

		sub2Stop = api.subscribe('/d/message', (err, ret) =>
			if err
				return console.error(err)

			if Math.abs(new Date(ret.date) - new Date()) < 2500
				new Promise((resolve, reject) =>
					console.log("Set Message")
					this.setState({message: ret.message, type: ret.type})
					setTimeout(resolve, 2900)
				).then(() =>
					console.log("Remove Message")
					this.setState({message: false, type: undefined})
				)
		)

		this.stopSubscription = () =>
			sub1Stop()
	
	componentWillUnmount: () =>
		this.stopSubscription()


	render: () =>
		{connected, atem, obs, message, type} = this.state
		console.log this.state

		if message and not (type || "").startsWith('banner')
			return <div className={"toast toast-" + (if type? then type else 'green')}>
				<div className="toast-text">
					{message}
				</div>
			</div>

		if connected and atem and obs
			return null

		return <div className={[
			"banner"
			switch
				when type == 'banner-red' then 'banner-red'
				when type == 'banner-yellow' then 'banner-yellow'
				when not connected then 'banner-red'
				else 'banner-yellow'
		].join(' ')}>
			<div className="banner-icon">
				<FontAwesomeIcon
					icon={['fas', 'exclamation-circle']}
					style={marginRight: '5px'}
				/>
			</div>
			<div className="banner-text">
				{if message
					message
				else if not connected
					"Connection to Server Lost"
				else
					"Connecting to " + [
						if not atem then 'Switcher' else undefined
						if not obs then 'OBS' else undefined
					].filter((x) => x).join(', ') + '...'
				}
			</div>
		</div>

export class DeskGUI extends React.Component
	render: () => 
		return <div className="desk-body">
			<div className="desk">
				<div className="frame">
					<Modal />
					<SettingsView />
					<MacrosView />
					<TimeView />
					<StateView />
					<RateView />
					<OBSView />
					<AudioView />
					<ConnectionStatus />
				</div>
			</div>
		</div>
