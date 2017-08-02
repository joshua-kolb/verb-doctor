import React, {Component} from 'React';
import PropTypes from 'prop-types';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import {connect} from 'react-redux';
import Actions from '../../redux/actionCreators';

export class Login extends Component {

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

Login.PropTypes = {
	login: PropTypes.func.isRequired
};
Login.mixins = [PureRenderMixin];

export const LoginContainer = connect(
	undefined,
	{login: Actions.login}
)(Login);