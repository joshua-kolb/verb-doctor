import jsdom from 'jsdom';
import chai from 'chai';
import chaiImmutable from 'chai-immutable';

global.window = new jsdom.JSDOM('<!DOCTYPE html><html><body></body></html>').window;
global.document = window.document;

Object.keys(window).forEach((key) => {
	if (!(key in global)) {
		global[key] = window[key];
	}
});

chai.use(chaiImmutable);