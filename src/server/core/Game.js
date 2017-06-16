import {List, Map, fromJS} from 'immutable';
import Lobby from './Lobby';

const NUMBER_OF_CARDS_TO_DEAL_PER_TYPE = 4;

export default class Game {

	static create(state, hostPlayerName, gameName, password) {

		if (!state.get('lobby') || !state.get('lobby').includes(hostPlayerName)) {
			// If host isn't in the lobby, then don't alter the state
			console.warn(`Player "${hostPlayerName}" tried to create the game "${gameName}", but was not found in the lobby.`);
			return state;
		}

		let newGame = fromJS({
			name: gameName,
			host: hostPlayerName,
			started: false,
			players: {
				[hostPlayerName]: {}
			}
		});

		if (password) {
			newGame = newGame.set('password', password);
		}

		if(!state.has('games')) {
			console.log(`Player "${hostPlayerName}" successfully created the game "${gameName}" (games state was created).`);
			return Lobby.logout(state, hostPlayerName)
			            .set('games', List.of(newGame));
		}

		if(state.get('games').some((game) => game.get('name') === newGame.get('name'))) {
			// If game name is already taken, then don't alter the state
			console.warn(`Player "${hostPlayerName}" tried to create the game "${gameName}", but the game name was already taken.`);
			return state;
		}

		console.log(`Player "${hostPlayerName}" successfully created the game "${gameName}" (the new game was added to the list of existing games).`);
		return Lobby.logout(state, hostPlayerName)
		            .update('games', (games) => games.push(newGame));
	}

	static join(state, playerName, gameName, password) {

		const gameIndex = state.get('games').findIndex((game) => game.get('name') === gameName);
		const game = state.getIn(['games', gameIndex]);

		if (gameIndex === -1) {
			console.warn(`Player "${playerName}" attempted to join game "${gameName}", but no such game was found.`);
			return state;
		}

		if (game.get('password') !== password) {
			console.warn(`Player "${playerName}" attempted to join game "${gameName}", but the password entered was incorrect.`);
			return state;
		}

		if (game.hasIn(['players', playerName])) {
			console.warn(`Player "${playerName}" attempted to join game "${gameName}", but is already apart of the game.`);
			return state;
		}

		if (!state.get('lobby').includes(playerName)) {
			console.warn(`Player "${playerName}" attempted to join game "${gameName}", but the player doesn't exist in the lobby.`);
			return state;
		}

		state = Lobby.logout(state, playerName);

		if (!game.get('started')) {
			console.log(`Player "${playerName}" successfully join the game "${gameName}" (which has not yet been started).`);
			return state.setIn(['games', gameIndex, 'players', playerName], Map());
		}

		state = state.setIn(['games', gameIndex, 'players', playerName], Map({ score: 0 }));
		game.get('decks').forEach((deck, cardType) => {
			if (cardType !== 'situation') {
				state = Game.dealCards(state, gameIndex, playerName, cardType, NUMBER_OF_CARDS_TO_DEAL_PER_TYPE);
			}
		});

		return state;
	}

	static dealCards(state, gameIndex, playerName, cardType, amount) {

		const game = state.getIn(['games', gameIndex]);
		if (!game) {
			console.err(`Attempted to deal cards for game with index "${gameIndex}", but no such game exists.`);
			return state;
		}

		if (!game.hasIn(['players', playerName])) {
			console.err(`Attempted to deal cards to player "${playerName}" in game with index "${gameIndex}", but the player doesn't exist in the game.`);
			return state;
		}

		let hand = game.getIn(['players', playerName, 'hand']);
		if (!hand) {
			hand = List();
		}

		let deck = game.getIn(['decks', cardType]);
		if (deck.size < amount) {
			hand = deck;
			amount -= deck.size;
			state = Game.createDeck(state, gameIndex, cardType);
		}

		hand = hand.concat(deck.slice(0, amount));
		deck = deck.splice(0, amount);

		console.log(`Successfully dealt ${amount} cards of type "${cardType}" to player "${playerName} in game with index "${gameIndex}".`);
		return state.setIn(['games', gameIndex, 'players', playerName, 'hand'], hand)
		            .setIn(['games', gameIndex, 'decks', cardType], deck);
	}

	static createDeck(state, gameIndex, cardType) {

		const game = state.getIn(['games', gameIndex]);
		if (!game) {
			console.err(`Attempted to create deck with cardType "${cardType}" for game with index "${gameIndex}", but the game doesn't exist.`);
			return state;
		}

		const newDeck = Game.shuffle(state.get('cards').filter((card) => card.get('type') === cardType));
		if (!newDeck.size) {
			console.err(`Attempted to create deck with cardType "${cardType}" for game with index "${gameIndex}", but no cards were put into the deck.`);
			return state;
		}

		console.log(`Successfully created deck with cardType "${cardType}" for game with index "${gameIndex}".`);
		return state.setIn(['games', gameIndex, 'decks', cardType], newDeck);
	}

	static shuffle(deck) {
		deck = deck.toJS();
		let top = deck.length;

		while (top > 0) {
			randomIndex = Math.floor(Math.random() * top);
			top--;
			temp = array[top];
			array[top] = array[randomIndex];
			array[randomIndex] = temp;
		}

		return fromJS(deck);
	}

}