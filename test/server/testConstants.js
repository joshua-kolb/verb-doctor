import {List, Map, fromJS} from 'immutable';

export const plainJSExampleCards = [{
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
},
{
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
},
{
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
}];
export const emptyState = Map();
export const exampleCards = fromJS(plainJSExampleCards);
export const exampleLonePlayer = 'LoneWolf1';
export const examplePlayers = List.of('player1', 'player2');