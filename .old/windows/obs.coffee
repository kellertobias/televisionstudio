import React from 'react';
import {Component} from 'react';
import { Meteor } from 'meteor/meteor';
import { Window } from '../../widgets/window'
import _ from 'underscore'
import moment from 'moment'
import { Button } from '../../widgets/button'
import { Scrollbar } from '../../widgets/scroll'

import { api } from '/client/model'

class OBSScene extends React.Component
	render: ->
		return <div className="macro-list">

		</div>

export class OBSView extends React.Component
	constructor: (props) ->
		super(props)
		this.state = {
			scenes: []
		}

	
	componentDidMount: () =>
		this.stopSubscription = api.subscribe('/d/scenes', (err, ret) =>
			if err
				return console.error(err)
			this.setState({scenes: ret})
		)
	
	componentWillUnmount: () =>
		this.stopSubscription()


	render: ->
		return <>
			<div className="obs-scenes">
				<Window title={"OBS Scenes"} type="purple">
				    <Scrollbar>
						{_.map this.state.scenes, (scene, i) =>
							return <div key={i}>
								<Button onClick={() =>
									api.send('/action/scene/set', {name: scene.name})
								}>
									{scene.name}
									{if scene.live
										<span className="right">
											Live
										</span>
									else if scene.next
										<span className="right transition-auto">
											AUTO
										</span>
									}
								</Button>
							</div>
						}
					</Scrollbar>
				</Window>
			</div>
		</>