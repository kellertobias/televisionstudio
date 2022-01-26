import React from 'react';
import {Component} from 'react';
import { Meteor } from 'meteor/meteor';
import { Window } from '../../widgets/window'
import { Button } from '../../widgets/button'
import _ from 'underscore'
import moment from 'moment'
import 'moment-duration-format';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { api } from '/client/model'


export class RateView extends React.Component
	constructor: (props) ->
		super(props)
		this.state = {
			position: 0
			framerate: 1
			rateSelected: null
			rates: {}
				
		}

	componentDidMount: () =>
		stopSub1 = api.subscribe('/d/trans-rate', (err, ret) =>
			if err
				return console.error(err)

			this.setState({
				rateSelected: ret._rateSelected
				rates: {
					master: ret.master
					obs: ret.obs
					dsk1: ret.dsk1
					dsk2: ret.dsk2
				}
			})
		)

		stopSub2 = api.subscribe('/d/trans-pos', (err, ret) =>
			if err
				return console.error(err)

			this.setState({
				position: ret
			})
		)

		stopSub3 = api.subscribe('/d/global', (err, ret) =>
			if err
				return console.error(err)
			this.setState({
				obsFramerate: ret.obs.fps,
				atemFramerate: if ret.atem.fps > 30 then ret.atem.fps / 2 else ret.atem.fps,
			})
		)

		this.stopSubscriptions = () =>
			stopSub1()
			stopSub2()
			stopSub3()
	
	componentWillUnmount: () =>
		this.stopSubscription()


	render: ->
		return <>
			<div className="transition-bar">
				<Window type="green">
					<div className="transition-state">
						<div style={top: 3, right: 3, bottom: 3, left: 3, position: 'absolute'}>
							<div className="transition-state-fill" style={
								borderRadius: 2,
								position: "absolute",
								bottom: 0,
								left: 0,
								right: 0,
								margin: 0,
								height: (this.state.position / 10000) * 100 + "%"
							}/>
						</div>
					</div>
				</Window>
			</div>
			<div className="transition-rate">
				<Window title="Rate" type="green">
					{_.map this.state.rates, (rate, rateName) =>
						framerate = switch rateName
							when 'obs' then this.state.obsFramerate
							else this.state.atemFramerate

						rateSeconds = rate / framerate
						
						rateDisplay = Number(rateSeconds).toFixed(2)

						return <div className={[
								"rate-section"
								if this.state.rateSelected == rateName then 'rate-section-active' else ''
							].join(' ')}
							key={rateName}
						>
							<div className="rate-section-active">
								{if this.state.rateSelected == rateName
									<FontAwesomeIcon icon={['far', 'dot-circle']} />
								else
									<FontAwesomeIcon icon={['far', 'circle']} />
								}
							</div>
							<div className="rate-section-title">
								{switch rateName
									when 'master' then 'Master'
									when 'obs' then 'Graphics'
									when 'dsk1' then 'DSK1'
									when 'dsk2' then 'DSK2'
								}
							</div>
							<div className="rate-section-number">
								{rateDisplay}
							</div>
						</div>
					}
					<div className="desk-button-main-row">
						<Button windowMainButton={true} onClick={() =>
							api.send('/action/rate/change', {selectRate: switch this.state.rateSelected
								when 'master' then 'obs'
								when 'obs' then 'dsk1'
								when 'dsk1' then 'dsk2'
								when 'dsk2' then 'master'
								else 'master'
							})
						}>
							Select Rate
						</Button>
					</div>
				</Window>
			</div>
		</>