import {List, Map, fromJS} from 'immutable';

export default class Lobby {

	static setCards(state, cards) {
		return state.set('cards', fromJS(cards));
	}

	static login(state, player) {
		if (!state.has('lobby')) {
			return state.set('lobby', List.of(player));
		}

		if (state.get('lobby').includes(player)) {
			// don't allow duplicate player logins.
			return state;
		}
		
		return state.update('lobby', (lobby) => lobby.push(player));
	}

	static logout(state, player) {
		const playerIndex = state.get('lobby').indexOf(player);

		if (playerIndex === -1) {
			return state;
		}

		if (state.get('lobby').size === 1) {
			return state.remove('lobby');
		}

		return state.update('lobby', (lobby) => lobby.delete(playerIndex));
	}

}