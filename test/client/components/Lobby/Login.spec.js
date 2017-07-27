import React from 'react';
import {shallow} from 'enzyme';
import {expect} from 'chai';
import {emptyFunction} from '../../testConstants';
import Login from '../../../../src/client/components/Lobby/Login';

describe('Login Component', function () {

	it('renders a textbox', function () {
		const component = shallow(<Login login={emptyFunction} />);
		const textboxes = component.find('input[type="text"]');

		expect(textboxes.length).to.equal(1);
	});

});