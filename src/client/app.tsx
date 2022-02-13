import React from 'react';
import { Router, Route, Switch } from 'react-router';
import { Link } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';

import { DeskGUI } from './desk';
import { TimeModal } from './modals/modal-time';
import { ShowModal } from './modals/modal-shows';
import { SettingsModal } from './modals/modal-settings';
import { StreamSetupModal } from './modals/modal-streaming';
import { AudioModal } from './modals/modal-audio';

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
				<Route
					exact
					path="/"
					render={() => {
						browserHistory.push('/desk');

						return 'Will forward you to the Control Desk';
					}}
				/>
				<Route exact path="/desk" render={() => <DeskGUI />} />
				<Route
					exact
					path="/desk/showtime"
					render={() => (
						<DeskGUI>
							<TimeModal />
						</DeskGUI>
					)}
				/>
				<Route
					path="/desk/shows"
					render={({ location, match }) => (
						<DeskGUI>
							<ShowModal path={location.pathname.slice(match.path.length)} />
						</DeskGUI>
					)}
				/>
				<Route
					exact
					path="/desk/settings"
					render={() => (
						<DeskGUI>
							<SettingsModal />
						</DeskGUI>
					)}
				/>
				<Route
					exact
					path="/desk/stream"
					render={() => (
						<DeskGUI>
							<StreamSetupModal />
						</DeskGUI>
					)}
				/>
				<Route
					exact
					path="/desk/audio"
					render={() => (
						<DeskGUI>
							<AudioModal />
						</DeskGUI>
					)}
				/>
				<Route component={NotFoundPage} />
			</Switch>
		</Router>
	);
};
