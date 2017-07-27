import React from 'react';
import ReactDOM from 'react-dom';
import {HashRouter as Router} from 'react-router-dom';
import {createStore} from 'redux';
import {Provider} from 'react-redux';

import reducer from './redux/reducer';
import App from './components/App';

const socket = new WebSocket(`ws://${location.hostname}:${location.port}`);
const store = createStore(reducer(socket.send));
socket.onmessage = (event) => store.dispatch(JSON.parse(event.data));

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