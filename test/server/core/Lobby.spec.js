import {expect} from 'chai';
import {List, Map, fromJS} from 'immutable';
import {
	plainJSCardTypes,
	plainJSExampleCards, 
	emptyState, 
	exampleCardTypes,
	exampleCards,
	exampleLonePlayer,
	examplePlayers,
	exampleNewGameReadyToStart
} from '../testConstants';
import Lobby from '../../../src/server/core/Lobby';

describe('core lobby logic', function () {

	describe('setCardTypes', function () {

		it('adds the cardTypes map to the state', function () {
			const nextState = Lobby.setCardTypes(emptyState, exampleCardTypes);
			expect(nextState).to.equal(Map({
				cardTypes: exampleCardTypes
			}));
		});

		it('throws an error if a cardType doesn\'t have playable set to true or false', function () {
			expect(() => Lobby.setCardTypes(emptyState, Map({ 
				noun: Map({ playable: 52 }), 
				verb: Map({ fake: true }) 
			}))).to.throw();
		});

	});

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

		it('creates the lobby state and adds a player to it', function () {
			const nextState = Lobby.login(emptyState, exampleLonePlayer);
			expect(nextState).to.equal(Map({
				lobby: List.of(exampleLonePlayer)
			}));
		});

		it('adds a player to the existing lobby state', function () {
			const state = Map({
				lobby: examplePlayers
			});
			const nextState = Lobby.login(state, exampleLonePlayer);
			expect(nextState).to.equal(Map({
				lobby: examplePlayers.push(exampleLonePlayer)
			}));
		});

		it('throws an error when a login already exists in the lobby', function () {
			const state = Map({
				lobby: List.of(exampleLonePlayer)
			});
			expect(() => Lobby.login(state, exampleLonePlayer)).to.throw();
		});

		it('throws an error when a login already exists in a game', function () {
			const state = Map({
				games: Map({
					[exampleNewGameReadyToStart.get('name')]: exampleNewGameReadyToStart 
				})
			});
			const existingPlayer = exampleNewGameReadyToStart.get('players').keySeq().get(1);
			expect(() => Lobby.login(state, existingPlayer)).to.throw();
		});

	});

	describe('logout', function() {

		it('removes the player from the lobby state', function () {
			const state = Map({
				lobby: List.of(...examplePlayers, exampleLonePlayer)
			});
			const nextState = Lobby.logout(state, exampleLonePlayer);
			expect(nextState).to.equal(Map({
				lobby: examplePlayers
			}));
		});

		it('removes the lobby state when removing the last player', function () {
			const state = Map({
				lobby: List.of(exampleLonePlayer)
			});
			const nextState = Lobby.logout(state, exampleLonePlayer);
			expect(nextState).to.equal(emptyState);
		});

		it('throws an error if the player isn\'t in the state', function () {
			const state = Map({
				lobby: examplePlayers
			});
			expect(() => Lobby.logout(state, exampleLonePlayer)).to.throw();
		});

	});

});