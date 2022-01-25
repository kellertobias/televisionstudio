import React from 'react';
import {Component} from 'react';
import { Meteor } from 'meteor/meteor';
import { Window } from '../../widgets/window'
import { Button } from '../../widgets/button'
import _ from 'underscore'
import moment from 'moment'
import 'moment-duration-format';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {portalStoreUpdate} from '../../widgets/modal'
import { api } from '/client/model'

export class TimeModal extends React.Component
	constructor: (props) ->
		super(props)
		showStart = moment(props.target) || moment('20:00')
		showStart.set(second: 0, millisecond: 0)
		this.state = {
			showStart: showStart.toDate()
			time: new Date()
		}

	componentWillReceiveProps: (nextProps) =>
		showStart = moment(nextProps.target) || moment('20:00')
		showStart.set(second: 0, millisecond: 0)
		this.setState({showStart: showStart.toDate()})
	
	componentDidMount: () =>
		this.interval = setInterval(this.tick, 1000)
	
	componentWillUnmount: () =>
		clearInterval(this.interval)

	tick: () =>
		this.setState({time: new Date()})

	onSave: () =>
		api.send('/action/system/set-target-time', {time: this.state.showStart})
		portalStoreUpdate(null)

	renderPickerBlock: (showStart, value, part, title) =>
		return <div className="picker-block">
			<div className="picker-top" onClick={() =>
				showStart.subtract(1, part)
				this.setState({showStart})
			}>
				<FontAwesomeIcon
					icon={['fas', 'minus']}
				/>
			</div>
			<div className="picker-mid">
				<div className="picker-value">{value}</div>
				<div className="picker-title">{title}</div>
			</div>
			<div className="picker-bottom" onClick={() =>
				showStart.add(1, part)
				this.setState({showStart})
			}>
				<FontAwesomeIcon
					icon={['fas', 'plus']}
				/>
			</div>
		</div>
	
	render: () =>
		showStart = moment(this.state.showStart)

		duration = moment.duration(moment(this.state.time).diff(showStart))

		return <div className="time-modal">
			<h1>Set Show Start time</h1>
			<div className="picker-form">
				{this.renderPickerBlock(showStart, '+ ' + showStart.diff(moment(), 'days'), 'day', 'Days')}
				{this.renderPickerBlock(showStart, showStart.format('HH'), 'hour', 'Hour')}
				{this.renderPickerBlock(showStart, showStart.format('mm'), 'minute', 'Minute')}
			</div>
			<div className="time-target">
				{moment(this.state.showStart).format('dddd, DD.MM.YYYY HH:mm:ss')} ({"T" + duration.format('HH:mm:ss')})
			</div>

			<div className="time-modal-save-button">
				<Button onClick={this.onSave}>
					Save
				</Button>
			</div>
		</div>
			

export class TimeView extends React.Component
	constructor: (props) ->
		super(props)
		this.state = {
			showStart: null
			time: new Date()
		}

	componentDidMount: () =>
		this.interval = setInterval(this.tick, 1000)

		this.stopSubscription = api.subscribe('/d/calendar', (err, ret) =>
			if err
				return console.error(err)
			this.setState({showStart: ret.showStart})
		)
	
	componentWillUnmount: () =>
		this.stopSubscription()
		clearInterval(this.interval)

	
	tick: () =>
		this.setState({time: new Date()})

	render: ->
		duration = moment.duration(moment(this.state.time).diff(this.state.showStart))
		return <>
			<div className="time-clock">
				<Window>
					<div className="micro-title">Current Time</div>
					{moment(this.state.time).format("HH:mm:ss")}
				</Window>
			</div>
			<div className="time-countdown">
				<Window
					onClick={() => 
						portalStoreUpdate({
							title: "Set Countdown Target"
							children: <TimeModal
								target={this.state.showStart}
							/>
						})
					}
				>
					<div className="micro-title">Countdown to On Air</div>
					{if this.state.showStart
						"T" + duration.format('HH:mm:ss')
					else
						"Not Set"
					}
					<div className="desk-button-mini-row">
						<Button icon="cog" /> 
					</div>
				</Window>
			</div>
		</>