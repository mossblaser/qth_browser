import React, { Component } from "react";
import ReactDOM from "react-dom";

import {createStore, applyMiddleware} from "redux";
import ReduxThunk from "redux-thunk";
import {Provider} from "react-redux";
import reducer, {qth_actions} from "./store/index.js";

import "./index.less";

import {AppBar, AppBarElement} from "./presentation/AppBar/index.jsx";
import BreadcrumbBar from "./presentation/BreadcrumbBar/index.jsx";
import DirectoryListing from "./container/DirectoryListing/index.jsx";

import MdMenu from "react-icons/lib/md/menu";


const Root = ({}) => {
	return <div className="Root">
		<AppBar>
			<AppBarElement>
				<MdMenu size={24} />
			</AppBarElement>
			<AppBarElement>
				<BreadcrumbBar path="" isDirectory onClick={p=>console.log(p)} />
			</AppBarElement>
		</AppBar>
		
		<DirectoryListing
			path=""
			onValueClick={path => console.log("Value:", path)}
			onDirectoryClick={path => console.log("Directory:", path)}
		/>
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
