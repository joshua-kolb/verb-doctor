import {expect} from 'chai';
import {List, Map, fromJS} from 'immutable';
import {
	emptyState,
	randomizeTries,
	exampleCards,
	exampleCardsByType,
	exampleCardTypes,
	examplePlayers,
	exampleLonePlayer,
	expectedNounsInHand,
	expectedVerbsInHand,
	exampleNewGame,
	exampleNewGameWithPassword,
	exampleNewGameReadyToStart,
	exampleStartedGame,
	exampleStartedGameWithTwoPlayers
} from '../testConstants'
import Game from '../../../src/server/core/Game';

describe('core game logic', function () {
	
	describe('create', function () {

		it('creates the game state and adds a new game to it', function () {
			const state = Map({
				lobby: List.of(exampleNewGame.get('host'))
			})
			const nextState = Game.create(state, exampleNewGame.get('host'), exampleNewGame.get('name'));
			expect(nextState.get('games')).to.equal(List.of(exampleNewGame));
		});

		it('adds a new game to the existing game state', function () {
			const state = Map({
				games: List.of(exampleNewGameWithPassword),
				lobby: List.of(exampleNewGame.get('host'))
			});
			const nextState = Game.create(state, exampleNewGame.get('host'), exampleNewGame.get('name'));
			expect(nextState.get('games')).to.equal(state.get('games').push(exampleNewGame));
		});

		it('removes the player from the lobby', function () {
			const state = Map({
				lobby: List.of(...examplePlayers, exampleLonePlayer)
			});
			const nextState = Game.create(state, exampleLonePlayer, exampleNewGame.get('name'));
			expect(nextState.get('lobby')).to.equal(examplePlayers);
		});

		it('creates a game with a password if one was provided', function () {
			const state = Map({
				lobby: List.of(exampleNewGameWithPassword.get('host'))
			});
			const nextState = Game.create(
				state, 
				exampleNewGameWithPassword.get('host'), 
				exampleNewGameWithPassword.get('name'), 
				exampleNewGameWithPassword.get('password')
			);
			expect(nextState.get('games')).to.equal(List.of(exampleNewGameWithPassword));
		});

		it('doesn\'t add a game to the state when the name is already taken', function () {
			const state = Map({
				games: List.of(exampleNewGame),
				lobby: List.of(exampleNewGame.get('host'))
			});
			const nextState = Game.create(state, exampleNewGame.get('host'), exampleNewGame.get('name'));
			expect(nextState.get('games')).to.equal(state.get('games'));
		});

		it('doesn\'t remove the player from the lobby state when the game doesn\'t get created', function () {
			const state = Map({
				games: List.of(exampleNewGame),
				lobby: List.of(exampleNewGame.get('host'))
			});
			const nextState = Game.create(state, exampleNewGame.get('host'), exampleNewGame.get('name'));
			expect(nextState.get('lobby')).to.equal(state.get('lobby'));
		});

		it('doesn\'t add a game to the state when the new host isn\'t in the lobby', function () {
			const state = Map({
				lobby: examplePlayers
			});
			const nextState = Game.create(emptyState, exampleLonePlayer, exampleNewGame.get('name'));
			expect(nextState.get('games')).to.be.undefined;
		});

	});

	describe('join', function () {

		it('adds a player to the game and removes them from the lobby when not started', function () {
			const state = Map({
				games: List.of(exampleNewGame),
				lobby: List.of(...examplePlayers, exampleLonePlayer)
			});
			const nextState = Game.join(state, exampleLonePlayer, exampleNewGame.get('name'));
			expect(nextState.hasIn(['games', 0, 'players', exampleLonePlayer])).to.equal(true);
			expect(nextState.get('lobby')).to.equal(examplePlayers);
		});

		it('adds a player to the game when they get the password right', function () {
			const state = Map({
				games: List.of(exampleNewGameWithPassword),
				lobby: List.of(...examplePlayers, exampleLonePlayer)
			});
			const nextState = Game.join(
				state, 
				exampleLonePlayer, 
				exampleNewGameWithPassword.get('name'), 
				exampleNewGameWithPassword.get('password')
			);
			expect(nextState.hasIn(['games', 0, 'players', exampleLonePlayer])).to.equal(true);
			expect(nextState.get('lobby')).to.equal(examplePlayers);
		});

		it('adds a player to a game, gives them a score of 0 and a new cards, and removes them from the lobby when the game has been started already', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				games: List.of(exampleStartedGame),
				lobby: List.of(...examplePlayers, exampleLonePlayer)
			});
			const nextState = Game.join(state, exampleLonePlayer, exampleStartedGame.get('name'));
			expect(nextState.hasIn(['games', 0, 'players', exampleLonePlayer])).to.equal(true);
			expect(nextState.getIn(['games', 0, 'players', exampleLonePlayer, 'score'])).to.equal(0);

			const playerHand = nextState.getIn(['games', 0, 'players', exampleLonePlayer, 'hand']);
			const cardCounts = {};
			playerHand.forEach((card) => cardCounts[card.get('type')] = cardCounts[card.get('type')] ? cardCounts[card.get('type')] + 1 : 1);
			expect(cardCounts.noun).to.equal(expectedNounsInHand);
			expect(cardCounts.verb).to.equal(expectedVerbsInHand);
			expect(cardCounts.situation).to.be.undefined;
			expect(nextState.get('lobby')).to.equal(examplePlayers);
		});

		it('doesn\'t add a player to the game if the game does\'t exist', function () {
			const state = Map({
				games: List.of(exampleNewGame),
				lobby: List.of(...examplePlayers)
			});
			const nextState = Game.join(state, exampleLonePlayer, exampleNewGameWithPassword.get('name'));
			expect(nextState).to.equal(state);
		});

		it('doesn\'t add a player to the game if the game has a password and the user didn\'t get it right', function () {
			const state = Map({
				games: List.of(exampleNewGameWithPassword),
				lobby: List.of(...examplePlayers, exampleLonePlayer)
			});
			const nextState = Game.join(state, exampleLonePlayer, exampleNewGameWithPassword.get('name'));
			expect(nextState).to.equal(state);
		});

		it('doesn\'t add a player to the game if they are already in the game', function () {
			const player = exampleNewGame.get('players').keySeq().first();
			const state = Map({
				games: List.of(exampleNewGame),
				lobby: List.of(...examplePlayers, player)
			});
			const nextState = Game.join(state, player, exampleNewGame.get('name'));
			expect(nextState).to.equal(state);
		});

		it('doesn\'t add a player to the game if they don\'t exist in the lobby state', function () {
			const state = Map({
				games: List.of(exampleNewGame),
				lobby: List.of(...examplePlayers)
			});
			const nextState = Game.join(state, exampleLonePlayer, exampleNewGame.get('name'));
			expect(nextState).to.equal(state);
		});

	});

	describe('start', function () {

		it('sets started to true in the game state', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: List.of(exampleNewGameReadyToStart)
			});
			const nextState = Game.start(
				state, 
				exampleNewGameReadyToStart.get('host'), 
				exampleNewGameReadyToStart.get('name')
			);
			expect(nextState.getIn(['games', 0, 'started'])).to.equal(true);
		});

		it('initializes the game decks', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: List.of(exampleNewGameReadyToStart)
			});
			const nextState = Game.start(
				state, 
				exampleNewGameReadyToStart.get('host'), 
				exampleNewGameReadyToStart.get('name')
			);
			const decks = nextState.getIn(['games', 0, 'decks']);
			const players = nextState.getIn(['games', 0, 'players']);
			expect(decks.every(
				(deck, cardType) => deck.every(
					(card) => exampleCards.includes(card)
				)
			)).to.equal(true);
		});

		it('initializes the game decks as shuffled', function () {
			let randomized = false;
			for(let i = 0; i < randomizeTries; ++i) {
				const state = Map({
					cardTypes: exampleCardTypes,
					cards: exampleCards,
					games: List.of(exampleNewGameReadyToStart)
				});
				const nextState = Game.start(
					state, 
					exampleNewGameReadyToStart.get('host'), 
					exampleNewGameReadyToStart.get('name')
				);
				randomized = nextState.getIn(['games', 0, 'decks']).every(
					(deck, decktype) => deck !== exampleCardsByType.get(decktype)
				);
				if (randomized) {
					break;
				}
			}
			expect(randomized).to.equal(true);
		});

		it('deals cards into each of the players\' hands from the decks', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: List.of(exampleNewGameReadyToStart)
			});
			const nextState = Game.start(
				state, 
				exampleNewGameReadyToStart.get('host'), 
				exampleNewGameReadyToStart.get('name')
			);
			const game = nextState.getIn(['games', 0]);
			const cardsMatchUp =  game.get('players').every(
				(player, playerName) => player.get('hand').every(
					(card) => exampleCardsByType.get(card.get('type')).includes(card)
				)
			);
			expect(cardsMatchUp).to.equal(true);
		});

		it('sets each players\' score to 0', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: List.of(exampleNewGameReadyToStart)
			});
			const nextState = Game.start(
				state, 
				exampleNewGameReadyToStart.get('host'), 
				exampleNewGameReadyToStart.get('name')
			);
			const AllScoresAreZero = nextState.getIn(['games', 0, 'players']).every(
				(player, playerName) => player.get('score') === 0
			);
			expect(AllScoresAreZero).to.equal(true);
		});

		it('sets the current_situation in the game state by dealing it from the situation deck', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: List.of(exampleNewGameReadyToStart)
			});
			const nextState = Game.start(
				state, 
				exampleNewGameReadyToStart.get('host'), 
				exampleNewGameReadyToStart.get('name')
			);
			const game = nextState.getIn(['games', 0]);
			const currentSituation =  game.get('current_situation');
			expect(currentSituation).to.not.be.undefined;
			expect(game.getIn(['decks', 'situation']).includes(currentSituation)).to.equal(false);
		});

		it('sets the decider in the game state', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: List.of(exampleNewGameReadyToStart)
			});
			const nextState = Game.start(
				state, 
				exampleNewGameReadyToStart.get('host'), 
				exampleNewGameReadyToStart.get('name')
			);
			expect(nextState.getIn(['games', 0, 'decider'])).to.not.be.undefined;
		});

		it('doesn\'t start the game if there is only one player', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: List.of(exampleNewGame)
			});
			const nextState = Game.start(state, exampleNewGame.get('host'), exampleNewGame.get('name'));
			expect(nextState).to.equal(state);
		});

		it('only allows the host to start the game', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: List.of(exampleNewGameReadyToStart)
			});
			const nextState = Game.start(
				state, 
				exampleNewGameReadyToStart.get('players').keySeq().get(1), 
				exampleNewGameReadyToStart.get('name')
			);
			expect(nextState).to.equal(state);
		});

		it('doesn\'t alter the state if the game doesn\'t exist', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: List.of(exampleNewGameReadyToStart)
			});
			const nextState = Game.start(
				state, 
				exampleNewGameReadyToStart.get('host'), 
				exampleNewGameReadyToStart.get('name') + 'DIFFERENT'
			);
			expect(nextState).to.equal(state);
		});

		it('doesn\'t alter the state if the game is already started', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: List.of(exampleStartedGame)
			});
			const nextState = Game.start(
				state, 
				exampleStartedGame.get('host'), 
				exampleStartedGame.get('name')
			);
			expect(nextState).to.equal(state);
		});

	});

	describe('leave', function () {

		it('removes the player from the game state', function () {
			const state = Map({
				games: List.of(exampleStartedGame)
			});
			const leavingPlayerName = exampleStartedGame.get('players').keySeq().get(1);
			const nextState = Game.leave(state, leavingPlayerName, exampleStartedGame.get('name'));

			expect(nextState.hasIn(['games', 0])).to.equal(true);
			expect(nextState.hasIn(['games', 0, 'players', leavingPlayerName])).to.equal(false);
		});

		it('adds the player to the lobby', function () {
			const state = Map({
				games: List.of(exampleStartedGame)
			});
			const leavingPlayerName = exampleStartedGame.get('players').keySeq().get(1);
			const nextState = Game.leave(state, leavingPlayerName, exampleStartedGame.get('name'));

			expect(nextState.get('lobby').includes(leavingPlayerName)).to.equal(true);
		});

		it('removes the game from the state if there is only one player remaining and the game is started', function () {
			const state = Map({
				games: List.of(exampleStartedGameWithTwoPlayers)
			});
			const leavingPlayerName = exampleStartedGameWithTwoPlayers.get('players').keySeq().get(1);
			const nextState = Game.leave(
				state, 
				leavingPlayerName, 
				exampleStartedGameWithTwoPlayers.get('name')
			);

			expect(nextState.hasIn(['games', 0])).to.equal(false);
		});

		it('removes the game from the state if there are no players remaining and the game is not started', function () {
			const state = Map({
				games: List.of(exampleNewGame)
			});
			const leavingPlayerName = exampleNewGame.get('host');
			const nextState = Game.leave(
				state, 
				leavingPlayerName, 
				exampleNewGame.get('name')
			);

			expect(nextState.hasIn(['games', 0])).to.equal(false);
		});

		it('changes the host to a different player if the host is leaving', function () {
			const state = Map({
				games: List.of(exampleNewGameReadyToStart)
			});
			const leavingPlayerName = exampleNewGameReadyToStart.get('host');
			const newHostPlayerName = exampleNewGameReadyToStart.get('players').keySeq().get(1);
			const nextState = Game.leave(
				state, 
				leavingPlayerName, 
				exampleNewGameReadyToStart.get('name')
			);

			expect(nextState.getIn(['games', 0, 'host'])).to.equal(newHostPlayerName);
		});

		it('removes the player\'s submittedPlay if it exists', function () {
			const state = Map({
				games: List.of(exampleStartedGame)
			});
			const leavingPlayerName = exampleStartedGame.get('players').keySeq().get(1);
			const nextState = Game.leave(state, leavingPlayerName, exampleStartedGame.get('name'));

			expect(nextState.getIn(['games', 0, 'submittedPlays']).size).to.equal(0);
		});

		it('doesn\'t do anything if the player isn\'t in the game', function () {
			const state = Map({
				games: List.of(exampleStartedGame)
			});
			const leavingPlayerName = exampleStartedGame.get('players').keySeq().get(1) + 'DIFFERENT';
			const nextState = Game.leave(state, leavingPlayerName, exampleStartedGame.get('name'));

			expect(nextState).to.equal(state);
		});

		it('doesn\'t do anything if the game doesn\'t exist', function () {
			const state = Map({
				games: List.of(exampleStartedGame)
			});
			const leavingPlayerName = exampleStartedGame.get('players').keySeq().get(1);
			const nextState = Game.leave(
				state, 
				leavingPlayerName, 
				exampleStartedGame.get('name') + 'DIFFERENT'
			);

			expect(nextState).to.equal(state);
		});

	});

	describe('submitPlay', function () {

		it('adds to the submittedPlays list of the game state', function () {
			
		});

		it('deals new cards to the player\'s hand to replace the cards submitted', function () {

		});

		it('reinitializes card decks if there are no more cards in the decks', function () {

		});

		it('doesn\'t allow the decider to submit a play', function () {

		});

		it('doesn\'t allow a simple play that doesn\'t fill all card slots', function () {

		});

		it('doesn\'t allow a play with chainer cards that doesn\'t fill all card slots', function () {

		});

		it('doesn\'t allow a play that includes cards that aren\'t in the player\'s hand', function () {

		});

	});

	describe('decideWinner', function () {

		it('adds winner of last round to the game state', function () {

		});

		it('adds to the score of the player who won', function () {

		});

		it('doesn\'t allow a player who is not the decider to decide', function () {

		});

		it('doesn\'t allow the winner to be decided when they have not submitted a play', function () {

		});

	});

	describe('nextRound', function () {

		it('sets the currentSituation to a new situation card dealt from the situation deck', function () {

		});

		it('reinitializes the situation deck if there are no more cards left', function () {

		});

		it('sets the decider to the next player', function () {

		});

		it('removes the submittedPlays from the game state', function () {

		});

	});

});