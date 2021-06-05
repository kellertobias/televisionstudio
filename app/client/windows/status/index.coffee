import React from 'react';
import {Component} from 'react';
import { Meteor } from 'meteor/meteor';
import { Window } from '../../widgets/window'
import _ from 'underscore'
import moment from 'moment'
import 'moment-duration-format';
import { BarGraph } from '../../widgets/bargraph'
import { Button } from '../../widgets/button'
import { ModalPortal } from '../../widgets/modal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { api } from '/client/model'

	
class VideoServerMenu extends React.Component
	constructor: (props) ->
		super(props)

		this.state = {}

	componentDidMount: () =>
		this.stopSubscription = api.subscribe('/d/usage', (err, ret) =>
			if err
				return console.error(err)
			this.setState(ret)
		)
	
	componentWillUnmount: () =>
		this.stopSubscription()


	render: ->
		return <div className="state-servers">
			<Window type="pink" title="Server State" compact={true} padded={true}>
				<h3>Streaming Server</h3>
				{if this.state?.obs
					<>
						<BarGraph title="CPU" horizontal={true} value={this.state.obs?.cpu}/>
						<BarGraph title="RAM" horizontal={true} value={this.state.obs?.ram}/>
						<BarGraph title="SSD" horizontal={true} value={this.state.obs?.disk}/>
					</>
				else
					<span className="text-danger">Not Connected</span>
				}

				<h3>Control Desk</h3>
				{if this.state?.desk
					<>
						<BarGraph title="CPU" horizontal={true} value={this.state.desk?.cpu}/>
						<BarGraph title="RAM" horizontal={true} value={this.state.desk?.ram}/>
					</>
				else
					<span className="text-danger">Not Connected</span>
				}
			</Window>
		</div>

class VideoNormMenu extends React.Component
	constructor: (props) ->
		super(props)

		this.state = {}

	componentDidMount: () =>
		this.stopSubscription = api.subscribe('/d/global', (err, ret) =>
			if err
				return console.error(err)
			this.setState({
				obsSize: ret.obs.size,
				obsFps: ret.obs.fps,
				atemSize: ret.atem.size,
				atemFps: ret.atem.fps,
				sdiLevel: ret.atem.sdiLevel
			})
		)
	
	componentWillUnmount: () =>
		this.stopSubscription()


	render: ->
		return <div className="state-video-norm">
			<Window
				type="pink"
				title="Video Norm"
				compact={true}
				padded={true}
				modal={
					title: "Set Framerate and Resoluton"
					saveTitle: "Save Changes"
					cancelTitle: "Close without Saving"
					onSave: () => return
					children: <>
						<div className="row">
							<div className="col-xs-6">
								ATEM Resolution and Framerate
							</div>
							<div className="col-xs-6">
								Dropdown
							</div>
						</div>
						<div className="row">
							<div className="col-xs-6">
								OBS Resolution
							</div>
							<div className="col-xs-6">
								Dropdown
							</div>
						</div>
						<div className="row">
							<div className="col-xs-6">
								OBS Framerate
							</div>
							<div className="col-xs-6">
								Dropdown
							</div>
						</div>
					</>
				}
			>
				<span>OBS: {this.state.obsSize}</span>{Number(this.state.obsFps).toFixed(2)}<br/>
				<span>MIX: {this.state.atemSize}</span>{Number(this.state.atemFps).toFixed(2)}
				<div className="desk-button-mini-row">
					<Button icon="cog" /> 
				</div>
			</Window>
		</div>

class VideoOnAirStatus extends React.Component
	constructor: (props) ->
		super(props)

		this.state = {}
		this.subscriptions = []

	componentDidMount: () =>
		this.interval = setInterval(this.tick, 1000)
		this.subscriptions = [
			api.subscribe('/d/streaming', (err, ret) =>
				if err
					return console.error(err)

				this.setState({streaming: ret})
			)
		,
			api.subscribe('/d/recording', (err, ret) =>
				if err
					return console.error(err)

				this.setState({recording: ret})
			)
		]	
	
	componentWillUnmount: () =>
		this.subscriptions.forEach(stop => stop())
		clearInterval(this.interval)


	
	tick: () =>
		this.setState({time: new Date()})
	
	renderServer: ->
		return <div className="text-muted" style={marginLeft: -20}>{this.state.streaming?.server?.server?.split?('://')?[1] ? 'No Server'}</div>

	render: ->
		return <div className="state-data">
			<Window
				type="pink"
				title="Stream/File"
				compact={true}
				padded={true}
				modal={
					title: 'Streaming and Recording'
					children: <>
						Start Stream or Recording
						Change Stream Target
						Change Recording Drive (Only Drives, no Folders)
						Later: Button to see existing recordings and delete them
					</>
				}
			>
				<div className="state-data-segment">
					<h3>Stream</h3>
					{if this.state.streaming?.status == 'running'
						<div className="state-data-segment-content">
							<div className="state-data-segment-icon">
								<FontAwesomeIcon icon={['fas', 'satellite-dish']} className="text-danger"/>
							</div>
							<div className="state-data-segment-text">
								<span className="state-data-segment-main">{this.state.streaming.time.split(".")[0]}</span><br/>
								<span className="text-muted">{this.state.streaming.bandwidth} bkit/s</span><br/>
								{this.renderServer()}
							</div>
						</div>
					else
						<div className="state-data-segment-content">
							<div className="state-data-segment-icon">
								<FontAwesomeIcon icon={['fas', 'pause']} className="text-muted"/>
							</div>
							<div className="state-data-segment-text text-muted">
								Not Active<br />
								{this.renderServer()}
							</div>
						</div>
					}
				</div>
				
				<div className="state-data-segment">
					<h3>Recording</h3>
					{if this.state.recording?.status == 'running'
						<div className="state-data-segment-content">
							<div className="state-data-segment-icon">
								<FontAwesomeIcon icon={['fas', 'circle']} className="text-danger"/>
							</div>
							<div className="state-data-segment-text">
								<span className="state-data-segment-main">{this.state.recording.time.split(".")[0]}</span>
							</div>
						</div>
					else
						<div className="state-data-segment-content">
							<div className="state-data-segment-icon">
								<FontAwesomeIcon icon={['fas', 'pause']} className="text-muted"/>
							</div>
							<div className="state-data-segment-text text-muted">
								Not Recording
							</div>
						</div>

					}
				</div>

				<div className="desk-button-mini-row">
					<Button icon="cog" /> 
				</div>
			</Window>
		</div>


export class StateView extends React.Component
	constructor: (props) ->
		super(props)

	render: ->
		return <>
			<VideoServerMenu />
			<VideoNormMenu />
			<VideoOnAirStatus />
		</>