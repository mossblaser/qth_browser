/**
 * A graphical Qth browser.
 */

import React, { Component } from "react";
import ReactDOM from "react-dom";

import {createStore, applyMiddleware} from "redux";
import ReduxThunk from "redux-thunk";
import {Provider, connect} from "react-redux";
import reducer, {qthActions, uiActions, lockStateAndUrl, lockStateAndCookie} from "./store/index.js";

import "./index.less";

import {AppBar, AppBarElement, AppBarButton} from "./presentation/AppBar/index.jsx";
import {OverlayMenu, OverlayMenuHeader, OverlayMenuEntry} from "./presentation/OverlayMenu/index.jsx";
import BreadcrumbBar from "./presentation/BreadcrumbBar/index.jsx";
import EnterLeaveAnimation from "./presentation/EnterLeaveAnimation/index.jsx";
import ErrorMessage from "./presentation/ErrorMessage/index.jsx";
import Button from "./presentation/Button/index.jsx";

import DirectoryListing from "./container/DirectoryListing/index.jsx";
import ValueListing from "./container/ValueListing/index.jsx";

import MdMenu from "react-icons/lib/md/menu";

let Root = ({path, uiMode, menuVisible, qthHost,
             showMenu, hideMenu, showDirectory, showValue, hierarchyDirection,
             connect, disconnect}) => {
	const connectToServerClicked = () => {
		const host = prompt("Enter server Websocket URL", qthHost || "ws://");
		if (host !== null) {
			connect(host);
		}
	};
	const goToDirectoryClicked = () => {
		let selectedPath = path || "";
		while (true) {
			selectedPath = prompt("Enter directory path", selectedPath);
			if (selectedPath === null) {
				return;
			}
			if (!(selectedPath === "" || selectedPath.endsWith("/"))) {
				alert("Directory paths must be empty or end with a '/'");
				continue;
			}
			
			showDirectory(selectedPath);
			return;
		}
	};
	const goToValueClicked = () => {
		const selectedPath = prompt("Enter directory path", path || "");;
		if (selectedPath !== null) {
			showValue(selectedPath);
		}
	};
	
	let body;
	if (qthHost === null) {
		body = <ErrorMessage>
			<p>No Qth host selected.</p>
			<Button onClick={connectToServerClicked}>Connect</Button>
		</ErrorMessage>;
	} else if (uiMode == "DIRECTORY") {
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
		<OverlayMenu
			visible={menuVisible}
			onDismiss={hideMenu}
		>
			<OverlayMenuHeader onClick={hideMenu}>Qth</OverlayMenuHeader>
			<OverlayMenuEntry onClick={connectToServerClicked}>Connect to server</OverlayMenuEntry>
			<OverlayMenuEntry onClick={disconnect}>Disconnect</OverlayMenuEntry>
			<OverlayMenuEntry onClick={goToDirectoryClicked}>Go to directory</OverlayMenuEntry>
			<OverlayMenuEntry onClick={goToValueClicked}>Go to value</OverlayMenuEntry>
		</OverlayMenu>
		
		<AppBar>
			<AppBarButton onClick={showMenu}>
				<MdMenu size={24} />
			</AppBarButton>
			<AppBarElement>
				<BreadcrumbBar path={path}
				               isDirectory={uiMode === "DIRECTORY"}
				               onClick={showDirectory} />
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
		menuVisible: state.ui.menuVisible,
		qthHost: state.qth.host,
	}),
	dispatch => ({
		showMenu: () => dispatch(uiActions.showMenu()),
		hideMenu: () => dispatch(uiActions.hideMenu()),
		showDirectory: path => dispatch(uiActions.showDirectory(path)),
		showValue: path => dispatch(uiActions.showValue(path)),
		connect: (host) => dispatch(qthActions.connect(host)),
		disconnect: (host) => dispatch(qthActions.connect(null)),
	}),
)(Root);

const store = createStore(reducer, applyMiddleware(ReduxThunk));
lockStateAndUrl(store);
lockStateAndCookie(store);

// Set the window title to match the current state
store.subscribe(() => {
	let path = store.getState().ui.path;
	if (path === "") {
		document.title = "Qth";
	} else {
		document.title = `${path} - Qth`;
	}
});

ReactDOM.render(
	<Provider store={store}>
		<Root />
	</Provider>,
	document.getElementById("root")
);
