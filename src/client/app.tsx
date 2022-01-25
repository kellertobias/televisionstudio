import React from 'react';
import { Router, Route, Switch } from 'react-router';
import { Link } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';

import { DeskGUI } from './desk';

library.add(fas, far, fab);

const browserHistory = createBrowserHistory();

const NotFoundPage: React.FC = () => (
	<div className="desk-body">
		<div className="desk">
			<div className="frame">
				<h1>404</h1>
				<Link to="/" className="desk-button">
					Back to Root
				</Link>
			</div>
		</div>
	</div>
);

export const AppRoot = (): JSX.Element => {
	return (
		<Router history={browserHistory}>
			<Switch>
				<Route exact path="/" render={() => <DeskGUI />} />
				<Route component={NotFoundPage} />
			</Switch>
		</Router>
	);
};
