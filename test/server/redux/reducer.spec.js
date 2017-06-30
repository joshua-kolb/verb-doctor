import {Map, List, fromJS} from 'immutable';
import {expect} from 'chai';
import {
	emptyState,
	exampleCardTypes,
	exampleCards,
	exampleLonePlayer,
	examplePlayers,
	exampleNewGame,
	exampleNewGameReadyToStart,
	exampleStartedGame
} from '../testConstants'

import reducer from '../../../src/server/redux/Reducer';

describe('reducer', function () {

	it('handles SET_CARD_TYPES', function () {
		const action = {
			type: 'SET_CARD_TYPES',
			meta: {
				remote: false,
				player: undefined,
				game: undefined
			},
			cardTypes: exampleCardTypes
		};
		const nextState = reducer(emptyState, action);

		expect(nextState).to.equal(fromJS({
			cardTypes: exampleCardTypes
		}));
	});

	it('handles SET_CARDS', function () {
		const action = {
			type: 'SET_CARDS',
			meta: {
				remote: false,
				player: undefined,
				game: undefined
			},
			cards: exampleCards
		};
		const nextState = reducer(emptyState, action);

		expect(nextState).to.equal(fromJS({
			cards: exampleCards
		}));
	});

	it('handles LOGIN', function () {
		const action = {
			type: 'LOGIN',
			meta: {
				remote: true,
				player: undefined,
				game: undefined
			},
			player: exampleLonePlayer
		};
		const nextState = reducer(emptyState, action);

		expect(nextState).to.equal(fromJS({
			lobby: [exampleLonePlayer]
		}));
	});

	it('handles LOGOUT', function () {
		const initialState = fromJS({
			lobby: [exampleLonePlayer]
		});
		const action = {
			type: 'LOGOUT',
			meta: {
				remote: true,
				player: exampleLonePlayer,
				game: undefined
			}
		};
		const nextState = reducer(initialState, action);

		expect(nextState).to.equal(emptyState);
	});

	it('handles CREATE_GAME', function () {
		const initialState = Map({
			lobby: List.of(exampleNewGame.get('host'))
		});
		const action = {
			type: 'CREATE_GAME',
			meta: {
				remote: true,
				player: exampleNewGame.get('host'),
				game: undefined
			},
			gameName: exampleNewGame.get('name')
		};
		const nextState = reducer(initialState, action);

		expect(nextState.get('games')).to.equal(List.of(exampleNewGame));
	});

	it('handles JOIN_GAME', function () {
		const initialState = Map({
			games: List.of(exampleNewGame),
			lobby: List.of(...examplePlayers, exampleLonePlayer)
		});
		const action = {
			type: 'JOIN_GAME',
			meta: {
				remote: true,
				player: exampleLonePlayer,
				game: undefined
			},
			gameName: exampleNewGame.get('name')
		};
		const nextState = reducer(initialState, action);

		
		expect(nextState.hasIn(['games', 0, 'players', exampleLonePlayer])).to.equal(true);
		expect(nextState.get('lobby')).to.equal(examplePlayers);
	});

	it('handles START_GAME', function () {
		const initialState = Map({
			cardTypes: exampleCardTypes,
			cards: exampleCards,
			games: List.of(exampleNewGameReadyToStart)
		});
		const action = {
			type: 'START_GAME',
			meta: {
				remote: true,
				player: exampleNewGameReadyToStart.get('host'),
				game: exampleNewGameReadyToStart.get('name')
			}
		};
		const nextState = reducer(initialState, action);

		expect(nextState.getIn(['games', 0, 'started'])).to.equal(true);
	});

	it('handles LEAVE_GAME', function () {
		const initialState = Map({
			games: List.of(exampleStartedGame)
		});
		const leavingPlayerName = exampleStartedGame.get('players').keySeq().get(1);
		const action = {
			type: 'LEAVE_GAME',
			meta: {
				remote: true,
				player: leavingPlayerName,
				game: exampleStartedGame.get('name')
			}
		};
		const nextState = reducer(initialState, action);

		expect(nextState.hasIn(['games', 0])).to.equal(true);
		expect(nextState.hasIn(['games', 0, 'players', leavingPlayerName])).to.equal(false);
	});

	it('handles SUBMIT_PLAY', function () {
		const initialState = Map({
			cardTypes: exampleCardTypes,
			cards: exampleCards,
			games: List.of(exampleStartedGame)
		});
		const playerName = exampleStartedGame.get('players').keySeq().get(2);
		const play = List.of(exampleStartedGame.getIn(['players', playerName, 'hand', 0]));
		const action = {
			type: 'SUBMIT_PLAY',
			meta: {
				remote: true,
				player: playerName,
				game: exampleStartedGame.get('name')
			},
			cards: play
		};
		const nextState = reducer(initialState, action);

		expect(nextState.hasIn(['games', 0, 'submittedPlays', 1])).to.equal(true);
		const submittedPlay = nextState.getIn(['games', 0, 'submittedPlays', 1]);
		expect(submittedPlay).to.equal(Map({
			player: playerName,
			cardsSubmitted: play
		}));
	});

	it('handles DECIDE_WINNER', function () {
		const initialState = Map({
			games: List.of(exampleStartedGame)
		});
		const winnerName = exampleStartedGame.getIn(['submittedPlays', 0, 'player']);
		const action = {
			type: 'DECIDE_WINNER',
			meta: {
				remote: true,
				player: exampleStartedGame.get('decider'),
				game: exampleStartedGame.get('name')
			},
			winner: winnerName
		};
		const nextState = reducer(initialState, action);

		expect(nextState.getIn(['games', 0, 'winnerOfLastRound'])).to.equal(winnerName);
	});

	it('handles NEXT_ROUND', function () {
		const initialState = Map({
			cardTypes: exampleCardTypes,
			cards: exampleCards,
			games: List.of(exampleStartedGame)
		})
		const action = {
			type: 'NEXT_ROUND',
			meta: {
				remote: true,
				player: exampleStartedGame.get('host'),
				game: exampleStartedGame.get('name')
			}
		};
		const originalSituation = exampleStartedGame.get('current_situation');
		const nextState = reducer(initialState, action);

		expect(nextState.hasIn(['games', 0, 'current_situation'])).to.equal(true);
		expect(nextState.getIn(['games', 0, 'current_situation'])).to.not.equal(originalSituation);
	});

});