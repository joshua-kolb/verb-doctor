import {Map} from 'immutable';
import logger from 'winston';
import Lobby from '../core/Lobby';
import Game from '../core/Game';
import Actions from './actionCreators';

const INITIAL_STATE = Map();

export default function reducer(broadcast, emitToPlayer, emitToGame) {
	return function(state = INITIAL_STATE, action) {
		const result = state;
		try {
			switch (action.type) {
				case 'SET_CARD_TYPES':
					if (action.meta && action.meta.remote) {
						throw new Error('The SET_CARD_TYPES action was initiated remotely. Denied request.');
					}
					result = Lobby.setCardTypes(state, action.cardTypes);
					break;

				case 'SET_CARDS':
					if (action.meta && action.meta.remote) {
						throw new Error('The SET_CARDS action was initiated remotely. Denied request.');
					}
					result = Lobby.setCards(state, action.cards);
					break;

				case 'LOGIN':
					result = Lobby.login(state, action.player);
					emitToPlayer(action.player, Actions.setLobbyGames(result.get('games')));
					break;

				case 'LOGOUT':
					result = Lobby.logout(state, action.meta.player);
					break;

				case 'CREATE_GAME':
					result = Game.create(state, action.meta.player, action.gameName, action.password);
					broadcast(Actions.setLobbyGames(result.get('games')));
					emitToPlayer(action.meta.player, Actions.setCurrentGame());
					break;

				case 'JOIN_GAME':
					result = Game.join(state, action.meta.player, action.gameName, action.password);
					break;

				case 'START_GAME':
					result = Game.start(state, action.meta.player, action.meta.game);
					break;

				case 'LEAVE_GAME':
					result = Game.leave(state, action.meta.player, action.meta.game);
					break;

				case 'SUBMIT_PLAY':
					result = Game.submitPlay(state, action.meta.player, action.meta.game, action.cards);
					break;

				case 'DECIDE_WINNER':
					result = Game.decideWinner(state, action.meta.player, action.meta.game, action.winner);
					break;

				case 'NEXT_ROUND':
					result = Game.nextRound(state, action.meta.player, action.meta.game);
					break;

				default:
					throw new Error(`Unsupported action type: "${action.type}"`);
			}
		} catch (exception) {
			logger.warn(`Error encountered when trying to service action (${action}): "${exception.message}"`);
			
			if (action.meta && action.meta.player) {
				emitToPlayer(action.meta.player, Actions.error(exception.message));
			}

			return result;

		} finally {
			return result;
		}
	}
}
