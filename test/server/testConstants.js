import {List, Map, fromJS} from 'immutable';

export const emptyState = Map();
export const expectedNounsInHand = 4;
export const expectedVerbsInHand = 4;
export const randomizeTries = 5;
export const plainJSCardTypes = {
	noun: {
		playable: true
	},
	verb: {
		playable: true
	},
	situation: {
		playable: false
	}
};
export const plainJSCardsByType = {
	noun: [{
		type: 'noun',
		text: 'wonder paste',
		slots: []
	},
	{
		type: 'noun',
		text: 'an interesting item',
		slots: []
	},
	{
		type: 'noun',
		text: 'thoughts concerning thoughts',
		slots: []
	},
	{
		type: 'noun',
		text: 'a soviet muscle man',
		slots: []
	},
	{
		type: 'noun',
		text: 'a paranormal bromance',
		slots: []
	}],
	verb: [{
		type: 'verb',
		text: 'waking up []',
		slots: ['noun']
	},
	{
		type: 'verb',
		text: 'having a good laugh',
		slots: []
	},
	{
		type: 'verb',
		text: 'throwing everything out',
		slots: []
	},
	{
		type: 'verb',
		text: 'getting extremely hype',
		slots: []
	},
	{
		type: 'verb',
		text: 'hoofing it to your next destination because your car won\'t start',
		slots: []
	}],
	situation: [{
		type: 'situation',
		text: 'Give fuel, give me fire! Give me []',
		slots: ['noun']
	},
	{
		type: 'situation',
		text: 'Before Luke Skywalker showed up, the Rebels\' only strategy had been []',
		slots: ['verb']
	},
	{
		type: 'situation',
		text: '[] #FABULOUS',
		slots: ['any']
	},
	{
		type: 'situation',
		text: 'What\'s wrong with []? I\'ll tell you: it\'s because I\'m tired of putting up with [] all the time.',
		slots: ['any', 'verb']
	},
	{
		type: 'situation',
		text: 'The department of Quality Services regrets to inform you that your request for [] has been approved.',
		slots: ['any']
	}]
};
export const plainJSExampleCards = [
	...(plainJSCardsByType.noun), 
	...(plainJSCardsByType.verb), 
	...(plainJSCardsByType.situation)
];
export const plainJSExampleHand = [
	...(plainJSCardsByType.noun.slice(0, expectedNounsInHand)), 
	...(plainJSCardsByType.verb.slice(0, expectedVerbsInHand))
];
export const exampleHand = fromJS(plainJSExampleHand);
export const exampleCards = fromJS(plainJSExampleCards);
export const exampleCardsByType = fromJS(plainJSCardsByType);
export const exampleCardTypes = fromJS(plainJSCardTypes);
export const exampleLonePlayer = 'LoneWolf1';
export const exampleDifferentLonePlayer = 'AnotherLoneWolf';
export const examplePlayers = List.of('player1', 'player2'); // Must be length of at least 2.
export const exampleNewGame = fromJS({
	name: 'Epicus',
	started: false,
	host: 'EpicHost',
	players: {
		EpicHost: {}
	}
});
export const exampleNewGameWithPassword = fromJS({
	name: 'Secret Stuff',
	started: false,
	host: 'SecretHost',
	players: {
		SecretHost: {}
	},
	password: 'secret'
});
export const exampleNewGameReadyToStart = fromJS({
	name: 'Super Ready',
	started: false,
	host: 'SpaceGhost',
	players: {
		SpaceGhost: {},
		BugGuy: {} // player at position 1 is expected not to be the host.
	}
});
export const exampleStartedGame = fromJS({
	name: 'Getting Started',
	started: true,
	host: 'selfStarter',
	decider: 'selfStarter',
	winnerOfLastRound: 'selfStarter',
	currentSituation: plainJSCardsByType.situation[0],
	players: {
		selfStarter: {
			score: 0,
			cards: plainJSExampleHand
		},
		duoStarter: {
			score: 0,
			cards: plainJSExampleHand
		},
		trioStarter: {
			score: 0,
			cards: plainJSExampleHand
		}
	},
	submittedPlays: [{
		player: 'duoStarter',
		'cardsSubmitted': [plainJSCardsByType.noun[0]]
	}],
	decks: {
		noun: plainJSCardsByType.noun,
		verb: plainJSCardsByType.verb,
		situation: plainJSCardsByType.situation
	}
});
export const exampleStartedGameWithTwoPlayers = fromJS({
	name: 'Getting Started II the Sequel',
	started: true,
	host: 'selfStarter2',
	decider: 'selfStarter2',
	winnerOfLastRound: 'selfStarter2',
	currentSituation: plainJSCardsByType.situation[0],
	players: {
		selfStarter2: {
			score: 0,
			cards: plainJSExampleHand
		},
		duoStarter2: {
			score: 0,
			cards: plainJSExampleHand
		}
	},
	submittedPlays: [{
		player: 'duoStarter2',
		'cardsSubmitted': [plainJSCardsByType.noun[0]]
	}],
	decks: {
		noun: plainJSCardsByType.noun,
		verb: plainJSCardsByType.verb,
		situation: plainJSCardsByType.situation
	}
});