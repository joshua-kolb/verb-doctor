export default class Actions {
	static login(username) {
		return {
			type: 'LOGIN',
			meta: {
				remote: true
			},
			player: username
		}
	}
}