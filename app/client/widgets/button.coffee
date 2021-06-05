import React from 'react';
import {Component} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { portalStoreUpdate } from './modal'
import _ from 'underscore'

export class Button extends React.Component
	constructor: (props) ->
		super(props)

	render: =>
		return <div className={[
				"desk-button"
				if this.props.windowMainButton then 'desk-button-main' else ''
				if this.props.className then this.props.className else ''
				if this.props.disabled then 'desk-button-disabled' else ''
			].join(' ')}
			onClick={
				switch
					when this.props.disabled then (e) =>
						e.stopPropagation()
						e.preventDefault()
					when this.props.onClick then (e) =>
						e.stopPropagation()
						e.preventDefault()
						this.props.onClick()
					when this.props.modal then  (e) =>
						e.stopPropagation()
						e.preventDefault()
						portalStoreUpdate(_.extend {}, this.props.modal, {
							onClose: () =>
								portalStoreUpdate(null)
								this.props.modal.onClose?()
						})
					else (e) =>
						console.log("Button Without Action")
			}
			style={this.props.style}
		>
			{if this.props.icon and this.props.children
				<FontAwesomeIcon icon={this.props.icon} style={marginRight: '5px'} />
			else if this.props.icon
				<div style={textAlign: 'center'}>
					<FontAwesomeIcon icon={this.props.icon} />
				</div>
			}
			{this.props.children}
		</div>