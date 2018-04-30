import React, { Component } from "react";
import ReactDOM from "react-dom";

import {createStore, applyMiddleware} from "redux";
import ReduxThunk from "redux-thunk";
import {Provider, connect} from "react-redux";
import reducer, {qth_actions, ui_actions} from "./store/index.js";

import "./index.less";

import {AppBar, AppBarElement} from "./presentation/AppBar/index.jsx";
import BreadcrumbBar from "./presentation/BreadcrumbBar/index.jsx";
import EnterLeaveAnimation from "./presentation/EnterLeaveAnimation/index.jsx";

import DirectoryListing from "./container/DirectoryListing/index.jsx";

import MdMenu from "react-icons/lib/md/menu";


let Root = ({path, showDirectory, hierarchyDirection}) => {
	return <div className="Root">
		<AppBar>
			<AppBarElement>
				<MdMenu size={24} />
			</AppBarElement>
			<AppBarElement>
				<BreadcrumbBar path={path} isDirectory onClick={showDirectory} />
			</AppBarElement>
		</AppBar>
		
		<EnterLeaveAnimation go={hierarchyDirection === "ASCEND"
		                         ?  "right" : "left" }>
			<DirectoryListing
				key={path}
				path={path}
				onValueClick={path => console.log("Value:", path)}
				onDirectoryClick={showDirectory}
			/>
		</EnterLeaveAnimation>
	</div>;
};
Root = connect(
	state => ({
		path: state.ui.path,
		hierarchyDirection: state.ui.hierarchyDirection,
	}),
	dispatch => ({
		showDirectory: path => dispatch(ui_actions.showDirectory(path)),
	}),
)(Root);

const store = createStore(reducer, applyMiddleware(ReduxThunk));
store.dispatch(qth_actions.connect("ws://localhost:8080/"));

ReactDOM.render(
	<Provider store={store}>
		<Root />
	</Provider>,
	document.getElementById("root")
);
