import {List, Map, fromJS} from 'immutable';
import logger from 'winston';

export default class Lobby {

	static setCardTypes(state, cardTypes) {
		logger.info(`asdf: ${cardTypes}`);
		cardTypes = fromJS(cardTypes);
		const isInvalid = cardTypes.some((cardType, name) => 
			cardType.get('playable') !== true && cardType.get('playable') !== false);
		
		if (isInvalid) {
			throw new Error(`Attempted to set cardTypes to ${cardTypes}, but not every type had a field 'playable' set to either true or false.`);
		}

		logger.info(`Successfully set cardTypes to ${cardTypes}`);
		return state.set('cardTypes', cardTypes);
	}

	static setCards(state, cards) {
		logger.info(`Successfully set cards to ${fromJS(cards)}`);
		return state.set('cards', fromJS(cards));
	}

	static login(state, player) {
		if (!state.has('lobby')) {
			logger.info(`Successfully added player "${player}" to the lobby (created new lobby).`);
			return state.set('lobby', List.of(player));
		}

		if (state.get('lobby').includes(player)) {
			throw new Error(`Attempted to add player "${player}" to the lobby, but the player name was already taken.`);
		}
		
		logger.info(`Successfully added player "${player}" to the lobby.`)
		return state.update('lobby', (lobby) => lobby.push(player));
	}

	static logout(state, player) {
		const playerIndex = state.get('lobby').indexOf(player);

		if (playerIndex === -1) {
			throw new Error(`Attempted to log out player "${player}", but the player didn't exist in the lobby.`);
		}

		if (state.get('lobby').size === 1) {
			logger.info(`Successfully removed player "${player}" from the lobby (also removed the lobby).`);
			return state.remove('lobby');
		}

		logger.info(`Successfully removed player "${player}" from the lobby.`);
		return state.update('lobby', (lobby) => lobby.delete(playerIndex));
	}

}