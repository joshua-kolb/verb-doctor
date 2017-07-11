import {expect} from 'chai';
import {List, Map, fromJS} from 'immutable';
import {
	emptyState,
	randomizeTries,
	exampleCards,
	exampleCardsByType,
	exampleCardTypes,
	examplePlayers,
	exampleLonePlayer,
	expectedNounsInHand,
	expectedVerbsInHand,
	exampleNewGame,
	exampleNewGameWithPassword,
	exampleNewGameReadyToStart,
	exampleStartedGame,
	exampleStartedGameWithTwoPlayers,
	exampleStartedGameWithDepletedDecks
} from '../testConstants'
import Game from '../../../src/server/core/Game';

describe('core game logic', function () {
	
	describe('create', function () {

		it('creates the game state and adds a new game to it', function () {
			const state = Map({
				lobby: List.of(exampleNewGame.get('host'))
			})
			const nextState = Game.create(state, exampleNewGame.get('host'), exampleNewGame.get('name'));
			expect(nextState.get('games')).to.equal(Map({
				[exampleNewGame.get('name')]: exampleNewGame
			}));
		});

		it('adds a new game to the existing game state', function () {
			const state = Map({
				games: Map({
					[exampleNewGameWithPassword.get('name')]: exampleNewGameWithPassword
				}),
				lobby: List.of(exampleNewGame.get('host'))
			});
			const nextState = Game.create(state, exampleNewGame.get('host'), exampleNewGame.get('name'));
			expect(nextState.get('games')).to.equal(Map({
				[exampleNewGameWithPassword.get('name')]: exampleNewGameWithPassword,
				[exampleNewGame.get('name')]: exampleNewGame
			}));
		});

		it('removes the player from the lobby', function () {
			const state = Map({
				lobby: List.of(...examplePlayers, exampleLonePlayer)
			});
			const nextState = Game.create(state, exampleLonePlayer, exampleNewGame.get('name'));
			expect(nextState.get('lobby')).to.equal(examplePlayers);
		});

		it('creates a game with a password if one was provided', function () {
			const state = Map({
				lobby: List.of(exampleNewGameWithPassword.get('host'))
			});
			const nextState = Game.create(
				state, 
				exampleNewGameWithPassword.get('host'), 
				exampleNewGameWithPassword.get('name'), 
				exampleNewGameWithPassword.get('password')
			);
			expect(nextState.get('games')).to.equal(Map({
				[exampleNewGameWithPassword.get('name')]: exampleNewGameWithPassword
			}));
		});

		it('throws an error when the name is already taken', function () {
			const state = Map({
				games: Map({
					[exampleNewGame.get('name')]: exampleNewGame
				}),
				lobby: List.of(exampleNewGame.get('host'))
			});
			expect(() => Game.create(state, exampleNewGame.get('host'), exampleNewGame.get('name'))).to.throw();
		});

		it('throws an error when the new host isn\'t in the lobby', function () {
			const state = Map({
				lobby: examplePlayers
			});
			expect(() => Game.create(emptyState, exampleLonePlayer, exampleNewGame.get('name'))).to.throw();
		});

	});

	describe('join', function () {

		it('adds a player to the game and removes them from the lobby when not started', function () {
			const state = Map({
				games: Map({
					[exampleNewGame.get('name')]: exampleNewGame
				}),
				lobby: List.of(...examplePlayers, exampleLonePlayer)
			});
			const nextState = Game.join(state, exampleLonePlayer, exampleNewGame.get('name'));
			expect(nextState.hasIn(['games', exampleNewGame.get('name'), 'players', exampleLonePlayer])).to.equal(true);
			expect(nextState.get('lobby')).to.equal(examplePlayers);
		});

		it('adds a player to the game when they get the password right', function () {
			const state = Map({
				games: Map({
					[exampleNewGameWithPassword.get('name')]: exampleNewGameWithPassword
				}),
				lobby: List.of(...examplePlayers, exampleLonePlayer)
			});
			const nextState = Game.join(
				state, 
				exampleLonePlayer, 
				exampleNewGameWithPassword.get('name'), 
				exampleNewGameWithPassword.get('password')
			);
			expect(nextState.hasIn([
				'games', 
				exampleNewGameWithPassword.get('name'), 
				'players', 
				exampleLonePlayer
			])).to.equal(true);
			expect(nextState.get('lobby')).to.equal(examplePlayers);
		});

		it('adds a player to a game, gives them a score of 0 and a new cards, and removes them from the lobby when the game has been started already', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				}),
				lobby: List.of(...examplePlayers, exampleLonePlayer)
			});
			const nextState = Game.join(state, exampleLonePlayer, exampleStartedGame.get('name'));
			expect(nextState.hasIn(['games', exampleStartedGame.get('name'), 'players', exampleLonePlayer])).to.equal(true);
			expect(nextState.getIn(['games', exampleStartedGame.get('name'), 'players', exampleLonePlayer, 'score'])).to.equal(0);

			const playerHand = nextState.getIn(['games', exampleStartedGame.get('name'), 'players', exampleLonePlayer, 'hand']);
			const cardCounts = {};
			playerHand.forEach((card) => cardCounts[card.get('type')] = cardCounts[card.get('type')] ? cardCounts[card.get('type')] + 1 : 1);
			expect(cardCounts.noun).to.equal(expectedNounsInHand);
			expect(cardCounts.verb).to.equal(expectedVerbsInHand);
			expect(cardCounts.situation).to.be.undefined;
			expect(nextState.get('lobby')).to.equal(examplePlayers);
		});

		it('throws an error if the game does\'t exist', function () {
			const state = Map({
				games: Map({
					[exampleNewGame.get('name')]: exampleNewGame
				}),
				lobby: List.of(...examplePlayers)
			});
			expect(() => Game.join(state, exampleLonePlayer, exampleNewGameWithPassword.get('name'))).to.throw();
		});

		it('throws an error if the game has a password and the user didn\'t get it right', function () {
			const state = Map({
				games: Map({
					[exampleNewGameWithPassword.get('name')]: exampleNewGameWithPassword
				}),
				lobby: List.of(...examplePlayers, exampleLonePlayer)
			});
			expect(() => Game.join(state, exampleLonePlayer, exampleNewGameWithPassword.get('name'))).to.throw();
		});

		it('throws an error if they are already in the game', function () {
			const player = exampleNewGame.get('players').keySeq().first();
			const state = Map({
				games: Map({
					[exampleNewGame.get('name')]: exampleNewGame
				}),
				lobby: List.of(...examplePlayers, player)
			});
			expect(() => Game.join(state, player, exampleNewGame.get('name'))).to.throw();
		});

		it('throws an error if they don\'t exist in the lobby state', function () {
			const state = Map({
				games: Map({
					[exampleNewGame.get('name')]: exampleNewGame
				}),
				lobby: List.of(...examplePlayers)
			});
			expect(() => Game.join(state, exampleLonePlayer, exampleNewGame.get('name'))).to.throw();
		});

	});

	describe('start', function () {

		it('sets started to true in the game state', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleNewGameReadyToStart.get('name')]: exampleNewGameReadyToStart
				})
			});
			const nextState = Game.start(
				state, 
				exampleNewGameReadyToStart.get('host'), 
				exampleNewGameReadyToStart.get('name')
			);
			expect(nextState.getIn(['games', exampleNewGameReadyToStart.get('name'), 'started'])).to.equal(true);
		});

		it('initializes the game decks', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleNewGameReadyToStart.get('name')]: exampleNewGameReadyToStart
				})
			});
			const nextState = Game.start(
				state, 
				exampleNewGameReadyToStart.get('host'), 
				exampleNewGameReadyToStart.get('name')
			);
			const decks = nextState.getIn(['games', exampleNewGameReadyToStart.get('name'), 'decks']);
			const players = nextState.getIn(['games', exampleNewGameReadyToStart.get('name'), 'players']);
			expect(decks.every(
				(deck, cardType) => deck.every(
					(card) => exampleCards.includes(card)
				)
			)).to.equal(true);
		});

		it('initializes the game decks as shuffled', function () {
			let randomized = false;
			for(let i = 0; i < randomizeTries; ++i) {
				const state = Map({
					cardTypes: exampleCardTypes,
					cards: exampleCards,
					games: Map({
						[exampleNewGameReadyToStart.get('name')]: exampleNewGameReadyToStart
					})
				});
				const nextState = Game.start(
					state, 
					exampleNewGameReadyToStart.get('host'), 
					exampleNewGameReadyToStart.get('name')
				);
				randomized = nextState.getIn(['games', exampleNewGameReadyToStart.get('name'), 'decks']).every(
					(deck, decktype) => deck !== exampleCardsByType.get(decktype)
				);
				if (randomized) {
					break;
				}
			}
			expect(randomized).to.equal(true);
		});

		it('deals cards into each of the players\' hands from the decks', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleNewGameReadyToStart.get('name')]: exampleNewGameReadyToStart
				})
			});
			const nextState = Game.start(
				state, 
				exampleNewGameReadyToStart.get('host'), 
				exampleNewGameReadyToStart.get('name')
			);
			const game = nextState.getIn(['games', exampleNewGameReadyToStart.get('name')]);
			const cardsMatchUp =  game.get('players').every(
				(player, playerName) => player.get('hand').every(
					(card) => exampleCardsByType.get(card.get('type')).includes(card)
				)
			);
			expect(cardsMatchUp).to.equal(true);
		});

		it('sets each players\' score to 0', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleNewGameReadyToStart.get('name')]: exampleNewGameReadyToStart
				})
			});
			const nextState = Game.start(
				state, 
				exampleNewGameReadyToStart.get('host'), 
				exampleNewGameReadyToStart.get('name')
			);
			const AllScoresAreZero = nextState.getIn(['games', exampleNewGameReadyToStart.get('name'), 'players']).every(
				(player, playerName) => player.get('score') === 0
			);
			expect(AllScoresAreZero).to.equal(true);
		});

		it('sets the current_situation in the game state by dealing it from the situation deck', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleNewGameReadyToStart.get('name')]: exampleNewGameReadyToStart
				})
			});
			const nextState = Game.start(
				state, 
				exampleNewGameReadyToStart.get('host'), 
				exampleNewGameReadyToStart.get('name')
			);
			const game = nextState.getIn(['games', exampleNewGameReadyToStart.get('name')]);
			const currentSituation =  game.get('current_situation');
			expect(currentSituation).to.not.be.undefined;
			expect(game.getIn(['decks', 'situation']).includes(currentSituation)).to.equal(false);
		});

		it('sets the decider in the game state', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleNewGameReadyToStart.get('name')]: exampleNewGameReadyToStart
				})
			});
			const nextState = Game.start(
				state, 
				exampleNewGameReadyToStart.get('host'), 
				exampleNewGameReadyToStart.get('name')
			);
			expect(nextState.getIn(['games', exampleNewGameReadyToStart.get('name'), 'decider'])).to.not.be.undefined;
		});

		it('throws an error if there is only one player', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleNewGame.get('name')]: exampleNewGame
				})
			});
			expect(() => Game.start(state, exampleNewGame.get('host'), exampleNewGame.get('name'))).to.throw();
		});

		it('throws an error if a player other than the host tries to start the game', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleNewGameReadyToStart.get('name')]: exampleNewGameReadyToStart
				})
			});
			expect(() => Game.start(
				state, 
				exampleNewGameReadyToStart.get('players').keySeq().get(1), 
				exampleNewGameReadyToStart.get('name')
			)).to.throw();
		});

		it('throws an error if the game doesn\'t exist', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleNewGameReadyToStart.get('name')]: exampleNewGameReadyToStart
				})
			});
			expect(() => Game.start(
				state, 
				exampleNewGameReadyToStart.get('host'), 
				exampleNewGameReadyToStart.get('name') + 'DIFFERENT'
			)).to.throw();
		});

		it('throws an error if the game is already started', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			});
			expect(() => Game.start(
				state, 
				exampleStartedGame.get('host'), 
				exampleStartedGame.get('name')
			)).to.throw();
		});

	});

	describe('leave', function () {

		it('removes the player from the game state', function () {
			const state = Map({
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			});
			const leavingPlayerName = exampleStartedGame.get('players').keySeq().get(1);
			const nextState = Game.leave(state, leavingPlayerName, exampleStartedGame.get('name'));

			expect(nextState.hasIn(['games', exampleStartedGame.get('name')])).to.equal(true);
			expect(nextState.hasIn(['games', exampleStartedGame.get('name'), 'players', leavingPlayerName])).to.equal(false);
		});

		it('adds the player to the lobby', function () {
			const state = Map({
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			});
			const leavingPlayerName = exampleStartedGame.get('players').keySeq().get(1);
			const nextState = Game.leave(state, leavingPlayerName, exampleStartedGame.get('name'));

			expect(nextState.get('lobby').includes(leavingPlayerName)).to.equal(true);
		});

		it('removes the game from the state if there is only one player remaining and the game is started', function () {
			const state = Map({
				games: Map({
					[exampleStartedGameWithTwoPlayers.get('name')]: exampleStartedGameWithTwoPlayers
				})
			});
			const leavingPlayerName = exampleStartedGameWithTwoPlayers.get('players').keySeq().get(1);
			const nextState = Game.leave(
				state, 
				leavingPlayerName, 
				exampleStartedGameWithTwoPlayers.get('name')
			);

			expect(nextState.hasIn(['games', 0])).to.equal(false);
		});

		it('removes the game from the state if there are no players remaining and the game is not started', function () {
			const state = Map({
				games: Map({
					[exampleNewGame.get('name')]: exampleNewGame
				})
			});
			const leavingPlayerName = exampleNewGame.get('host');
			const nextState = Game.leave(
				state, 
				leavingPlayerName, 
				exampleNewGame.get('name')
			);

			expect(nextState.hasIn(['games', 0])).to.equal(false);
		});

		it('changes the host to a different player if the host is leaving', function () {
			const state = Map({
				games: Map({
					[exampleNewGameReadyToStart.get('name')]: exampleNewGameReadyToStart
				})
			});
			const leavingPlayerName = exampleNewGameReadyToStart.get('host');
			const newHostPlayerName = exampleNewGameReadyToStart.get('players').keySeq().get(1);
			const nextState = Game.leave(
				state, 
				leavingPlayerName, 
				exampleNewGameReadyToStart.get('name')
			);

			expect(nextState.getIn(['games', exampleNewGameReadyToStart.get('name'), 'host'])).to.equal(newHostPlayerName);
		});

		it('removes the player\'s submittedPlay if it exists', function () {
			const state = Map({
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			});
			const leavingPlayerName = exampleStartedGame.get('players').keySeq().get(1);
			const nextState = Game.leave(state, leavingPlayerName, exampleStartedGame.get('name'));

			expect(nextState.getIn(['games', exampleStartedGame.get('name'), 'submittedPlays']).size).to.equal(0);
		});

		it('throws an error if the player isn\'t in the game', function () {
			const state = Map({
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			});
			const leavingPlayerName = exampleStartedGame.get('players').keySeq().get(1) + 'DIFFERENT';

			expect(() => Game.leave(state, leavingPlayerName, exampleStartedGame.get('name'))).to.throw();
		});

		it('throws an error if the game doesn\'t exist', function () {
			const state = Map({
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			});
			const leavingPlayerName = exampleStartedGame.get('players').keySeq().get(1);
			
			expect(() => Game.leave(
				state, 
				leavingPlayerName, 
				exampleStartedGame.get('name') + 'DIFFERENT'
			)).to.throw();
		});

	});

	describe('submitPlay', function () {

		it('adds to the submittedPlays list of the game state', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			});
			const playerName = exampleStartedGame.get('players').keySeq().get(2);
			const gameName = exampleStartedGame.get('name');
			const play = List.of(exampleStartedGame.getIn(['players', playerName, 'hand', 0]));
			const nextState = Game.submitPlay(state, playerName, gameName, play);

			expect(nextState.hasIn(['games', exampleStartedGame.get('name'), 'submittedPlays', 1])).to.equal(true);
			const submittedPlay = nextState.getIn(['games', exampleStartedGame.get('name'), 'submittedPlays', 1]);
			expect(submittedPlay).to.equal(Map({
				player: playerName,
				cardsSubmitted: play
			}));
		});

		it('deals new cards to the player\'s hand to replace the cards submitted', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			});
			const playerName = exampleStartedGame.get('players').keySeq().get(2);
			const gameName = exampleStartedGame.get('name');
			const originalHand = exampleStartedGame.getIn(['players', playerName, 'hand']);
			const play = List.of(originalHand.get(0));
			const nextState = Game.submitPlay(state, playerName, gameName, play);

			const newHand = nextState.getIn(['games', exampleStartedGame.get('name'), 'players', playerName, 'hand']);
			expect(newHand.size).to.equal(originalHand.size);
			expect(newHand.filter((card) => card.get('type') === 'noun').size).to.equal(expectedNounsInHand);
		});

		it('reinitializes card decks if there are no more cards in the decks', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleStartedGameWithDepletedDecks.get('name')]: exampleStartedGameWithDepletedDecks
				})
			});
			const playerName = exampleStartedGameWithDepletedDecks.get('players').keySeq().get(1);
			const gameName = exampleStartedGameWithDepletedDecks.get('name');
			const originalHand = exampleStartedGameWithDepletedDecks.getIn(['players', playerName, 'hand']);
			const cardType = originalHand.getIn([0, 'type']);
			const play = List.of(originalHand.get(0));
			const nextState = Game.submitPlay(state, playerName, gameName, play);

			const newDeck = nextState.getIn(['games', exampleStartedGameWithDepletedDecks.get('name'), 'decks', cardType]);
			expect(newDeck.size).to.equal(exampleCardsByType.get(cardType).size - 1);
		});

		it('throws an error if the decider submits a play', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			});
			const playerName = exampleStartedGame.get('decider');
			const gameName = exampleStartedGame.get('name');
			const play = List.of(exampleStartedGame.getIn(['players', playerName, 'hand', 0]));
			const nextState = Game.submitPlay(state, playerName, gameName, play);

			expect(nextState).to.equal(state);
		});

		it('throws an error if a player tries to submit a play and they already have submitted a play', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			});
			const playerName = exampleStartedGame.getIn(['submittedPlays', exampleStartedGame.get('name'), 'player']);
			const gameName = exampleStartedGame.get('name');
			const play = List.of(exampleStartedGame.getIn(['players', playerName, 'hand', 0]));
			
			expect(() => Game.submitPlay(state, playerName, gameName, play)).to.throw();
		});

		it('throws an error when given a simple play that doesn\'t fill all card slots', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			});
			const playerName = exampleStartedGame.get('players').keySeq().get(2);
			const gameName = exampleStartedGame.get('name');
			const play = List.of(exampleStartedGame.getIn(['players', playerName, 'hand', expectedNounsInHand]));

			expect(() => Game.submitPlay(state, playerName, gameName, play)).to.throw();
		});

		it('throws an error when given a play with chainer cards that doesn\'t fill all card slots', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			});
			const playerName = exampleStartedGame.get('players').keySeq().get(2);
			const gameName = exampleStartedGame.get('name');
			const play = List.of(exampleStartedGame.getIn(['players', playerName, 'hand', 2]));
			
			expect(() => Game.submitPlay(state, playerName, gameName, play)).to.throw();
		});

		it('throws an error when given a play that includes cards that aren\'t in the player\'s hand', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			});
			const playerName = exampleStartedGame.get('players').keySeq().get(2);
			const gameName = exampleStartedGame.get('name');
			const play = List.of(exampleCards.get(expectedNounsInHand));
			
			expect(Game.submitPlay(state, playerName, gameName, play)).to.throw();
		});

		it('throws an error if the player isn\'t in the game', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			});
			const playerName = exampleStartedGame.get('players').keySeq().get(2) + 'DIFFERENT';
			const gameName = exampleStartedGame.get('name');
			const play = List.of(exampleStartedGame.getIn(['players', playerName, 'hand', 0]));

			expect(() => Game.submitPlay(state, playerName, gameName, play)).to.throw();
		});

		it('throws an error if the game doesn\'t exist', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			});
			const playerName = exampleStartedGame.get('players').keySeq().get(2);
			const gameName = exampleStartedGame.get('name') + 'DIFFERENT';
			const play = List.of(exampleStartedGame.getIn(['players', playerName, 'hand', 0]));
			
			expect(() => Game.submitPlay(state, playerName, gameName, play)).to.throw();
		});

	});

	describe('decideWinner', function () {

		it('adds winner of last round to the game state', function () {
			const state = Map({
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			});
			const playerName = exampleStartedGame.get('decider');
			const gameName = exampleStartedGame.get('name');
			const winnerName = exampleStartedGame.getIn(['submittedPlays', 0, 'player']);
			const nextState = Game.decideWinner(state, playerName, gameName, winnerName);

			expect(nextState.getIn(['games', exampleStartedGame.get('name'), 'winnerOfLastRound'])).to.equal(winnerName);
		});

		it('adds 1 to the score of the player who won', function () {
			const state = Map({
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			});
			const playerName = exampleStartedGame.get('decider');
			const gameName = exampleStartedGame.get('name');
			const winnerName = exampleStartedGame.getIn(['submittedPlays', 0, 'player']);
			const originalScore = exampleStartedGame.getIn(['players', winnerName, 'score']);
			const nextState = Game.decideWinner(state, playerName, gameName, winnerName);

			expect(nextState.getIn(['games', exampleStartedGame.get('name'), 'players', winnerName, 'score'])).to.equal(originalScore + 1);
		});

		it('throws an error when a player who is not the decider tries to decide', function () {
			const state = Map({
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			});
			const playerName = exampleStartedGame.get('players').keySeq().get(2);
			const gameName = exampleStartedGame.get('name');
			const winnerName = exampleStartedGame.getIn(['submittedPlays', 0, 'player']);

			expect(() => Game.decideWinner(state, playerName, gameName, winnerName)).to.throw();
		});

		it('throws an error when the winner has not submitted a play', function () {
			const state = Map({
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			});
			const playerName = exampleStartedGame.get('decider');
			const gameName = exampleStartedGame.get('name');
			const winnerName = exampleStartedGame.get('players').keySeq().get(2);

			expect(() => Game.decideWinner(state, playerName, gameName, winnerName)).to.throw();
		});

		it('throws an error if the game doesn\'t exist.', function () {
			const state = Map({
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			});
			const playerName = exampleStartedGame.get('decider');
			const gameName = exampleStartedGame.get('name') + 'DIFFERENT';
			const winnerName = exampleStartedGame.getIn(['submittedPlays', 0, 'player']);

			expect(() => Game.decideWinner(state, playerName, gameName, winnerName)).to.throw();
		});

	});

	describe('nextRound', function () {

		it('sets the currentSituation to a new situation card dealt from the situation deck', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			})
			const playerName = exampleStartedGame.get('host');
			const gameName = exampleStartedGame.get('name');
			const originalSituation = exampleStartedGame.get('current_situation');
			const nextState = Game.nextRound(state, playerName, gameName);

			expect(nextState.hasIn(['games', exampleStartedGame.get('name'), 'current_situation'])).to.equal(true);
			expect(nextState.getIn(['games', exampleStartedGame.get('name'), 'current_situation'])).to.not.equal(originalSituation);
		});

		it('reinitializes the situation deck if there are no more cards left', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleStartedGameWithDepletedDecks.get('name')]: exampleStartedGameWithDepletedDecks
				})
			})
			const playerName = exampleStartedGameWithDepletedDecks.get('host');
			const gameName = exampleStartedGameWithDepletedDecks.get('name');
			const nextState = Game.nextRound(state, playerName, gameName);

			const newDeck = nextState.getIn(['games', exampleStartedGameWithDepletedDecks.get('name'), 'decks', 'situation']);
			expect(newDeck.size).to.equal(exampleCardsByType.get('situation').size - 1);
		});

		it('sets the decider to the next player', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			})
			const playerName = exampleStartedGame.get('host');
			const gameName = exampleStartedGame.get('name');
			const originalDecider = exampleStartedGame.get('decider');
			const nextState = Game.nextRound(state, playerName, gameName);

			const newDecider = nextState.getIn(['games', exampleStartedGame.get('name'), 'decider']);
			const players = nextState.getIn(['games', exampleStartedGame.get('name'), 'players']).keySeq();
			expect(newDecider).to.not.be.undefined;
			expect(newDecider).to.not.equal(originalDecider);
			expect(players.includes(newDecider)).to.equal(true);
		});

		it('removes the submittedPlays from the game state', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			})
			const playerName = exampleStartedGame.get('host');
			const gameName = exampleStartedGame.get('name');
			const nextState = Game.nextRound(state, playerName, gameName);

			expect(nextState.hasIn(['games', exampleStartedGame.get('name'), 'submittedPlays'])).to.equal(false);
		});

		it('throws an error if someone who isn\'t the game host tries to call the next round', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			})
			const playerName = exampleStartedGame.get('host') + 'DIFFERENT';
			const gameName = exampleStartedGame.get('name');
			
			expect(() => Game.nextRound(state, playerName, gameName)).to.throw();
		});

		it('throws an error if the game doesn\'t exist.', function () {
			const state = Map({
				cardTypes: exampleCardTypes,
				cards: exampleCards,
				games: Map({
					[exampleStartedGame.get('name')]: exampleStartedGame
				})
			})
			const playerName = exampleStartedGame.get('host');
			const gameName = exampleStartedGame.get('name') + 'DIFFERENT';
			
			expect(() => Game.nextRound(state, playerName, gameName)).to.throw();
		});

	});

});