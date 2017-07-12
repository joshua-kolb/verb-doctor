import {Map} from 'immutable';
import logger from 'winston';
import Lobby from '../core/Lobby';
import Game from '../core/Game';
import Actions from './actionCreators';

const INITIAL_STATE = Map();
const PLAYER_PROP_NAME = 'player';
const GAME_PROP_NAME = 'game';

export default function reducer(emit, setSocketProp) {
	return function(state, action) {
		if (state === undefined) {
			return INITIAL_STATE;
		}
		
		let result = state;
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
					setSocketProp(action.meta.sockId, PLAYER_PROP_NAME, action.player);
					emit(Actions.setLobbyGames(result.get('games')), PLAYER_PROP_NAME, action.player);
					break;

				case 'LOGOUT':
					result = Lobby.logout(state, action.meta.player);
					setSocketProp(action.meta.sockId, PLAYER_PROP_NAME, undefined);
					break;

				case 'CREATE_GAME':
					result = Game.create(state, action.meta.player, action.gameName, action.password);
					setSocketProp(action.meta.sockId, GAME_PROP_NAME, action.gameName);
					emit(Actions.setLobbyGames(result.get('games')));
					emit(Actions.setCurrentGame(result.getIn(['games', action.gameName])), PLAYER_PROP_NAME, action.meta.player);
					break;

				case 'JOIN_GAME':
					result = Game.join(state, action.meta.player, action.gameName, action.password);
					setSocketProp(action.meta.sockId, GAME_PROP_NAME, action.gameName);
					emit(Actions.setLobbyGames(result.get('games')));
					emit(Actions.setCurrentGame(result.getIn(['games', action.gameName])), GAME_PROP_NAME, action.gameName);
					break;

				case 'START_GAME':
					result = Game.start(state, action.meta.player, action.meta.game);
					emit(Actions.setLobbyGames(result.get('games')));
					emit(Actions.setCurrentGame(result.getIn(['games', action.meta.game])), GAME_PROP_NAME, action.meta.game);
					break;

				case 'LEAVE_GAME':
					result = Game.leave(state, action.meta.player, action.meta.game);
					setSocketProp(action.meta.sockId, GAME_PROP_NAME, undefined);
					emit(Actions.setLobbyGames(result.get('games')));
					emit(Actions.setCurrentGame(result.getIn(['games', action.meta.game])), GAME_PROP_NAME, action.meta.game);
					break;

				case 'SUBMIT_PLAY':
					result = Game.submitPlay(state, action.meta.player, action.meta.game, action.cards);
					emit(Actions.setCurrentGame(result.getIn(['games', action.meta.game])), GAME_PROP_NAME, action.meta.game);
					break;

				case 'DECIDE_WINNER':
					result = Game.decideWinner(state, action.meta.player, action.meta.game, action.winner);
					emit(Actions.setCurrentGame(result.getIn(['games', action.meta.game])), GAME_PROP_NAME, action.meta.game);
					break;

				case 'NEXT_ROUND':
					result = Game.nextRound(state, action.meta.player, action.meta.game);
					emit(Actions.setCurrentGame(result.getIn(['games', action.meta.game])), GAME_PROP_NAME, action.meta.game);
					break;

				default:
					throw new Error(`Unsupported action type: "${action.type}"`);
			}
		} catch (exception) {
			logger.warn(`Error encountered when trying to service action (${JSON.stringify(action)}): "${exception}"`);
			
			if (action.meta && action.meta.player) {
				emit(Actions.error(exception.message), PLAYER_PROP_NAME, action.meta.player);
			}

			return result;

		} finally {
			return result;
		}
	}
}
