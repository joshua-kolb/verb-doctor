import {List, Map, fromJS} from 'immutable';
import Lobby from './Lobby';
import logger from 'winston';

const NUMBER_OF_CARDS_TO_DEAL_PER_TYPE = 4;

export default class Game {

	static create(state, hostPlayerName, gameName, password) {

		if (!state.get('lobby') || !state.get('lobby').includes(hostPlayerName)) {
			throw new Error(`Player "${hostPlayerName}" tried to create the game "${gameName}", but was not found in the lobby.`);
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
			            .set('games', Map({
			            	[gameName]: newGame
			            }));
		}

		if(state.get('games').some((game) => game.get('name') === newGame.get('name'))) {
			throw new Error(`Player "${hostPlayerName}" tried to create the game "${gameName}", but the game name was already taken.`);
		}

		logger.info(`Player "${hostPlayerName}" successfully created the game "${gameName}" (the new game was added to the list of existing games).`);
		return Lobby.logout(state, hostPlayerName)
		            .setIn(['games', gameName], newGame);
	}

	static join(state, playerName, gameName, password) {

		const game = state.getIn(['games', gameName]);

		if (!game) {
			throw new Error(`Player "${playerName}" attempted to join game "${gameName}", but no such game was found.`);
		}

		if (game.get('password') !== password) {
			throw new Error(`Player "${playerName}" attempted to join game "${gameName}", but the password entered was incorrect.`);
		}

		if (game.hasIn(['players', playerName])) {
			throw new Error(`Player "${playerName}" attempted to join game "${gameName}", but is already apart of the game.`);
		}

		if (!state.get('lobby').includes(playerName)) {
			throw new Error(`Player "${playerName}" attempted to join game "${gameName}", but the player doesn't exist in the lobby.`);
		}

		state = Lobby.logout(state, playerName);

		if (!game.get('started')) {
			logger.info(`Player "${playerName}" successfully join the game "${gameName}" (which has not yet been started).`);
			return state.setIn(['games', gameName, 'players', playerName], Map());
		}

		state = state.setIn(['games', gameName, 'players', playerName], Map({ score: 0 }));
		game.get('decks').forEach((deck, cardType) => {
			if (state.getIn(['cardTypes', cardType, 'playable'])) {
				state = dealPlayableCards(state, gameName, playerName, cardType, NUMBER_OF_CARDS_TO_DEAL_PER_TYPE);
			}
		});

		return state;
	}

	static start(state, playerName, gameName) {

		if (!state.getIn(['games', gameName])) {
			throw new Error(`Player "${playerName}" attempted to start game "${gameName}", but the game didn't exist.`);
		}

		if (state.getIn(['games', gameName, 'started'])) {
			throw new Error(`Player "${playerName}" attempted to start game "${gameName}", but the game is already started.`);
		}

		if (state.getIn(['games', gameName, 'host']) !== playerName) {
			throw new Error(`Player "${playerName}" attempted to start game "${gameName}", but they are not the host.`);
		}

		const players = state.getIn(['games', gameName, 'players']);
		if (players.keySeq().size < 2) {
			throw new Error(`Player "${playerName}" attempted to start game "${gameName}", but the game didn't have enough players.`);
		}

		state.get('cardTypes').forEach(function(cardType, cardTypeName) {
			state = createDeck(state, gameName, cardTypeName);
		});

		state = state.setIn(['games', gameName, 'decider'], players.keySeq().get(0));

		players.forEach(function(player, playerName) {
			state = state.setIn(['games', gameName, 'players', playerName, 'score'], 0);
			state.get('cardTypes').forEach(function(cardType, cardTypeName) {
				if (cardType.get('playable')) {
					state = dealPlayableCards(state, gameName, playerName, cardTypeName, NUMBER_OF_CARDS_TO_DEAL_PER_TYPE);
				}
			});
		});

		state.get('cardTypes').forEach(function(cardType, cardTypeName) {
			if (!cardType.get('playable')) {
				state = dealNonPlayableCard(state, gameName, cardTypeName);
			}
		});

		logger.info(`Player '${playerName}' successfully started game '${gameName}'`);
		return state.setIn(['games', gameName, 'started'], true);
	}

	static leave(state, playerName, gameName) {

		if (!state.hasIn(['games', gameName])) {
			throw new Error(`Player "${playerName}" attempted to leave game "${gameName}", but the game didn't exist.`);
		}

		if (!state.hasIn(['games', gameName, 'players', playerName])) {
			throw new Error(`Player "${playerName}" attempted to leave game "${gameName}", but was not in the game to begin with.`);
		}

		logger.info(`Player "${playerName}" has successfully left game "${gameName}"`);
		state = state.deleteIn(['games', gameName, 'players', playerName]);		             
		state = Lobby.login(state, playerName);

		if (state.hasIn(['games', gameName, 'submittedPlays'])) {
			const submittedPlayIndex = state.getIn(['games', gameName, 'submittedPlays'])
			                                .findIndex((submittedPlay) => submittedPlay.get('player') === playerName);
		
			if (submittedPlayIndex !== -1) {
				logger.info(`Because player "${playerName}" left game "${gameName}", their submittedPlay was removed.`);
				state = state.deleteIn(['games', gameName, 'submittedPlays', submittedPlayIndex]);
			}
		}

		const players = state.getIn(['games', gameName, 'players']).keySeq();
		if (players.size < 1 || (players.size < 2 && state.getIn(['games', gameName, 'started']))) {
			logger.info(`Because player "${playerName}" left game "${gameName}", there were no longer enough players to keep the game going. The game was removed.`);
			players.forEach(function (player) {
				state = state.deleteIn(['games', gameName, 'players', player]);
				state = Lobby.login(state, player);
			});
			state = state.deleteIn(['games', gameName]);
		} else if (state.getIn(['games', gameName, 'host']) === playerName) {
			const newHost = players.get(0);
			logger.info(`Because player "${playerName}" left game "${gameName}" and was the host, player "${newHost}" was promoted to be host.`)
			state = state.setIn(['games', gameName, 'host'], newHost);
		}

		return state;
	}

	static submitPlay(state, playerName, gameName, cards) {

		if (!state.hasIn(['games', gameName])) {
			throw new Error(`Player "${playerName}" attempted to submit a play in game "${gameName}", but the game didn't exist.`);
		}

		if (!state.hasIn(['games', gameName, 'players', playerName])) {
			throw new Error(`Player "${playerName}" attempted to submit a play in game "${gameName}", but was not in the game.`);
		}

		if (state.getIn(['games', gameName, 'decider']) === playerName) {
			throw new Error(`Player "${playerName}" attempted to submit a play in game "${gameName}", but was the decider.`);
		}

		const playerAlreadySubmitted = state.getIn(['games', gameName, 'submittedPlays'])
			.some((play) => play.get('player') === playerName);

		if (playerAlreadySubmitted) {
			throw new Error(`Player "${playerName}" attempted to submit a play in game "${gameName}", but they had already submitted one before.`);
		}

		const hand = state.getIn(['games', gameName, 'players', playerName, 'hand']);
		const cardNotInPlayersHand = cards.some((playCard) => hand.every((handCard) => playCard !== handCard));
		if (cardNotInPlayersHand) {
			throw new Error(`Player "${playerName}" attempted to submit a play in game "${gameName}", but they tried to use cards that weren't in their hand.`)
		}

		let slotTypeMismatch = false;
		let tooManyCards = false;
		let slots = state.getIn(['games', gameName, 'current_situation', 'slots']);
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
			throw new Error(`Player "${playerName}" attempted to submit a play in game "${gameName}", but there was a slot type mismatch.`);
		}

		if (tooManyCards) {
			throw new Error(`Player "${playerName}" attempted to submit a play in game "${gameName}", but not all slots were filled.`);
		}

		if (slots.size !== 0) {
			throw new Error(`Player "${playerName}" attempted to submit a play in game "${gameName}", but there were too many cards submitted.`);
		}

		let typeCount = Map();
		cards.forEach(function(card, cardIndex) { 
			state = state.deleteIn(['games', gameName, 'players', playerName, 'hand', cardIndex]);
			typeCount = typeCount.update(card.get('type'), (count) => count ? count++ : 1);
		});

		typeCount.forEach((count, cardType) => 
			state = dealPlayableCards(state, gameName, playerName, cardType, count)
		);

		const play = Map({
			player: playerName,
			cardsSubmitted: cards
		});

		return state.updateIn(
			['games', gameName, 'submittedPlays'], 
			(submittedPlays) => submittedPlays ? submittedPlays.push(play) : List.of(play)
		);
	}

	static decideWinner(state, playerName, gameName, winnerName) {

		if (!state.getIn(['games', gameName])) {
			throw new Error(`Player "${playerName}" attempted to decide the winner in game "${gameName}", but the game didn't exist.`);
		}

		if (playerName !== state.getIn(['games', gameName, 'decider'])) {
			throw new Error(`Player "${playerName}" attempted to decide the winner in game "${gameName}", but the player wasn't the decider.`);
		}

		const submittedPlayIndex = state.getIn(['games', gameName, 'submittedPlays'])
		                                .findIndex((play) => play.get('player') === winnerName);
		
		if (submittedPlayIndex === -1) {
			throw new Error(`Player "${playerName}" attempted to decide the winner in game "${gameName}" to be player "${winnerName}", but player "${winnerName}" never submitted a play.`);
		}

		const previousScore = state.getIn(['games', gameName, 'players', winnerName, 'score']);
		return state.setIn(['games', gameName, 'winnerOfLastRound'], winnerName)
		            .setIn(['games', gameName, 'players', winnerName, 'score'], previousScore + 1);
	}

	static nextRound(state, playerName, gameName) {

		if (!state.getIn(['games', gameName])) {
			throw new Error(`Player "${playerName}" attempted to go to the next round in game "${gameName}", but the game didn't exist.`);
		}

		if (playerName !== state.getIn(['games', gameName, 'host'])) {
			throw new Error(`Player "${playerName}" attempted to go to the next round in game "${gameName}", but the player isn't the host of the game.`);
		}

		const players = state.getIn(['games', gameName, 'players']).keySeq();
		const currentDecider = state.getIn(['games', gameName, 'decider']);
		const currentDeciderIndex = players.indexOf(currentDecider);
		const newDecider = players.get((currentDeciderIndex + 1) % players.size);
		state = state.setIn(['games', gameName, 'decider'], newDecider);

		state.get('cardTypes').forEach(function(cardType, cardTypeName) {
			if (!cardType.get('playable')) {
				state = dealNonPlayableCard(state, gameName, cardTypeName);
			}
		});

		return state.deleteIn(['games', gameName, 'submittedPlays']);
	}

}

function dealPlayableCards(state, gameName, playerName, cardType, amount) {

	const game = state.getIn(['games', gameName]);
	if (!game) {
		logger.error(`Attempted to deal cards for game "${gameName}", but no such game exists.`);
		return state;
	}

	if (!game.hasIn(['players', playerName])) {
		logger.error(`Attempted to deal cards to player "${playerName}" in game "${gameName}", but the player doesn't exist in the game.`);
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
		state = createDeck(state, gameName, cardType);
		deck = state.getIn(['games', gameName, 'decks', cardType]);
	}

	hand = hand.concat(deck.slice(0, amount));
	deck = deck.splice(0, amount);

	logger.info(`Successfully dealt ${amount} card(s) of type "${cardType}" to player "${playerName} in game "${gameName}".`);
	return state.setIn(['games', gameName, 'players', playerName, 'hand'], hand)
	            .setIn(['games', gameName, 'decks', cardType], deck);
}

function createDeck(state, gameName, cardType) {

	const game = state.getIn(['games', gameName]);
	if (!game) {
		logger.error(`Attempted to create deck with cardType "${cardType}" for game "${gameName}", but the game doesn't exist.`);
		return state;
	}

	const newDeck = shuffle(state.get('cards').filter((card) => card.get('type') === cardType));
	if (!newDeck.size) {
		logger.error(`Attempted to create deck with cardType "${cardType}" for game "${gameName}", but no cards were put into the deck.`);
		return state;
	}

	logger.info(`Successfully created deck with cardType "${cardType}" for game "${gameName}".`);
	return state.setIn(['games', gameName, 'decks', cardType], newDeck);
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

function dealNonPlayableCard(state, gameName, cardType) {

	const game = state.getIn(['games', gameName]);
	if (!game) {
		logger.error(`Attempted to deal a nonplayable card for game "${gameName}", but no such game exists.`);
		return state;
	}

	if (state.getIn(['cardTypes', cardType, 'playable'])) {
		logger.error(`Attempted to deal a nonplayable card of type "${cardType}", which is playable`);
		return state;
	}	

	let deck = game.getIn(['decks', cardType]);
	if (!deck || deck.size === 0) {
		state = createDeck(state, gameName, cardType);
		deck = state.getIn(['games', gameName, 'decks', cardType]);
	}

	const card = deck.first();
	state = state.setIn(['games', gameName, 'decks', cardType], deck.shift());

	return state.setIn(['games', gameName, 'current_' + cardType], card);
}