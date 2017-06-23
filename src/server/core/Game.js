import {List, Map, fromJS} from 'immutable';
import Lobby from './Lobby';
import logger from 'winston';

const NUMBER_OF_CARDS_TO_DEAL_PER_TYPE = 4;

export default class Game {

	static create(state, hostPlayerName, gameName, password) {

		if (!state.get('lobby') || !state.get('lobby').includes(hostPlayerName)) {
			// If host isn't in the lobby, then don't alter the state
			logger.warn(`Player "${hostPlayerName}" tried to create the game "${gameName}", but was not found in the lobby.`);
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
			logger.info(`Player "${hostPlayerName}" successfully created the game "${gameName}" (games state was created).`);
			return Lobby.logout(state, hostPlayerName)
			            .set('games', List.of(newGame));
		}

		if(state.get('games').some((game) => game.get('name') === newGame.get('name'))) {
			// If game name is already taken, then don't alter the state
			logger.warn(`Player "${hostPlayerName}" tried to create the game "${gameName}", but the game name was already taken.`);
			return state;
		}

		logger.info(`Player "${hostPlayerName}" successfully created the game "${gameName}" (the new game was added to the list of existing games).`);
		return Lobby.logout(state, hostPlayerName)
		            .update('games', (games) => games.push(newGame));
	}

	static join(state, playerName, gameName, password) {

		const gameIndex = state.get('games').findIndex((game) => game.get('name') === gameName);
		const game = state.getIn(['games', gameIndex]);

		if (gameIndex === -1) {
			logger.warn(`Player "${playerName}" attempted to join game "${gameName}", but no such game was found.`);
			return state;
		}

		if (game.get('password') !== password) {
			logger.warn(`Player "${playerName}" attempted to join game "${gameName}", but the password entered was incorrect.`);
			return state;
		}

		if (game.hasIn(['players', playerName])) {
			logger.warn(`Player "${playerName}" attempted to join game "${gameName}", but is already apart of the game.`);
			return state;
		}

		if (!state.get('lobby').includes(playerName)) {
			logger.warn(`Player "${playerName}" attempted to join game "${gameName}", but the player doesn't exist in the lobby.`);
			return state;
		}

		state = Lobby.logout(state, playerName);

		if (!game.get('started')) {
			logger.info(`Player "${playerName}" successfully join the game "${gameName}" (which has not yet been started).`);
			return state.setIn(['games', gameIndex, 'players', playerName], Map());
		}

		state = state.setIn(['games', gameIndex, 'players', playerName], Map({ score: 0 }));
		game.get('decks').forEach((deck, cardType) => {
			if (state.getIn(['cardTypes', cardType, 'playable'])) {
				state = dealPlayableCards(state, gameIndex, playerName, cardType, NUMBER_OF_CARDS_TO_DEAL_PER_TYPE);
			}
		});

		return state;
	}

	static start(state, playerName, gameName) {

		const gameIndex = state.get('games').findIndex((game) => game.get('name') === gameName);

		if (gameIndex === -1) {
			logger.warn(`Player "${playerName}" attempted to start game "${gameName}", but the game didn't exist.`);
			return state;
		}

		if (state.getIn(['games', gameIndex, 'started'])) {
			logger.warn(`Player "${playerName}" attempted to start game "${gameName}", but the game is already started.`);
			return state;
		}

		if (state.getIn(['games', gameIndex, 'host']) !== playerName) {
			logger.warn(`Player "${playerName}" attempted to start game "${gameName}", but they are not the host.`);
			return state;
		}

		const players = state.getIn(['games', gameIndex, 'players']);
		if (players.keySeq().size < 2) {
			logger.warn(`Player "${playerName}" attempted to start game "${gameName}", but the game didn't have enough players.`);
			return state;
		}

		state.get('cardTypes').forEach(function(cardType, cardTypeName) {
			state = createDeck(state, gameIndex, cardTypeName);
		});

		state = state.setIn(['games', gameIndex, 'decider'], players.keySeq().get(0));

		players.forEach(function(player, playerName) {
			state = state.setIn(['games', gameIndex, 'players', playerName, 'score'], 0);
			state.get('cardTypes').forEach(function(cardType, cardTypeName) {
				if (cardType.get('playable')) {
					state = dealPlayableCards(state, gameIndex, playerName, cardTypeName, NUMBER_OF_CARDS_TO_DEAL_PER_TYPE);
				}
			});
		});

		state.get('cardTypes').forEach(function(cardType, cardTypeName) {
			if (!cardType.get('playable')) {
				state = dealNonPlayableCard(state, gameIndex, cardTypeName);
			}
		});

		logger.info(`Player '${playerName}' successfully started game '${gameName}'`);
		return state.setIn(['games', gameIndex, 'started'], true);
	}

	static leave(state, playerName, gameName) {

		const gameIndex = state.get('games').findIndex((game) => game.get('name') === gameName);

		if (gameIndex === -1) {
			logger.warn(`Player "${playerName}" attempted to leave game "${gameName}", but the game didn't exist.`);
			return state;
		}

		if (!state.hasIn(['games', gameIndex, 'players', playerName])) {
			logger.warn(`Player "${playerName}" attempted to leave game "${gameName}", but was not in the game to begin with.`);
			return state;
		}

		logger.info(`Player "${playerName}" has successfully left game "${gameName}"`);
		state = state.deleteIn(['games', gameIndex, 'players', playerName])		             
		state = Lobby.login(state, playerName);

		if (state.hasIn(['games', gameIndex, 'submittedPlays'])) {
			const submittedPlayIndex = state.getIn(['games', gameIndex, 'submittedPlays'])
			                                .findIndex((submittedPlay) => submittedPlay.get('player') === playerName);
		
			if (submittedPlayIndex !== -1) {
				logger.info(`Because player "${playerName}" left game "${gameName}", their submittedPlay was removed.`);
				state = state.deleteIn(['games', gameIndex, 'submittedPlays', submittedPlayIndex]);
			}
		}

		const players = state.getIn(['games', gameIndex, 'players']).keySeq();
		if (players.size < 1 || (players.size < 2 && state.getIn(['games', gameIndex, 'started']))) {
			logger.info(`Because player "${playerName}" left game "${gameName}", there were no longer enough players to keep the game going. The game was removed.`);
			players.forEach(function (player) {
				state = Lobby.login(state, player);
			});
			state = state.deleteIn(['games', gameIndex]);
		} else if (state.getIn(['games', gameIndex, 'host']) === playerName) {
			const newHost = players.get(0);
			logger.info(`Because player "${playerName}" left game "${gameName}" and was the host, player "${newHost}" was promoted to be host.`)
			state = state.setIn(['games', gameIndex, 'host'], newHost);
		}

		return state;
	}

	static submitPlay(state, playerName, gameName, cards) {

		const gameIndex = state.get('games').findIndex((game) => game.get('name') === gameName);

		if (gameIndex === -1) {
			logger.warn(`Player "${playerName}" attempted to submit a play in game "${gameName}", but the game didn't exist.`);
			return state;
		}

		if (!state.hasIn(['games', gameIndex, 'players', playerName])) {
			logger.warn(`Player "${playerName}" attempted to submit a play in game "${gameName}", but was not in the game.`);
			return state;
		}

		if (state.getIn(['games', gameIndex, 'decider']) === playerName) {
			logger.warn(`Player "${playerName}" attempted to submit a play in game "${gameName}", but was the decider.`);
			return state;
		}

		const playerAlreadySubmitted = state.getIn(['games', gameIndex, 'submittedPlays'])
			.some((play) => play.get('player') === playerName);

		if (playerAlreadySubmitted) {
			logger.warn(`Player "${playerName}" attempted to submit a play in game "${gameName}", but they had already submitted one before.`);
			return state;
		}

		const hand = state.getIn(['games', gameIndex, 'players', playerName, 'hand']);
		const cardNotInPlayersHand = cards.some((playCard) => hand.every((handCard) => playCard !== handCard));
		if (cardNotInPlayersHand) {
			logger.warn(`Player "${playerName}" attempted to submit a play in game "${gameName}", but they tried to use cards that weren't in their hand.`)
			return state;
		}

		let slotTypeMismatch = false;
		let tooManyCards = false;
		let slots = state.getIn(['games', gameIndex, 'current_situation', 'slots']);
		cards.forEach(function(card) {
			if (slots.first() !== 'any' && slots.first() !== card.get('type')) {
				slotTypeMismatch = true;
			}

			if (slots.size === 0) {
				tooManyCards = true;
			}

			slots = slots.shift();

			if (card.get('slots').size > 0) {
				slots = slots.unshift(...(card.get('slots')));
			}
		});

		if (slotTypeMismatch) {
			logger.warn(`Player "${playerName}" attempted to submit a play in game "${gameName}", but there was a slot type mismatch.`);
			return state;
		}

		if (tooManyCards) {
			logger.warn(`Player "${playerName}" attempted to submit a play in game "${gameName}", but not all slots were filled.`);
			return state;
		}

		if (slots.size !== 0) {
			logger.warn(`Player "${playerName}" attempted to submit a play in game "${gameName}", but there were too many cards submitted.`);
			return state;
		}

		let typeCount = Map();
		cards.forEach(function(card, cardIndex) { 
			state = state.deleteIn(['games', gameIndex, 'players', playerName, 'hand', cardIndex]);
			typeCount = typeCount.update(card.get('type'), (count) => count ? count++ : 1);
		});

		typeCount.forEach((count, cardType) => 
			state = dealPlayableCards(state, gameIndex, playerName, cardType, count)
		);

		const play = Map({
			player: playerName,
			cardsSubmitted: cards
		});

		return state.updateIn(
			['games', gameIndex, 'submittedPlays'], 
			(submittedPlays) => submittedPlays ? submittedPlays.push(play) : List.of(play)
		);
	}

	static decideWinner(state, playerName, gameName, winnerName) {

		const gameIndex = state.get('games').findIndex((game) => game.get('name') === gameName);

		if (gameIndex === -1) {
			logger.warn(`Player "${playerName}" attempted to decide the winner in game "${gameName}", but the game didn't exist.`);
			return state;
		}

		if (playerName !== state.getIn(['games', gameIndex, 'decider'])) {
			logger.warn(`Player "${playerName}" attempted to decide the winner in game "${gameName}", but the player wasn't the decider.`);
			return state;
		}

		const submittedPlayIndex = state.getIn(['games', gameIndex, 'submittedPlays'])
		                                .findIndex((play) => play.get('player') === winnerName);
		
		if (submittedPlayIndex === -1) {
			logger.warn(`Player "${playerName}" attempted to decide the winner in game "${gameName}" to be player "${winnerName}", but player "${winnerName}" never submitted a play.`);
			return state;
		}

		const previousScore = state.getIn(['games', gameIndex, 'players', winnerName, 'score']);
		return state.setIn(['games', gameIndex, 'winnerOfLastRound'], winnerName)
		            .setIn(['games', gameIndex, 'players', winnerName, 'score'], previousScore + 1);
	}

}

function dealPlayableCards(state, gameIndex, playerName, cardType, amount) {

	const game = state.getIn(['games', gameIndex]);
	if (!game) {
		logger.error(`Attempted to deal cards for game with index "${gameIndex}", but no such game exists.`);
		return state;
	}

	if (!game.hasIn(['players', playerName])) {
		logger.error(`Attempted to deal cards to player "${playerName}" in game with index "${gameIndex}", but the player doesn't exist in the game.`);
		return state;
	}

	let hand = game.getIn(['players', playerName, 'hand']);
	if (!hand) {
		hand = List();
	}

	let deck = game.getIn(['decks', cardType]);
	if (deck.size < amount) {
		hand = hand.concat(deck);
		amount -= deck.size;
		state = createDeck(state, gameIndex, cardType);
		deck = state.getIn(['games', gameIndex, 'decks', cardType]);
	}

	hand = hand.concat(deck.slice(0, amount));
	deck = deck.splice(0, amount);

	logger.info(`Successfully dealt ${amount} card(s) of type "${cardType}" to player "${playerName} in game with index "${gameIndex}".`);
	return state.setIn(['games', gameIndex, 'players', playerName, 'hand'], hand)
	            .setIn(['games', gameIndex, 'decks', cardType], deck);
}

function createDeck(state, gameIndex, cardType) {

	const game = state.getIn(['games', gameIndex]);
	if (!game) {
		logger.error(`Attempted to create deck with cardType "${cardType}" for game with index "${gameIndex}", but the game doesn't exist.`);
		return state;
	}

	const newDeck = shuffle(state.get('cards').filter((card) => card.get('type') === cardType));
	if (!newDeck.size) {
		logger.error(`Attempted to create deck with cardType "${cardType}" for game with index "${gameIndex}", but no cards were put into the deck.`);
		return state;
	}

	logger.info(`Successfully created deck with cardType "${cardType}" for game with index "${gameIndex}".`);
	return state.setIn(['games', gameIndex, 'decks', cardType], newDeck);
}

function shuffle(deck) {
	deck = deck.toJS();
	let top = deck.length;

	while (top > 0) {
		const randomIndex = Math.floor(Math.random() * top);
		top--;
		const temp = deck[top];
		deck[top] = deck[randomIndex];
		deck[randomIndex] = temp;
	}

	return fromJS(deck);
}

function dealNonPlayableCard(state, gameIndex, cardType) {

	const game = state.getIn(['games', gameIndex]);
	if (!game) {
		logger.error(`Attempted to deal a nonplayable card for game with index "${gameIndex}", but no such game exists.`);
		return state;
	}

	if (state.getIn(['cardTypes', cardType, 'playable'])) {
		logger.error(`Attempted to deal a nonplayable card of type "${cardType}", which is playable`);
		return state;
	}	

	const deck = game.getIn(['decks', cardType]);
	const card = deck.first();

	if (deck.size === 1) {
		state = createDeck(state, gameIndex, cardType);
	} else {
		state = state.setIn(['games', gameIndex, 'decks', cardType], deck.shift());
	}

	return state.setIn(['games', gameIndex, 'current_' + cardType], card);
}