const NUM_RECENT_VALUES_TO_KEEP = 3;

/**
 * Internal. Update a recent value list with a new value.
 */
const updateRecentValueList = (value, list) => {
	// Move value to head
	const i = list.indexOf(value);
	if (i != 0) {
		// Only copy list if we're going to end up changing it below
		list = [...list];
	}
	if (i > 0) {
		list.splice(i, 1);
	}
	if (i != 0) {
		list.unshift(value);
	}
	
	// Discard excess (NB: If the above step didn't copy+mutate the list the
	// splice call below won't be executed and so no mutation will occur)
	if (list.length > NUM_RECENT_VALUES_TO_KEEP) {
		list.splice(list.length - 1, 1);
	}
	
	return list;
}


const initialState = {
	path: "",
	hierarchyDirection: "DESCEND",
	mode: "DIRECTORY",
	recentPropertyValues: [],
	recentEventValues: [],
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
		
		case "SETTING_PROPERTY":  // NB: A Qth action!
			return {
				...state,
				recentPropertyValues:
					updateRecentValueList(action.value, state.recentPropertyValues)
			};
		case "SENDING_EVENT":  // NB: A Qth action!
			return {
				...state,
				recentEventValues:
					updateRecentValueList(action.value, state.recentEventValues)
			};
		
		default:
			return state;
	};
}

export default ui;
