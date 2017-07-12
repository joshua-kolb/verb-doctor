import {List} from 'immutable';

export default class Actions {

	// Only dispatched to the server reducer
	static setCardTypes(cardTypes) {
		return {
			type: 'SET_CARD_TYPES',
			cardTypes: cardTypes
		};
	}

	// Only dispatched to the server reducer
	static setCards(cards) {
		return {
			type: 'SET_CARDS',
			cards: cards
		};
	}

	// Only dispatched to the client reducer
	static error(message) {
		return {
			type: 'ERROR',
			message: message
		};
	}

	// Only dispatched to the client reducer
	static setLobbyGames(games) {
		let result = List();
		if (games) {
			games.keySeq().forEach((gameName) => {
				result = result.push(Map({
					name: gameName,
					started: games.getIn([gameName, 'started']),
					host: games.getIn([gameName, 'host']),
					players: games.getIn([gameName, 'players']).keySeq(),
					hasPassword: games.hasIn([gameName, 'password'])
				}));
			});
		}

		return {
			type: 'SET_LOBBY_GAMES',
			games: result
		}
	}

	// Only dispatched to the client reducer
	static setCurrentGame(game) {
		return {
			type: 'SET_CURRENT_GAME',
			game: game
		}
	}

}