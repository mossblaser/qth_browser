const initialState = {
	// The path being displayed. Start at the root
	path: "",
	
	// What type of display is open. One of 'DIRECTORY' or 'VALUE'.
	mode: "DIRECTORY",
};

const ui = (state=initialState, action={}) => {
	switch (action.type) {
		case "SHOW_DIRECTORY":
			return {
				...state,
				path: action.path,
				mode: "DIRECTORY",
			};
		
		case "SHOW_VALUE":
			return {
				...state,
				path: action.path,
				mode: "VALUE",
			};
		
		default:
			return state;
	};
}

export default ui;
