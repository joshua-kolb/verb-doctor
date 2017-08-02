export default send => (state, action) => {
	switch (action.type) {
		case 'SET_LOBBY_GAMES':
			return state.set('lobbyGames');

		case 'SET_CURRENT_GAME':
			return state.set('currentGame');

		case 'ERROR':
			return state.set('error');
	}
}