import React, {Component} from 'react';
import {Route, Switch} from 'react-router-dom';

import {LoginContainer} from './Lobby/Login';
import {GameBrowserContainer} from './Lobby/GameBrowser';

export default class App extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<Switch>
				<Route exact path="/" component={LoginContainer} />
				<Route path="/browseGames" component={GameBrowserContainer} />
			</Switch>
		);
	}
}