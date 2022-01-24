import React from 'react';
import {Component} from 'react';
import { Meteor } from 'meteor/meteor';
import { Window } from '../../widgets/window'
import { Button } from '../../widgets/button'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

import { api } from '/client/model'

import _ from 'underscore'
import moment from 'moment'

COLUMNS = 8

class MacroTimer extends React.Component
	constructor: (props) ->
		super(props)
		this.state = {
			percentage: if props.done then 100 else 0
			duration: props.step?.duration
			trigger: props.step?.trigger
		}
		this.interval = null
	
	componentDidMount: () =>
		if(!this.props.timeBase)
			return
		this.interval = setInterval(this.update, 100)
		this.update()
	
	componentWillUnmount: () =>
		if this.interval != null
			clearInterval(this.interval)

	update: () =>
		done = false
		set = {}
		if this.props.done
			done = true
			percentage = 100
			set[this.props.change] = this.props.step[this.props.change]
		else
			now = new Date()
			timeBase = this.props.timeBase
			duration = this.props.duration
			elapsed = (timeBase - now) / 1000
			percentage = elapsed / duration * 100

			percentage = 100 - Math.min(100, Math.max(0, percentage))
			set[this.props.change] = Math.max(0, elapsed)
			set.percentage = percentage

		this.setState(set)

		done = percentage == 100
		if done && this.interval != null
			clearInterval(this.interval)

	printCombined: () =>
		if this.props.done
			return 'DONE'

		if this.props.change == 'duration'
			return "#{Number(this.state.duration).toFixed(1)}s"
		
		if this.props.step.trigger == 'GO' or not this.props.step.trigger?
			return 'GO'
		return "#{Number(this.state.trigger).toFixed(1)}s"


	printTrigger: () =>
		if this.props.done
			return '-'

		if this.props.step.trigger == 'GO'
			return 'GO'
		
		if not this.props.step.trigger
			return 'GO'
		

		if this.state.trigger == 0
			return 'RUN'

		return "#{Number(this.state.trigger ? this.props.step.trigger).toFixed(1)}s"
			
	printDuration: () =>
		if this.props.done
			return 'DONE'

		if not this.props.step.duration
			return '0s'


		duration = if this.state.duration == 0
			0
		else
			this.state.duration
			

		return "#{Number(duration).toFixed(1)}s"

	render: ->
		return <>
			<div className="macro-step-background">
				<div
					className="macro-step-background-fill"
					style={
						background: switch this.props.change
							when 'duration' then '#005500'
							when 'trigger' then '#BB8800'
							else '#005500'
						position: 'absolute'
						left: 0
						top: 0
						bottom: 0
						width: "#{if this.props.done then 100 else this.state.percentage}%"
					}
				/>
			</div>
			<div
				className="macro-step-info"
				style={
					position: 'absolute'
					zIndex: 10
					top: 0
					bottom: 0
					right: 0
				}
			>
				{if this.props.isMasterWindow
					<>
						<div style={{position: 'absolute', right: 0, top: 0, bottom: 0, width: 70}}/>
						<div style={{position: 'absolute', right: 48, lineHeight: "18px", top: 3}}>
							{this.printTrigger()}
						</div>
						<div style={{position: 'absolute', right: 42, borderRight: '1px solid white', height: 18, top: 4}} />
						<div style={{position: 'absolute', right: 5, textAlign: 'right', width: 34, lineHeight: "18px", top: 3}}>
							{this.printDuration()}
						</div>
					</>
				else
					<>
						<div style={{position: 'absolute', right: 0, top: 0, bottom: 0, width: 50}}/>
						<div style={{position: 'absolute', right: 5, textAlign: 'right', width: 34, lineHeight: "18px", top: 5}}>
							{this.printCombined()}
						</div>
					</>
				}
			</div>
		</>

class MacroStep extends React.Component
	constructor: (props) ->
		super(props)		
		this.state = {}

	renderBackground: () ->
		step = this.props.step

		if step.done
			return <MacroTimer
				key={"macro-step-timer-done"}
				done={true}
				stepDuration={step.duration}
				stepTrigger={step.trigger}
				step={{duration: step.duration, trigger: step.trigger}}
				isMasterWindow={this.props.isMasterWindow}
			/>

		if step.started
			return <MacroTimer
				key={"macro-step-timer-started"}
				timeBase={moment(step.started).add(step.duration, 'seconds').toDate()}
				duration={step.duration}
				change="duration"
				step={{duration: step.duration, trigger: step.trigger}}
				isMasterWindow={this.props.isMasterWindow}
			/>
		
		if step.triggerAt and typeof step.trigger == 'number'
			return <MacroTimer
				key={"macro-step-timer-trigger"}
				timeBase={moment(step.triggerAt).toDate()}
				duration={step.trigger}
				change="trigger"
				step={{duration: step.duration, trigger: step.trigger}}
				isMasterWindow={this.props.isMasterWindow}
			/>

		return <MacroTimer
			key={"macro-step-timer-default"}
			step={{duration: step.duration, trigger: step.trigger}}
			isMasterWindow={this.props.isMasterWindow}
		/>

	
	render: () ->
		if not this.props.step
			return

		step = this.props.step

		return <div
			className={[
				"macro-step"
				if this.props.isNextIteration then 'macro-step-next-iter' else ''
				if step.running then 'macro-step-active' else ''
				if not step.running and step.goAt then 'macro-step-triggered' else ''
			].join(' ')}
			key={step.index}
		>
			{this.renderBackground()}
			<div className="macro-step-foreground">
				<div className="macro-step-title">{step.index + 1} {step.name}</div>
			</div>
		</div>

class Macro extends React.Component
	constructor: (props) ->
		super(props)
		this.stopSubscription
		
		this.state = {
			macro: {}
		}


	componentDidMount: () =>
		subscriptionEndpoint = "/d/macros/#{this.props.execNumber}"
		this.stopSubscription = api.subscribe(subscriptionEndpoint, (err, ret) =>
			if err
				return console.error(err)
			this.setState({macro: ret})
		)
	
	componentWillUnmount: () =>
		this.stopSubscription.stop()

	handlerSelectMaster: () =>
		this.props.selectMaster(this.state.macro?.index)

	handlerToggleMasterSelection: () =>
		this.props.enableMasterSelection(not this.props.masterSelectionActive)

	windowOnclick: () =>
		exec = if this.props.isMasterWindow
			0
		else
			this.props.execNumber

		if this.props.masterSelectionActive
			if this.props.isMasterWindow
				return this.handlerToggleMasterSelection()
			else
				return this.handlerSelectMaster()

		api.send('/action/macros/go', {exec})

	renderStep: (step, mod) =>
		mod ?= {}
		if not step
			return

		return <MacroStep
			key={'step-' + step?.iteration + '-' + (step?.index ? 0)}
			macro={this.state.macro}
			step={step}
			isNextIteration={step?.iteration > 0}
			isMasterWindow={this.props.isMasterWindow}
			{...mod}
		/>

	renderInner: (macro) ->
		maxEntries = this.props.maxEntries ? 8
		steps = macro.next?.slice(0, maxEntries)
		hasEnded = macro.currentIndex == macro.total and not macro.run
		showMacroEnd = macro.currentIndex >= macro.total - 2 and not hasEnded

		if macro.total == 0
			return <div className="macro-ended">
				<p>Empty</p>
				<p>There are no steps in this macro. Add steps in the configuration file.</p>
			</div>
		
		return <>
			{_.map steps, (step, i) => this.renderStep(step)}
			{if _.size(steps) < maxEntries
				<div className="macro-ended">
					{if hasEnded
						"Macro has ended"
					else if macro.loop
						"Restarts here"
					else
						"Last Step"
					}
				</div>
			}
			{if hasEnded and not macro.loop
				<div className="macro-ended">
					<Button onClick={() =>
						api.send('/action/macros/reset', {exec: this.state.macro?.exec[1]})
					}>
						Reset
					</Button>
				</div>
			}
		</>

	renderWindow: (macro) ->
		execNumber = this.state.macro?.exec?.join('.')

		return <div
			className={switch
				when this.props.isMasterWindow then "macros-master"
				else "macro-list-column"
			}
		>
			<Window
				title={<>
					{switch
						when this.props.isMasterWindow then "Master Executor: #{macro.name}"	
						else macro.name
					}
					{if macro.loop
						<FontAwesomeIcon icon={['fas', 'sync']} style={float: 'right', marginTop: 3, opacity: 0.5} />
					}
				</>
				}
				onClick={this.windowOnclick}
				type="orange"
			>
				<div className="macro-list">
					{if this.props.masterSelectionActive and not this.props.isMasterWindow
						<div className="macro-list">
							<Button onClick={this.handlerSelectMaster} style={textAlign: 'center', fontSize: 14}>
								Make Master <br/>
								<FontAwesomeIcon icon={['fas', 'star']} style={fontSize: 18} />
							</Button>
						</div>
					else
						this.renderInner(macro)
					}
					{if this.props.isMasterWindow
						this.renderMasterSelectButton()
					else
						<div className="macro-info">
							{if macro.isMaster
								<span className="macro-master">Master ({execNumber})</span>
							else
								"Exec #{execNumber}"
							}
						</div>
					}
				</div>
			</Window>
		</div>

	renderMasterSelectButton: ->
		return <div className="macro-master-buttons">
			<Button
				onClick={this.handlerToggleMasterSelection}
			>
				{if this.props.masterSelectionActive
					"Cancel Selection Mode"
				else
					"Select Master Sequence"
				}
			</Button>
		</div>

	render: ->
		macro = this.state.macro ? false
		if not macro and this.props.isMasterWindow
			return <Window title={"Master Macro: Nothing Selected"} type="orange">
				<div className="macro-ended">
					No Master Macro Selected.
				</div>
				this.renderMasterSelectButton()
			</Window>
		else if not macro or macro.empty
			execNumber = this.state.macro?.exec?.join('.')
			return <div className="macro-list-column" style={opacity: 0.4}>
				<Window title="Empty Macro" type="orange">
					<div className="macro-list">
						<div className="macro-ended">
							There is no Macro in this Executor
						</div>
						<div className="macro-info">
							{if macro.isMaster
								<span className="macro-master">Master ({execNumber})</span>
							else
								"Exec #{execNumber}"
							}
						</div>
					</div>
				</Window>
			</div>
		else
			return this.renderWindow(macro)

		

export class MacrosView extends React.Component
	constructor: (props) ->
		super(props)

		this.execNumbers = _.range(1, COLUMNS + 1, 1)
		this.state = {
			masterSelectionActive: false
		}

	render: ->

		return <>
			<div className="macros-list">
				{_.map this.execNumbers, (index) =>
					<Macro
						key={index}
						execNumber={index}
						maxEntries={3}
						masterSelectionActive={this.state.masterSelectionActive}
						selectMaster={(index) =>
							this.setState({masterSelectionActive: false})
							console.log("Making Macro Master: ", index)
							api.send('/action/macros/master', {macroIndex: index})
						}
					/>
				}
			</div>
			<Macro
				execNumber={"master"}
				maxEntries={8}
				isMasterWindow={true}
				masterSelectionActive={this.state.masterSelectionActive}
				enableMasterSelection={(enable) =>
					this.setState({masterSelectionActive: enable})
				}
			/>
		</>