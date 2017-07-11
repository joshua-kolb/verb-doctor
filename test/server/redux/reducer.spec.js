import {Map, List, fromJS} from 'immutable';
import {expect} from 'chai';
import {spy} from 'sinon';
import {
	emptyFunction,
	emptyState,
	exampleCardTypes,
	exampleCards,
	exampleLonePlayer,
	examplePlayers,
	exampleNewGame,
	exampleNewGameReadyToStart,
	exampleStartedGame,
	exampleSockId
} from '../testConstants';

import Actions from '../../../src/server/redux/actionCreators';
import reducer from '../../../src/server/redux/reducer';

const PLAYER_PROP_NAME = 'player';
const GAME_PROP_NAME = 'game';

describe('server reducer', function () {

	describe('SET_CARD_TYPES', function () {

		it('handles it', function () {
			const action = {
				type: 'SET_CARD_TYPES',
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
					sockId: exampleSockId,
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
					sockId: exampleSockId,
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
					sockId: exampleSockId,
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

		it('sets socket.player to the name given upon successful login.', function () {
			const setSocketPropSpy = spy();
			const action = {
				type: 'LOGIN',
				meta: {
					sockId: exampleSockId,
					remote: true,
					player: undefined,
					game: undefined
				},
				player: exampleLonePlayer
			};
			reducer(emptyFunction, setSocketPropSpy)(emptyState, action);

			expect(setSocketPropSpy.calledOnce).to.equal(true);
			expect(setSocketPropSpy.calledWithExactly(exampleSockId, PLAYER_PROP_NAME, exampleLonePlayer)).to.equal(true);
		});

		it('emits a SET_LOBBY_GAMES action to the player', function () {
			const emitSpy = spy();
			const action = {
				type: 'LOGIN',
				meta: {
					sockId: exampleSockId,
					remote: true,
					player: undefined,
					game: undefined
				},
				player: exampleLonePlayer
			};
			const nextState = reducer(emitSpy, emptyFunction)(emptyState, action);

			const setLobbyGamesAction = Actions.setLobbyGames(nextState.get('games'));
			expect(emitSpy.calledOnce).to.equal(true);
			expect(emitSpy.calledWithExactly(setLobbyGamesAction, PLAYER_PROP_NAME, exampleLonePlayer)).to.equal(true);
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
					sockId: exampleSockId,
					remote: true,
					player: exampleLonePlayer,
					game: undefined
				}
			};
			const nextState = reducer(emptyFunction, emptyFunction)(initialState, action);

			expect(nextState).to.equal(emptyState);
		});

		it('sets socket.player to undefined', function () {
			const setSocketPropSpy = spy();
			const initialState = fromJS({
				lobby: [exampleLonePlayer]
			});
			const action = {
				type: 'LOGOUT',
				meta: {
					sockId: exampleSockId,
					remote: true,
					player: exampleLonePlayer,
					game: undefined
				}
			};
			reducer(emptyFunction, setSocketPropSpy)(initialState, action);

			expect(setSocketPropSpy.calledOnce).to.equal(true);
			expect(setSocketPropSpy.calledWithExactly(action.meta.sockId, PLAYER_PROP_NAME, undefined)).to.equal(true);
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
					sockId: exampleSockId,
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

		it('sets socket.game to the game name', function () {
			const setSocketPropSpy = spy();
			const initialState = Map({
				lobby: List.of(exampleNewGame.get('host'))
			});
			const action = {
				type: 'CREATE_GAME',
				meta: {
					sockId: exampleSockId,
					remote: true,
					player: exampleNewGame.get('host'),
					game: undefined
				},
				gameName: exampleNewGame.get('name')
			};
			reducer(emptyFunction, setSocketPropSpy)(initialState, action);

			expect(setSocketPropSpy.calledOnce).to.equal(true);
			expect(setSocketPropSpy.calledWithExactly(exampleSockId, GAME_PROP_NAME, action.gameName)).to.equal(true);
		});

		it('emits a SET_LOBBY_GAMES action to all players, and a SET_CURRENT_GAME action to the player', function () {
			const emitSpy = spy();
			const initialState = Map({
				lobby: List.of(exampleNewGame.get('host'))
			});
			const action = {
				type: 'CREATE_GAME',
				meta: {
					sockId: exampleSockId,
					remote: true,
					player: exampleNewGame.get('host'),
					game: undefined
				},
				gameName: exampleNewGame.get('name')
			};
			const nextState = reducer(emitSpy, emptyFunction)(initialState, action);

			const setLobbyGamesAction = Actions.setLobbyGames(nextState.get('games'));
			const setCurrentGameAction = Actions.setCurrentGame(nextState.getIn(['games', action.gameName]));
			expect(emitSpy.calledTwice).to.equal(true);
			expect(emitSpy.calledWithExactly(setLobbyGamesAction)).to.equal(true);
			expect(emitSpy.calledWithExactly(setCurrentGameAction, PLAYER_PROP_NAME, action.meta.player)).to.equal(true);
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
					sockId: exampleSockId,
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

		it('sets socket.game to the game name', function () {
			const setSocketPropSpy = spy();
			const initialState = Map({
				games: Map({
					[exampleNewGame.get('name')]: exampleNewGame
				}),
				lobby: List.of(...examplePlayers, exampleLonePlayer)
			});
			const action = {
				type: 'JOIN_GAME',
				meta: {
					sockId: exampleSockId,
					remote: true,
					player: exampleLonePlayer,
					game: undefined
				},
				gameName: exampleNewGame.get('name')
			};
			reducer(emptyFunction, setSocketPropSpy)(initialState, action);

			expect(setSocketPropSpy.calledOnce).to.equal(true);
			expect(setSocketPropSpy.calledWithExactly(exampleSockId, GAME_PROP_NAME, action.gameName)).to.equal(true);
		});

		it('emits a SET_LOBBY_GAMES action to all players, and a SET_CURRENT_GAME action to the game', function () {
			const emitSpy = spy();
			const initialState = Map({
				games: Map({
					[exampleNewGame.get('name')]: exampleNewGame
				}),
				lobby: List.of(...examplePlayers, exampleLonePlayer)
			});
			const action = {
				type: 'JOIN_GAME',
				meta: {
					sockId: exampleSockId,
					remote: true,
					player: exampleLonePlayer,
					game: undefined
				},
				gameName: exampleNewGame.get('name')
			};
			const nextState = reducer(emitSpy, emptyFunction)(initialState, action);

			const setLobbyGamesAction = Actions.setLobbyGames(nextState.get('games'));
			const setCurrentGameAction = Actions.setCurrentGame(nextState.getIn(['games', action.gameName]));
			expect(emitSpy.calledTwice).to.equal(true);
			expect(emitSpy.calledWithExactly(setLobbyGamesAction)).to.equal(true);
			expect(emitSpy.calledWithExactly(setCurrentGameAction, GAME_PROP_NAME, action.gameName)).to.equal(true);
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
					sockId: exampleSockId,
					remote: true,
					player: exampleNewGameReadyToStart.get('host'),
					game: exampleNewGameReadyToStart.get('name')
				}
			};
			const nextState = reducer(emptyFunction, emptyFunction)(initialState, action);

			expect(nextState.getIn(['games', exampleNewGameReadyToStart.get('name'), 'started'])).to.equal(true);
		});

		it('emits a SET_LOBBY_GAMES action to all players, and a SET_CURRENT_GAME action to the game', function () {
			const emitSpy = spy();
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
					sockId: exampleSockId,
					remote: true,
					player: exampleNewGameReadyToStart.get('host'),
					game: exampleNewGameReadyToStart.get('name')
				}
			};
			const nextState = reducer(emitSpy, emptyFunction)(initialState, action);

			const setLobbyGamesAction = Actions.setLobbyGames(nextState.get('games'));
			const setCurrentGameAction = Actions.setCurrentGame(nextState.getIn(['games', action.meta.game]));
			expect(emitSpy.calledTwice).to.equal(true);
			expect(emitSpy.calledWithExactly(setLobbyGamesAction)).to.equal(true);
			expect(emitSpy.calledWithExactly(setCurrentGameAction, GAME_PROP_NAME, action.meta.game)).to.equal(true);
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
					sockId: exampleSockId,
					remote: true,
					player: leavingPlayerName,
					game: exampleStartedGame.get('name')
				}
			};
			const nextState = reducer(emptyFunction, emptyFunction)(initialState, action);

			expect(nextState.hasIn(['games', exampleStartedGame.get('name')])).to.equal(true);
			expect(nextState.hasIn(['games', exampleStartedGame.get('name'), 'players', leavingPlayerName])).to.equal(false);
		});

		it('sets socket.game to undefined', function () {
			const setSocketPropSpy = spy();
			const initialState = Map({
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			});
			const leavingPlayerName = exampleStartedGame.get('players').keySeq().get(1);
			const action = {
				type: 'LEAVE_GAME',
				meta: {
					sockId: exampleSockId,
					remote: true,
					player: leavingPlayerName,
					game: exampleStartedGame.get('name')
				}
			};
			reducer(emptyFunction, setSocketPropSpy)(initialState, action);

			expect(setSocketPropSpy.calledOnce).to.equal(true);
			expect(setSocketPropSpy.calledWithExactly(exampleSockId, GAME_PROP_NAME, undefined)).to.equal(true);
		});

		it('emits a SET_LOBBY_GAMES action to all players, and a SET_CURRENT_GAME action to the game', function () {
			const emitSpy = spy();
			const initialState = Map({
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			});
			const leavingPlayerName = exampleStartedGame.get('players').keySeq().get(1);
			const action = {
				type: 'LEAVE_GAME',
				meta: {
					sockId: exampleSockId,
					remote: true,
					player: leavingPlayerName,
					game: exampleStartedGame.get('name')
				}
			};
			const nextState = reducer(emitSpy, emptyFunction)(initialState, action);

			const setLobbyGamesAction = Actions.setLobbyGames(nextState.get('games'));
			const setCurrentGameAction = Actions.setCurrentGame(nextState.getIn(['games', action.meta.game]));
			expect(emitSpy.calledTwice).to.equal(true);
			expect(emitSpy.calledWithExactly(setLobbyGamesAction)).to.equal(true);
			expect(emitSpy.calledWithExactly(setCurrentGameAction, GAME_PROP_NAME, action.meta.game)).to.equal(true);
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
					sockId: exampleSockId,
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

		it('emits a SET_CURRENT_GAME action to the game', function () {
			const emitSpy = spy();
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
					sockId: exampleSockId,
					remote: true,
					player: playerName,
					game: exampleStartedGame.get('name')
				},
				cards: play
			};
			const nextState = reducer(emitSpy, emptyFunction)(initialState, action);

			const setCurrentGameAction = Actions.setCurrentGame(nextState.getIn(['games', action.gameName]));
			expect(emitSpy.calledOnce).to.equal(true);
			expect(emitSpy.calledWithExactly(setCurrentGameAction, GAME_PROP_NAME, action.meta.game)).to.equal(true);
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
					sockId: exampleSockId,
					remote: true,
					player: exampleStartedGame.get('decider'),
					game: exampleStartedGame.get('name')
				},
				winner: winnerName
			};
			const nextState = reducer(emptyFunction, emptyFunction)(initialState, action);

			expect(nextState.getIn(['games', exampleStartedGame.get('name'), 'winnerOfLastRound'])).to.equal(winnerName);
		});

		it('emits a SET_CURRENT_GAME action to the game', function () {
			const emitSpy = spy();
			const initialState = Map({
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			});
			const winnerName = exampleStartedGame.getIn(['submittedPlays', 0, 'player']);
			const action = {
				type: 'DECIDE_WINNER',
				meta: {
					sockId: exampleSockId,
					remote: true,
					player: exampleStartedGame.get('decider'),
					game: exampleStartedGame.get('name')
				},
				winner: winnerName
			};
			const nextState = reducer(emitSpy, emptyFunction)(initialState, action);

			const setCurrentGameAction = Actions.setCurrentGame(nextState.getIn(['games', action.gameName]));
			expect(emitSpy.calledOnce).to.equal(true);
			expect(emitSpy.calledWithExactly(setCurrentGameAction, GAME_PROP_NAME, action.meta.game)).to.equal(true);
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
					sockId: exampleSockId,
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

		it('emits a SET_CURRENT_GAME action to the game', function () {
			const emitSpy = spy();
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
					sockId: exampleSockId,
					remote: true,
					player: exampleStartedGame.get('host'),
					game: exampleStartedGame.get('name')
				}
			};
			const nextState = reducer(emitSpy, emptyFunction)(initialState, action);

			const setCurrentGameAction = Actions.setCurrentGame(nextState.getIn(['games', action.gameName]));
			expect(emitSpy.calledOnce).to.equal(true);
			expect(emitSpy.calledWithExactly(setCurrentGameAction, GAME_PROP_NAME, action.meta.game)).to.equal(true);
		});

	});

});