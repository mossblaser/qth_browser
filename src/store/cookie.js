/**
 * Track the Qth hostname in a cookie.
 */

import * as qthActions from "./qth";

/**
 * Store the current host in a cookie.
 */
const updateCookie = (host) => {
	if (host !== null) {
		document.cookie = `qthHost=${encodeURIComponent(host)}; expires=Fri, 31 Dec 9999 23:59:59 GMT`;
	} else {
		// Delete cookie to represent 'null'
		document.cookie = "qthHost=; max-age=0";
	}
}

const cookieRegex = /(?:^|;)qthHost=([^;]*)(?:;|$)/;

/**
 * Load the host from a cookie (if available).
 */
const readCookie = () => {
	const match = cookieRegex.exec(document.cookie);
	if (match) {
		const host = decodeURIComponent(match[1]);
		return host;
	} else {
		return null;
	}
}


/**
 * Lock the 'qthHost' cookie to the qth hostname. When this function is first
 * called, the cookie will be read and a connect action dispatched accordingly.
 */
const lockStateAndCookie = (store) => {
	const cookieHost = readCookie();
	if (cookieHost !== null) {
		store.dispatch(qthActions.connect(cookieHost));
	}
};

export default lockStateAndCookie;
