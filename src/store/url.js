/**
 * Track the principal parts of the GUI's state in the URL.
 */

import * as uiActions from "./ui";

/**
 * Convert a redux state into a URL.
 */
const stateToUrl = (state) => {
	const type = state.ui.mode.toLowerCase();
	const path = encodeURI(state.ui.path);
	return `#${type}=${path}`;
};

const urlRegex = /#(value|directory)=(.*)/;

/**
 * Convert a URL into an array of redux actions which will transform the state
 * to match the content of the URL.
 */
const urlToActions = (state, url) => {
	const match = urlRegex.exec(url);
	if (!match) {
		return null;
	}
	
	const [_, type, encodedPath] = match;
	let path = decodeURI(encodedPath);
	
	const actions = [];
	
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
 *     ...#<type>=<path>
 *
 * Where `<type>` is one of 'value' or 'directory' and <path> is the Qth path,
 * URI-encoded (not URI-Component encoded).
 *
 * If the state changes,the URL will be modified to match, pushing the state
 * into the browser history. If the URL changes, the state will be updated to
 * match.
 */
const lockStateAndUrl = (store) => {
	// Update the URL when state changes
	store.subscribe(() => updateURLToMatchState(store));
	
	// Update state in response to URL changes
	window.addEventListener("hashchange", () => updateStateToMatchURL(store));
}

export default lockStateAndUrl;
