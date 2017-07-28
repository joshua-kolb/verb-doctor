import React, {Component} from 'React';

export default class extends Component {

	constructor(props) {
		super(props);
		this.handleFormSubmit = this.handleFormSubmit.bind(this);
	}

	render() {
		return (
			<div>
				<form onSubmit={this.handleFormSubmit}>
					<label>
						Username
						<input type="text" name="username" />
					</label>
					<input type="submit" value="Login" />
				</form>
			</div>
		);
	}

	handleFormSubmit(event) {
		const username = event.target.username.value;
		console.log(event);
		this.props.login(username);
	}

}