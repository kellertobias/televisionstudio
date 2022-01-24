import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom'; // Pages

export const AppRoot = (): JSX.Element => {
	return (
		<BrowserRouter>
			<Switch>
				<Route exact path="/" render={() => <div>Tobisk Smart Home</div>} />
			</Switch>
		</BrowserRouter>
	);
};
