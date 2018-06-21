/**
 * Track the principal parts of the GUI's state in the URL.
 */

import * as qthActions from "./qth";
import * as uiActions from "./ui";

/**
 * Convert a redux state into a URL.
 */
const stateToUrl = (state) => {
	const host = encodeURIComponent(state.qth.host);
	const type = state.ui.mode.toLowerCase();
	const path = encodeURI(state.ui.path);
	return `#${host}?${type}=${path}`;
};

const urlRegex = /#([-A-Za-z0-9_.!~*'()%]+)[?](value|directory)=(.*)/;

/**
 * Convert a URL into an array of redux actions which will transform the state
 * to match the content of the URL.
 */
const urlToActions = (state, url) => {
	const match = urlRegex.exec(url);
	if (!match) {
		return null;
	}
	
	const [_, encodedHost, type, encodedPath] = match;
	const host = decodeURIComponent(encodedHost);
	let path = decodeURI(encodedPath);
	
	const actions = [];
	
	if (host != state.qth.host) {
		actions.push(qthActions.connect(host));
	}
	
	if (type != state.ui.mode.toLowerCase() || path != state.ui.path) {
		if (type === "value") {
			actions.push(uiActions.showValue(path));
		} else if (type === "directory") {
			// Sanitise directories
			if (!(path === "" || path.endsWith("/"))) {
				path = `${path}/`;
			}
			actions.push(uiActions.showDirectory(path));
		}
	}
	
	return actions;
};

/**
 * Push a new history location to match the current store state (if the URL
 * needs to change).
 */
const updateURLToMatchState = (store) => {
	const state = store.getState();
	
	const targetUrl = stateToUrl(state);
	const actualUrl = window.location.hash;
	
	if (targetUrl !== actualUrl) {
		window.history.pushState(null, "", targetUrl);
	}
}

/**
 * Push modify the state to match the current URL. If the URL is not a valid
 * state, updateURLToMatchState will be called.
 */
const updateStateToMatchURL = (store) => {
	const state = store.getState();
	const url = window.location.hash;
	
	const actions = urlToActions(state, url);
	if (actions) {
		for (const action of actions) {
			store.dispatch(action);
		}
	} else {
		// Invalid URL, overwrite it with the current state
		updateURLToMatchState(store);
	}
}

/**
 * Lock the hash-part of the page URL to the most important parts of the state.
 * Specifically, URLs will be produced with the following format:
 *
 *     ...#<server-name>?<type>=<path>
 *
 * Where `<server-name>` is the websocket URL for the Qth server, URI-Component
 * Encoded, `<type>` is one of 'value' or 'directory' and <path> is the Qth
 * path, URI-encoded (not URI-Component encoded).
 *
 * If the state changes,the URL will be modified to match, pushing the state
 * into the browser history. If the URL changes, the state will be updated to
 * match.
 */
const lockStateAndUrl = (store) => {
	// Update the URL when state changes
	store.subscribe(() => updateURLToMatchState(store));
	
	// Update state in response to URL change
	window.addEventListener("hashchange", () => updateStateToMatchURL(store));
	
	// Initially go where the URL tells us
	updateStateToMatchURL(store);
}

export default lockStateAndUrl;
