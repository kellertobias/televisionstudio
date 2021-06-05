import React from 'react';
import ScrollContainer from 'react-indiana-drag-scroll'

export class Scrollbar extends React.Component
	render: ->
		return <div className="scroll-container">
			{this.props.children}
		</div>
