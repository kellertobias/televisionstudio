import React from 'react';
import {Component} from 'react';


export class BarGraph extends React.Component
	constructor: (props) ->
		super(props)

	render: =>
		return <div className={[
				"bar-graph"
				switch
					when this.props.vertical then 'bar-graph-vertical'
					when this.props.horizontal then 'bar-graph-horizontal'
					else 'bar-graph-vertical'
			].join(' ')}
			style={{
				[switch
					when this.props.vertical then 'width'
					when this.props.horizontal then 'height'
					else 'width'
				]: this.props.width + 3,
			}}
		>
			<div className="bar-graph-area" style={{
				[switch
					when this.props.vertical then 'width'
					when this.props.horizontal then 'height'
					else 'width'
				]: this.props.width,
				...(switch
					when this.props.width and this.props.horizontal then {
						marginTop: 1
						marginBottom: 1
					}
					when this.props.width then {
						marginLeft: 1
						marginRight: 1
					}
				)
			}}>
				<div className="bar-graph-level-back"/>
				<div className="bar-graph-level" style={{
					'clipPath': switch
						when this.props.vertical then 'inset(' + (100 - (this.props.value * 100)) + '% 0 0 0)'
						when this.props.horizontal then 'inset(0 ' + (100 - (this.props.value * 100)) + '% 0 0)'
						else 'inset(0 ' + (100 - (this.props.value * 100)) + '% 0 0)'
				}}/>
			</div>
			<div className="bar-graph-title">
				{this.props.title}
			</div>
		</div>