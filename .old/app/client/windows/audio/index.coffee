import React from 'react';
import {Component} from 'react';
import { Meteor } from 'meteor/meteor';
import { Window } from '../../widgets/window'

import { BarGraph } from '../../widgets/bargraph'
import { Button } from '../../widgets/button'

export class AudioView extends React.Component
	constructor: (props) ->
		super(props)
		this.state = {}

	render: ->
		return <>
			<div className="audio-section">
				<Window
					title="Audio"
					type="blue"
					padded={true}
					disabled="Module Disabled"
					modal={
						title: 'Set Audio Levels'
						children: <>
							Set Audio Level by Slider for Master Out and Aux Out.
							When open: Select Level and Fader on Desk changes value.
						</>
					}
				>
					<div className="audio-window">
						<div className="audio-meters">
							<div className="meter-group">
								<div className="meter-group-content">
									<BarGraph title="L" vertical={true} value={100} width={5}/>
									<BarGraph title="R" vertical={true} value={100} width={5}/>
									<BarGraph title="1" vertical={true} value={100} width={5}/>
									<BarGraph title="2" vertical={true} value={100} width={5}/>
									<BarGraph title="3" vertical={true} value={100} width={5}/>
									<BarGraph title="4" vertical={true} value={100} width={5}/>
									<BarGraph title="5" vertical={true} value={100} width={5}/>
									<BarGraph title="5" vertical={true} value={100} width={5}/>
									<BarGraph title="7" vertical={true} value={100} width={5}/>
									<BarGraph title="8" vertical={true} value={100} width={5}/>
								</div>
								<div className="meter-group-title">
									Inputs
								</div>
							</div>
							<div className="meter-group">
								<div className="meter-group-content">
									<BarGraph title="L" vertical={true} value={100} width={10}/>
									<BarGraph title="R" vertical={true} value={100} width={10}/>
								</div>
								<div className="meter-group-title">
									Master
								</div>
							</div>
						</div>
						<div className="audio-settings">
							<div className="desk-button-main-row">
								<Button windowMainButton={true}>
									Set Levels
								</Button>
							</div>
						</div>
					</div>
					
				</Window>
			</div>
		</>