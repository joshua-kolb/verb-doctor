import React from 'react';
import ReactDOM from 'react-dom';

const socket = new WebSocket(`ws://${location.hostname}:${location.port}`);
socket.onopen = onSocketOpen;
socket.onmessage = onSocketMessage;

ReactDOM.render(
	(
		<div>
			Hello World!
		</div>
	),
	document.getElementById('app')
);

function onSocketOpen(event) {
	const action = {
		type: 'LOGIN',
		player: 'superuser'
	};

	socket.send(JSON.stringify(action));
}

function onSocketMessage(event) {
	console.log(event.data);
}