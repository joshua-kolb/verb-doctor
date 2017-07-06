import {Server as WebSocketServer} from 'uws';
import {createStore, applyMiddleware} from 'redux';
import logger from 'winston';
import reducer from './redux/reducer';
import Actions from './redux/actionCreators';

import cardTypes from './cardTypes';
import cards from './cards';

export default class Server {

	constructor(httpServer) {
		this.clients = [];
		this.store = createStore(reducer(this.broadcast, this.emitToPlayer, this.emitToGame));
		this.webSocketServer = new WebSocketServer({ server: httpServer });
		this.webSocketServer.on('connection', onWebSocketConnection);

		store.dispatch(Actions.setCardTypes());
		store.dispatch(Actions.setCards());

		store.subscribe(function () {

		});
	}

	onWebSocketConnection(socket) {
		this.clients.push(socket);
		socket.on('message', function (message) {
			const action = JSON.parse(message)
			action.meta = {
				remote: true,
				player: socket.player,
				game: socket.game
			};
			store.dispatch(action);
		});
		socket.on('disconnect', function () {
			this.clients.splice(this.clients.indexOf(socket), 1);
		});
	}

	broadcast(action) {
		this.clients.forEach((socket) => socket.send(action));
	}

	emitToPlayer(playerName, action) {
		this.clients.find((socket) => socket.player === playerName).send(action);
	}

	emitToGame(gameName, action) {
		this.clients.forEach((socket) => {
			if (socket.game === gameName) {
				socket.send(action);
			}
		});
	}
}
