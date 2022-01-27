// import React from 'react';
// import {Component} from 'react';
// import { Meteor } from 'meteor/meteor';
// import { Window } from '../../widgets/window'
// import { Button } from '../../widgets/button'
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

// import { api } from '/client/model'

// import _ from 'underscore'
// import moment from 'moment'

// COLUMNS = 8

// class MacroTimer extends React.Component
// 	constructor: (props) ->
// 		super(props)
// 		this.state = {
// 			percentage: if props.done then 100 else 0
// 			duration: props.step?.duration
// 			trigger: props.step?.trigger
// 		}
// 		this.interval = null

// 	componentDidMount: () =>
// 		if(!this.props.timeBase)
// 			return
// 		this.interval = setInterval(this.update, 100)
// 		this.update()

// 	componentWillUnmount: () =>
// 		if this.interval != null
// 			clearInterval(this.interval)

// 	update: () =>
// 		done = false
// 		set = {}
// 		if this.props.done
// 			done = true
// 			percentage = 100
// 			set[this.props.change] = this.props.step[this.props.change]
// 		else
// 			now = new Date()
// 			timeBase = this.props.timeBase
// 			duration = this.props.duration
// 			elapsed = (timeBase - now) / 1000
// 			percentage = elapsed / duration * 100

// 			percentage = 100 - Math.min(100, Math.max(0, percentage))
// 			set[this.props.change] = Math.max(0, elapsed)
// 			set.percentage = percentage

// 		this.setState(set)

// 		done = percentage == 100
// 		if done && this.interval != null
// 			clearInterval(this.interval)

// 	printCombined: () =>
// 		if this.props.done
// 			return 'DONE'

// 		if this.props.change == 'duration'
// 			return "#{Number(this.state.duration).toFixed(1)}s"

// 		if this.props.step.trigger == 'GO' or not this.props.step.trigger?
// 			return 'GO'
// 		return "#{Number(this.state.trigger).toFixed(1)}s"

// 	printTrigger: () =>
// 		if this.props.done
// 			return '-'

// 		if this.props.step.trigger == 'GO'
// 			return 'GO'

// 		if not this.props.step.trigger
// 			return 'GO'

// 		if this.state.trigger == 0
// 			return 'RUN'

// 		return "#{Number(this.state.trigger ? this.props.step.trigger).toFixed(1)}s"

// 	printDuration: () =>
// 		if this.props.done
// 			return 'DONE'

// 		if not this.props.step.duration
// 			return '0s'

// 		duration = if this.state.duration == 0
// 			0
// 		else
// 			this.state.duration

// 		return "#{Number(duration).toFixed(1)}s"

// 	render: ->
// 		return <>
// 			<div className="macro-step-background">
// 				<div
// 					className="macro-step-background-fill"
// 					style={
// 						background: switch this.props.change
// 							when 'duration' then '#005500'
// 							when 'trigger' then '#BB8800'
// 							else '#005500'
// 						position: 'absolute'
// 						left: 0
// 						top: 0
// 						bottom: 0
// 						width: "#{if this.props.done then 100 else this.state.percentage}%"
// 					}
// 				/>
// 			</div>
// 			<div
// 				className="macro-step-info"
// 				style={
// 					position: 'absolute'
// 					zIndex: 10
// 					top: 0
// 					bottom: 0
// 					right: 0
// 				}
// 			>
// 				{if this.props.isMasterWindow
// 					<>
// 						<div style={{position: 'absolute', right: 0, top: 0, bottom: 0, width: 70}}/>
// 						<div style={{position: 'absolute', right: 48, lineHeight: "18px", top: 3}}>
// 							{this.printTrigger()}
// 						</div>
// 						<div style={{position: 'absolute', right: 42, borderRight: '1px solid white', height: 18, top: 4}} />
// 						<div style={{position: 'absolute', right: 5, textAlign: 'right', width: 34, lineHeight: "18px", top: 3}}>
// 							{this.printDuration()}
// 						</div>
// 					</>
// 				else
// 					<>
// 						<div style={{position: 'absolute', right: 0, top: 0, bottom: 0, width: 50}}/>
// 						<div style={{position: 'absolute', right: 5, textAlign: 'right', width: 34, lineHeight: "18px", top: 5}}>
// 							{this.printCombined()}
// 						</div>
// 					</>
// 				}
// 			</div>
// 		</>
