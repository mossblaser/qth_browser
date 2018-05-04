import React, { Component } from "react";
import ReactDOM from "react-dom";

import {createStore, applyMiddleware} from "redux";
import ReduxThunk from "redux-thunk";
import {Provider, connect} from "react-redux";
import reducer, {qthActions, uiActions} from "./store/index.js";

import "./index.less";

import {AppBar, AppBarElement} from "./presentation/AppBar/index.jsx";
import BreadcrumbBar from "./presentation/BreadcrumbBar/index.jsx";
import EnterLeaveAnimation from "./presentation/EnterLeaveAnimation/index.jsx";

import DirectoryListing from "./container/DirectoryListing/index.jsx";
import ValueListing from "./container/ValueListing/index.jsx";

import MdMenu from "react-icons/lib/md/menu";


let Root = ({path, uiMode, showDirectory, showValue, hierarchyDirection}) => {
	let body;
	if (uiMode == "DIRECTORY") {
		body = <DirectoryListing
			key={path}
			path={path}
			onValueClick={showValue}
			onDirectoryClick={showDirectory}
		/>;
	} else if (uiMode == "VALUE") {
		body = <ValueListing
			key={path}
			path={path}
			onValueClick={showValue}
			onDirectoryClick={showDirectory}
		/>;
	}
	
	return <div className="Root">
		<AppBar>
			<AppBarElement>
				<MdMenu size={24} />
			</AppBarElement>
			<AppBarElement>
				<BreadcrumbBar path={path}
				               isDirectory={uiMode === "DIRECTORY"}
				               onClick={newPath => (path !== newPath)
				                         ? showDirectory(newPath)
				                         : null} />
			</AppBarElement>
		</AppBar>
		
		<EnterLeaveAnimation go={hierarchyDirection === "ASCEND"
		                         ?  "right" : "left" }>
			{body}
		</EnterLeaveAnimation>
	</div>;
};
Root = connect(
	state => ({
		path: state.ui.path,
		uiMode: state.ui.mode,
		hierarchyDirection: state.ui.hierarchyDirection,
	}),
	dispatch => ({
		showDirectory: path => dispatch(uiActions.showDirectory(path)),
		showValue: path => dispatch(uiActions.showValue(path)),
	}),
)(Root);

const store = createStore(reducer, applyMiddleware(ReduxThunk));
store.dispatch(qthActions.connect("ws://localhost:8080/"));
store.dispatch(uiActions.showValue("qbs_light"));

ReactDOM.render(
	<Provider store={store}>
		<Root />
	</Provider>,
	document.getElementById("root")
);
