import {createStore, applyMiddleware} from 'redux';
import reducer from './reducer';
import remoteActionMiddleware from './remoteActionMiddleware';

export default function createCustomStore(send) {

	return applyMiddleware(remoteActionMiddleware(send))(createStore)(reducer(send));
}