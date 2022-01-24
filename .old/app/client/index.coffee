import React from 'react';
import {Component} from 'react';
import { Meteor } from 'meteor/meteor';
import { render } from 'react-dom';
import { Router, Route, Switch } from 'react-router';
import { Link } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import { DeskGUI } from '/client/desk'

import _ from 'underscore'
import moment from 'moment'

browserHistory = createBrowserHistory();

class NotFoundPage extends Component
	render: ->
		return <div className="desk-body">
			<div className="desk">
				<div className="frame">
					<h1>404</h1>
					<Link
						to="/"
						className="desk-button"
					>
						Back to Root
					</Link>
				</div>
			</div>
		</div>

renderRoutes = () =>
	return (
		<Router history={browserHistory}>
			<Switch>
				<Route exact path="/" render={(props) =>
					return <DeskGUI />
				}/>
				<Route component={NotFoundPage}/>
			</Switch>
		</Router>
	)

Meteor.startup () =>
	render(renderRoutes(), document.getElementById('app'));