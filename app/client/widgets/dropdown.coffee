import React from 'react';
import _ from 'underscore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export class Dropdown extends React.Component
	constructor: (props) ->
		super(props)
		this.state = {
			open: false
		}

	render: =>
		return <div
			className={"desk-dropdown"}
			onClick={this.toggleOpen}
		>
			<div className="desk-dropdown-button" onClick={() => this.setState({open: !this.state.open})}>
				{if this.props.value then this.props.options[this.props.value] else <div className="desk-dropdown-placeholder">{this.props.placeholder}</div>}
				<FontAwesomeIcon icon={['fas', 'caret-down']} />
			</div>
			{if this.state.open
				<div className="desk-dropdown-droppable">
					<div className="desk-menu">
						{_.map this.props.options, (title, value) =>
							return <div className="desk-menu-entry" key={value} onClick={() =>
								this.props.onChange(value)
								this.setState({open: false})
							}>
								{title}
							</div>
						}
					</div>
				</div>
			}
		</div>