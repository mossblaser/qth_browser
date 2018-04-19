import {createStore, applyMiddleware} from "redux";
import ReduxThunk from "redux-thunk";

import React, { Component } from "react";
import ReactDOM from "react-dom";

import {Provider, connect} from "react-redux";

import * as actions from "./actions";

import qth from "./reducers";


const store = createStore(qth, applyMiddleware(ReduxThunk));

class Root extends Component {
	constructor(props) {
		super(props);
	}
	
	render() {
		return <div onClick={this.props.onClick}>
			Hello! Connected: {JSON.stringify(this.props.connected)}
		</div>;
	}
}
Root = connect(
	state => ({
		connected: state.connected,
	}),
	dispatch => ({
		onClick: () => dispatch(actions.connect("ws://localhost:8080")),
	}),
)(Root);

ReactDOM.render(
	<Provider store={store}>
		<Root />
	</Provider>,
	document.getElementById("root")
);
