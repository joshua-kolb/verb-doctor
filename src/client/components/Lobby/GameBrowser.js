import React, {Component} from 'React';
import PropTypes from 'prop-types';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import {connect} from 'react-redux';
import Actions from '../../redux/actionCreators';

export class GameBrowser extends Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div>
				GameBrowser
			</div>
		);
	}

}

GameBrowser.PropTypes = {
	
};
GameBrowser.mixins = [PureRenderMixin];

export const GameBrowserContainer = connect(
	undefined,
	undefined
)(GameBrowser);