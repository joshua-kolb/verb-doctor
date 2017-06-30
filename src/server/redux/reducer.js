import {Map} from 'immutable';
import Lobby from '../core/Lobby';
import Game from '../core/Game';

const INITIAL_STATE = Map();

export default function reducer(state = INITIAL_STATE, action) {
	switch (action.type) {
		case 'SET_CARD_TYPES':
			if (action.meta.remote) {
				return;
			}
			return Lobby.setCardTypes(state, action.cardTypes);

		case 'SET_CARDS':
			if (action.meta.remote) {
				return;
			}
			return Lobby.setCards(state, action.cards);

		case 'LOGIN':
			return Lobby.login(state, action.player);

		case 'LOGOUT':
			return Lobby.logout(state, action.meta.player);

		case 'CREATE_GAME':
			return Game.create(state, action.meta.player, action.gameName, action.password);

		case 'JOIN_GAME':
			return Game.join(state, action.meta.player, action.gameName, action.password);

		case 'START_GAME':
			return Game.start(state, action.meta.player, action.meta.game);

		case 'LEAVE_GAME':
			return Game.leave(state, action.meta.player, action.meta.game);

		case 'SUBMIT_PLAY':
			return Game.submitPlay(state, action.meta.player, action.meta.game, action.cards);

		case 'DECIDE_WINNER':
			return Game.decideWinner(state, action.meta.player, action.meta.game, action.winner);

		case 'NEXT_ROUND':
			return Game.nextRound(state, action.meta.player, action.meta.game);
	}
}