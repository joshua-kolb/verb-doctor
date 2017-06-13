import {List, Map, fromJS} from 'immutable';

export default class Lobby {

	static setCards(state, cards) {
		return state.set('cards', fromJS(cards));
	}

	static login(state, player) {
		if (!state.has('players')) {
			return state.set('players', List.of(player));
		}

		if (state.get('players').includes(player)) {
			// don't allow duplicate player logins.
			return state;
		}
		
		return state.update('players', (players) => players.push(player));
	}

	static logout(state, player) {
		const playerIndex = state.get('players').indexOf(player);

		if (playerIndex === -1) {
			return state;
		}

		if (state.get('players').size === 1) {
			return state.remove('players');
		}

		return state.update('players', (players) => players.delete(playerIndex));
	}

}