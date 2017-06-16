import {List, Map, fromJS} from 'immutable';

export default class Lobby {

	static setCards(state, cards) {
		console.log(`Successfully set cards to ${fromJS(cards)}`);
		return state.set('cards', fromJS(cards));
	}

	static login(state, player) {
		if (!state.has('lobby')) {
			console.log(`Successfully added player "${player}" to the lobby (created new lobby).`);
			return state.set('lobby', List.of(player));
		}

		if (state.get('lobby').includes(player)) {
			console.log(`Attempted to add player "${player}" to the lobby, but the player name was already taken.`);
			return state;
		}
		
		console.log(`Successfully added player "${player}" to the lobby.`)
		return state.update('lobby', (lobby) => lobby.push(player));
	}

	static logout(state, player) {
		const playerIndex = state.get('lobby').indexOf(player);

		if (playerIndex === -1) {
			console.warn(`Attempted to log out player "${player}", but the player didn't exist in the lobby.`);
			return state;
		}

		if (state.get('lobby').size === 1) {
			console.log(`Successfully removed player "${player}" from the lobby (also removed the lobby).`);
			return state.remove('lobby');
		}

		console.log(`Successfully removed player "${player}" from the lobby.`);
		return state.update('lobby', (lobby) => lobby.delete(playerIndex));
	}

}