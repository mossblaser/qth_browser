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
