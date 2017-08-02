import React from 'react';
import ReactDOM from 'react-dom';
import {HashRouter as Router} from 'react-router-dom';
import {Provider} from 'react-redux';

import createCustomStore from './redux/store';
import App from './components/App';

const socket = new WebSocket(`ws://${location.hostname}:${location.port}`);
const store = createCustomStore(socket.send);
socket.onmessage = (event) => {
	const action = JSON.parse(event.data);
	action.meta.fromServer = true;
	store.dispatch(action);
};

ReactDOM.render(
	(
		<Provider store={store}>
			<Router>
				<App/>
			</Router>
		</Provider>
	),
	document.getElementById('app')
);