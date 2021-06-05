import React from 'react';
import {Component} from 'react';
import { Meteor } from 'meteor/meteor';
import { Button } from '../widgets/button'
import { Scrollbar } from '../widgets/scroll'

export portalStoreUpdate = null

export class ModalPortal extends React.Component
    componentDidMount: () =>
        console.log this.props
        portalStoreUpdate(this.props)
    
    componentWillUnmount: () =>
        portalStoreUpdate(null)

    render: ->
        
        return null


export class Modal extends React.Component
    constructor: (props) ->
        super(props)

        this.state = {contents: null}

        portalStoreUpdate = (state) =>
            this.setState({contents: state})

    onClose: () =>
        this.setState({contents: null})

    render: ->
        if not this.state.contents
            return null
        contents = this.state.contents

        return <>
            <div style={
                position: 'fixed'
                left: 0, top: 0, right: 0, bottom: 0
                backgroundColor: 'rgba(25,25,25,0.8)'
                cursor: 'pointer'
                zIndex: 198
            } onClick={this.onClose}></div>
            <div className={[
                "window"
                "modal-window"
                'window-titled'
                "window-" + (contents.type ? "default")
            ].join(' ')}>
                <div className="modal-close">
                    <Button onClick={contents.onClose ? this.onClose} icon={['fas', 'times']} />
                </div>
                {if contents.title
                    <div className="window-title">
                        {contents.title}
                    </div>
                }
                <div className="window-content">
                    <Scrollbar>
                        {contents.children}
                    </Scrollbar>
                </div>
                {if contents.onSave or contents.cancelTitle
                    <div className="modal-menu">
                        {if contents.cancelTitle
                            <Button onClick={contents.onClose}>{contents.cancelTitle}</Button>
                        }
                        {if contents.onSave
                            <Button onClick={contents.onSave} icon={contents.saveIcon}>{contents.saveTitle}</Button>
                        }
                    </div>
                }
            </div>
        </>