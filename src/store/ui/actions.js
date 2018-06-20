/**
 * Show the main menu
 */
export const showMenu = () => ({
	type: "SHOW_MENU",
});

/**
 * Hide the main menu
 */
export const hideMenu = () => ({
	type: "HIDE_MENU",
});

/**
 * Setup the main UI to show a directory listing for the given path.
 */
export const showDirectory = path => ({
	type: "SHOW_DIRECTORY",
	path,
});

/**
 * Setup the main UI to show a Qth value at a particular path.
 */
export const showValue = path => ({
	type: "SHOW_VALUE",
	path,
});
