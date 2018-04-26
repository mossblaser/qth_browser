import React, { Component } from "react";
import ReactDOM from "react-dom";

import {createStore, applyMiddleware} from "redux";
import ReduxThunk from "redux-thunk";
import {Provider} from "react-redux";
import reducer, {qth_actions} from "./store/index.js";

import "./index.less";

import {AppBar, AppBarElement} from "./presentation/AppBar/index.jsx";
import DirectoryListing from "./container/DirectoryListing/index.jsx";

import MdMenu from "react-icons/lib/md/menu";


const Root = ({}) => {
	return <div className="Root">
		<AppBar>
			<AppBarElement>
				<MdMenu size={24} />
			</AppBarElement>
			<AppBarElement>
				meta/clients/
			</AppBarElement>
		</AppBar>
		
		<DirectoryListing path="" />
	</div>;
}


const store = createStore(reducer, applyMiddleware(ReduxThunk));
store.dispatch(qth_actions.connect("ws://localhost:8080/"));

ReactDOM.render(
	<Provider store={store}>
		<Root />
	</Provider>,
	document.getElementById("root")
);
