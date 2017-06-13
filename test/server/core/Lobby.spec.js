import {expect} from 'chai';
import {List, Map, fromJS} from 'immutable';
import {
	plainJSExampleCards, 
	emptyState, 
	exampleCards,
	exampleLonePlayer,
	examplePlayers
} from '../testConstants';
import Lobby from '../../../src/server/core/Lobby';

describe('core lobby logic', function () {

	describe('setCards', function () {

		it('adds cards to the state', function () {
			const nextState = Lobby.setCards(emptyState, exampleCards);
			expect(nextState).to.equal(Map({
				cards: exampleCards
			}));
		});

		it('converts to immutable', function () {
			const nextState = Lobby.setCards(emptyState, plainJSExampleCards);
			expect(nextState).to.equal(Map({
				cards: exampleCards
			}));
		});

	});

	describe('login', function () {

		it('creates the players state and adds a player to it', function () {
			const nextState = Lobby.login(emptyState, exampleLonePlayer);
			expect(nextState).to.equal(Map({
				players: List.of(exampleLonePlayer)
			}));
		});

		it('adds a player to the existing players state', function () {
			const state = Map({
				players: examplePlayers
			});
			const nextState = Lobby.login(state, exampleLonePlayer);
			expect(nextState).to.equal(Map({
				players: examplePlayers.push(exampleLonePlayer)
			}));
		});

		it('doesn\'t allow duplicate player login names', function () {
			const state = Map({
				players: List.of(exampleLonePlayer)
			});
			const nextState = Lobby.login(state, exampleLonePlayer);
			expect(nextState).to.equal(state);
		});

	});

	describe('logout', function() {

		it('removes the player from the players state', function () {
			const state = Map({
				players: List.of(...examplePlayers, exampleLonePlayer)
			});
			const nextState = Lobby.logout(state, exampleLonePlayer);
			expect(nextState).to.equal(Map({
				players: examplePlayers
			}));
		});

		it('removes the players state when removing the last player', function () {
			const state = Map({
				players: List.of(exampleLonePlayer)
			});
			const nextState = Lobby.logout(state, exampleLonePlayer);
			expect(nextState).to.equal(emptyState);
		});

		it('doesn\'t do anything if the player isn\'t in the state', function () {
			const state = Map({
				players: examplePlayers
			});
			const nextState = Lobby.logout(state, exampleLonePlayer);
			expect(nextState).to.equal(state);
		});

	});

});