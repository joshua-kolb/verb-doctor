import {Map, List, fromJS} from 'immutable';
import {expect} from 'chai';
import {
	emptyFunction,
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

	describe('SET_CARD_TYPES', function () {

		it('handles it', function () {
			const action = {
				type: 'SET_CARD_TYPES',
				meta: {
					remote: false,
					player: undefined,
					game: undefined
				},
				cardTypes: exampleCardTypes
			};
			const nextState = reducer(emptyFunction, emptyFunction)(emptyState, action);

			expect(nextState).to.equal(fromJS({
				cardTypes: exampleCardTypes
			}));
		});

		it('doesn\'t do anything if the action is remote', function () {
			const action = {
				type: 'SET_CARD_TYPES',
				meta: {
					remote: true,
					player: undefined,
					game: undefined
				},
				cardTypes: exampleCardTypes
			};
			const nextState = reducer(emptyFunction, emptyFunction)(emptyState, action);

			expect(nextState).to.equal(emptyState);
		});

	});

	

	describe('SET_CARDS', function () {

		it('handles it', function () {
			const action = {
				type: 'SET_CARDS',
				meta: {
					remote: false,
					player: undefined,
					game: undefined
				},
				cards: exampleCards
			};
			const nextState = reducer(emptyFunction, emptyFunction)(emptyState, action);

			expect(nextState).to.equal(fromJS({
				cards: exampleCards
			}));
		});

		it('doesn\'t do anything if the action is remote', function () {
			const action = {
				type: 'SET_CARDS',
				meta: {
					remote: true,
					player: undefined,
					game: undefined
				},
				cards: exampleCards
			};
			const nextState = reducer(emptyFunction, emptyFunction)(emptyState, action);

			expect(nextState).to.equal(emptyState);
		});

	});

	describe('LOGIN', function () {
		
		it('handles it', function () {
			const action = {
				type: 'LOGIN',
				meta: {
					remote: true,
					player: undefined,
					game: undefined
				},
				player: exampleLonePlayer
			};
			const nextState = reducer(emptyFunction, emptyFunction)(emptyState, action);

			expect(nextState).to.equal(fromJS({
				lobby: [exampleLonePlayer]
			}));
		});

	});

	describe('LOGOUT', function () {

		it('handles it', function () {
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
			const nextState = reducer(emptyFunction, emptyFunction)(initialState, action);

			expect(nextState).to.equal(emptyState);
		});

	});

	

	describe('CREATE_GAME', function () {

		it('handles it', function () {
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
			const nextState = reducer(emptyFunction, emptyFunction)(initialState, action);

			expect(nextState.get('games')).to.equal(Map({
				[exampleNewGame.get('name')]: exampleNewGame
			}));
		});

	});

	describe('JOIN_GAME', function () {

		it('handles it', function () {
			const initialState = Map({
				games: Map({
					[exampleNewGame.get('name')]: exampleNewGame
				}),
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
			const nextState = reducer(emptyFunction, emptyFunction)(initialState, action);

			
			expect(nextState.hasIn(['games', exampleNewGame.get('name'), 'players', exampleLonePlayer])).to.equal(true);
			expect(nextState.get('lobby')).to.equal(examplePlayers);
		});
		
	});

	describe('START_GAME', function () {

		it('handles it', function () {
			const initialState = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleNewGameReadyToStart.get('name')]: exampleNewGameReadyToStart
				})
			});
			const action = {
				type: 'START_GAME',
				meta: {
					remote: true,
					player: exampleNewGameReadyToStart.get('host'),
					game: exampleNewGameReadyToStart.get('name')
				}
			};
			const nextState = reducer(emptyFunction, emptyFunction)(initialState, action);

			expect(nextState.getIn(['games', exampleNewGameReadyToStart.get('name'), 'started'])).to.equal(true);
		});

	});

	describe('LEAVE_GAME', function () {

		it('handles it', function () {
			const initialState = Map({
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
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
			const nextState = reducer(emptyFunction, emptyFunction)(initialState, action);

			expect(nextState.hasIn(['games', exampleStartedGame.get('name')])).to.equal(true);
			expect(nextState.hasIn(['games', exampleStartedGame.get('name'), 'players', leavingPlayerName])).to.equal(false);
		});
		
	});

	describe('SUBMIT_PLAY', function () {
		
		it('handles it', function () {
			const initialState = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
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
			const nextState = reducer(emptyFunction, emptyFunction)(initialState, action);

			expect(nextState.hasIn(['games', exampleStartedGame.get('name'), 'submittedPlays', 1])).to.equal(true);
			const submittedPlay = nextState.getIn(['games', exampleStartedGame.get('name'), 'submittedPlays', 1]);
			expect(submittedPlay).to.equal(Map({
				player: playerName,
				cardsSubmitted: play
			}));
		});

	});

	

	describe('DECIDE_WINNER', function () {

		it('handles it', function () {
			const initialState = Map({
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
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
			const nextState = reducer(emptyFunction, emptyFunction)(initialState, action);

			expect(nextState.getIn(['games', exampleStartedGame.get('name'), 'winnerOfLastRound'])).to.equal(winnerName);
		});

	});

	describe('NEXT_ROUND', function () {

		it('handles it', function () {
			const initialState = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
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
			const nextState = reducer(emptyFunction, emptyFunction)(initialState, action);

			expect(nextState.hasIn(['games', exampleStartedGame.get('name'), 'current_situation'])).to.equal(true);
			expect(nextState.getIn(['games', exampleStartedGame.get('name'), 'current_situation'])).to.not.equal(originalSituation);
		});

	});

});