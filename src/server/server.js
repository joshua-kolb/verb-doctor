import {Server as WebSocketServer} from 'uws';
import generateGuid from 'uuid/v4';
import {createStore, applyMiddleware} from 'redux';
import logger from 'winston';
import reducer from './redux/reducer';
import Actions from './redux/actionCreators';

import cardTypes from './cardTypes';
import cards from './cards';

export default class Server {

	constructor(httpServer) {
		this.clients = [];
		this.store = createStore(reducer(this.emit, this.setSocketProp));
		this.webSocketServer = new WebSocketServer({ server: httpServer });
		this.webSocketServer.on('connection', this.onWebSocketConnection);

		this.store.dispatch(Actions.setCardTypes(cardTypes));
		this.store.dispatch(Actions.setCards(cards));
	}

	onWebSocketConnection(socket) {
		socket.id = generateGuid();
		this.clients.push(socket);
		socket.on('message', function (message) {
			const action = JSON.parse(message)
			action.meta = {
				remote: true,
				sockId: socket.id,
				player: socket.player,
				game: socket.game
			};
			this.store.dispatch(action);
		});
		socket.on('disconnect', function () {
			this.clients.splice(this.clients.indexOf(socket), 1);
		});
	}

	emit(action, propName, propValue) {
		this.clients.forEach((socket) => {
			if (!propName || socket[propName] === propValue) {
				socket.send(JSON.stringify(action));
			}
		});
	}

	setSocketProp(sockId, propName, propValue) {
		this.clients.find((socket) => socket.id === sockId)[propName] = propValue;
	}
}
