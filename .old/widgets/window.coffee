import React from 'react';
import {Component} from 'react';
import { Meteor } from 'meteor/meteor';
import { ModalPortal } from '../widgets/modal'
import _ from 'underscore'

export class Window extends React.Component
	constructor: (props) ->
		super(props)
		this.state = {modal: null}

	onClick: (e) =>
		if this.props.modal
			modal = this.props.modal
			this.setState({modal: {
				type: modal.type ? (this.props.type ? 'default')
				title: modal.title ? (this.props.title + ' Settings')
				children: modal.children
				cancelTitle: modal.cancelTitle
				saveTitle: modal.saveTitle
				saveIcon: modal.saveIcon
				onClose: () =>
					this.setState({modal: null})
					modal.onClose?()
				onSave: if modal.onSave
						() =>
							this.setState({modal: null})
							modal.onSave()
					else
						undefined
			}})
		if this.props.onClick
			this.props.onClick()

	render: ->
		return <div className={[
				"window"
				"window-" + (this.props.type ? "default")
				if this.props.title then 'window-titled' else ''
				if this.props.compact then 'window-titled-compact' else ''
				if this.props.padded then 'window-padded' else ''
			].join(' ')}
			onClick={this.onClick}
			style={
				opacity: if this.props.disabled then 0.3 else 1
			}
		>
			{if this.state.modal
				<ModalPortal {...this.state.modal} />
			}
			{if this.props.title
				<div className="window-title">
					{this.props.title}
				</div>
			}
			<div className="window-content">
				{this.props.children}

				{if this.props.disabled
					<div style={
						position: "absolute"
						left: 0
						right: 0
						bottom: 0
						top: 0
						background: 'rgba(0,0,0,0.8)'
						textAlign: 'center'
						color: '#AAA'
						zIndex: 50
						padding: 10
						fontSize: 16
					}>
						{this.props.disabled}
					</div>
				}
			</div>
		</div>