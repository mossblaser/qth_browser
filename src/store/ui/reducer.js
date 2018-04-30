const initialState = {
	path: "",
	hierarchyDirection: "DESCEND",
	mode: "DIRECTORY",
};

const ui = (state=initialState, action={}) => {
	switch (action.type) {
		case "SHOW_DIRECTORY":
			let hierarchyDirection;
			if (state.mode == "DIRECTORY") {
				if (state.path.startsWith(action.path)) {
					hierarchyDirection = "ASCEND";
				} else {
					hierarchyDirection = "DESCEND";
				}
			} else {
				// If not already in the directory view we're reascending into it
				hierarchyDirection = "ASCEND";
			}
			
			return {
				...state,
				path: action.path,
				mode: "DIRECTORY",
				hierarchyDirection,
			};
		
		case "SHOW_VALUE":
			return {
				...state,
				path: action.path,
				mode: "VALUE",
				hierarchyDirection: "DESCEND",
			};
		
		default:
			return state;
	};
}

export default ui;
