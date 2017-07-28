import React from 'react';
import {shallow, mount} from 'enzyme';
import {expect} from 'chai';
import {spy} from 'sinon';
import {emptyFunction} from '../../testConstants';
import Login from '../../../../src/client/components/Lobby/Login';

describe('Login Component', function () {

	it('renders a textbox', function () {
		const component = shallow(<Login />);
		const textboxes = component.find('input[type="text"]');

		expect(textboxes.length).to.equal(1);
	});

	it('renders a submit button', function () {
		const component = shallow(<Login />);
		const buttons = component.find('input[type="submit"]');

		expect(buttons.length).to.equal(1);
	});

	it('calls the login callback with the username when the form is submitted', function () {
		const username = 'Test User';
		const loginSpy = spy();
		const component = shallow(<Login login={loginSpy} />);

		component.find('form').simulate('submit', { target: { username: { value: username } } });

		expect(loginSpy.calledOnce).to.equal(true);
		expect(loginSpy.calledWithExactly(username)).to.equal(true);
	});

});