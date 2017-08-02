export default send => store => next => action => {
	if (action.meta && action.meta.remote && !action.meta.fromServer) {
		send(JSON.stringify(action));
	}
	return next(action);
}