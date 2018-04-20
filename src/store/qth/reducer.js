/**
 * Given a 'directories' object from the state, return a new version where
 * every entry has valid: false.
 */
const invalidateAllDirectories = directories => {
  const out = {};
  for (const [path, directory] of Object.entries(directories)) {
    out[path] = {
      ...directory,
      valid: false,
    };
  }
  return out;
};

/**
 * Given an 'events' or 'properties' object from the state, return a new
 * version where every entry has lastUpdate: null.
 */
const invalidateAllValues = values => {
  const out = {};
  for (const [path, value] of Object.entries(values)) {
    out[path] = {
      ...value,
      lastUpdate: null,
    };
  }
  return out;
};

/**
 * Given a path to a Qth value, returns the path of its containing directory.
 * Given a Qth directory, returns the parent directory.
 */
const parentPath = path => {
  if (path.endsWith("/")) {
    path = path.slice(0, path.length-1);
  }
  
  const parts = path.split("/");
  
  parts.splice(parts.length-1, 1);
  if (parts.length > 0 && parts[0].length > 0) {
    return parts.join("/") + "/";
  } else {
    return "";
  }
}

/**
 * Increment the refcount of the specified directory.
 */
const enterDirectory = (path, oldDirectories) => {
  const directories = {...oldDirectories};
  const directory = directories[path] = directories.hasOwnProperty(path)
    ? {...directories[path]}
    : {refcount: 0, valid: false, contents: null};
  directory.refcount++; // NB: Mutating a copy
  
  return directories;
};

/**
 * Decrement the refcount of the specified directory.
 */
const leaveDirectory = (path, oldDirectories) => {
  const directories = {...oldDirectories};
  if (directories.hasOwnProperty(path)) {
    // Decrement refcount
    const refcount = directories[path].refcount - 1;
    
    // Mark as invalid if refcount reaches 0
    const valid = refcount ? directories[path].valid : false;
    
    directories[path] = {
      ...directories[path],
      refcount,
      valid,
    }
  }
  return directories;
};

/**
 * Add a Qth directory listing to a given path, marking that path as valid if
 * its refcount is non-zero.
 */
const updateDirectory = (path, contents, oldDirectories) => {
  if (oldDirectories.hasOwnProperty(path)) {
    return {
      ...oldDirectories,
      [path]: {
        ...(oldDirectories[path] || {}),
        // If result arrives after refcount has reached zero again, don't mark
        // as valid since the subscription has now lapsed
        valid: oldDirectories[path].refcount > 0,
        contents,
      },
    };
  } else {
    // Ignore if this wasn't requested, not worth going to the trouble of
    // caching the result since this shouldn't occur (since we never remove
    // paths).
    return oldDirectories;
  }
};

/**
 * Increment the refcount of the specified value.
 */
const watchValue = (path, oldValues) => {
  const values = {
    ...oldValues,
    [path]: {...(oldValues[path] || {})},
  };
  const value = values[path];
  
  // Add any missing values
  if (!value.hasOwnProperty("refcount")) {
    value.refcount = 0;
  }
  if (!value.hasOwnProperty("lastUpdate")) {
    value.lastUpdate = null;
  }
  
  value.refcount++;
  
  return values;
};

/**
 * Decrement the refcount of the specified value.
 */
const unwatchValue = (path, oldValues) => {
  const values = {
    ...oldValues,
    [path]: {...(oldValues[path] || {})},
  };
  const value = values[path];
  
  // Add any missing values (though there shouldn't be any...)
  if (!value.hasOwnProperty("refcount")) {
    value.refcount = 1;
  }
  
  value.refcount--;
  if (value.refcount == 0) {
    // Mark value as stale once refcount reaches zero as we'll unsubscribe at
    // this point.
    value.lastUpdate = null;
  }
  
  return values;
};

/**
 * Update the contents of the specified value
 */
const updateValue = (path, newValue, timestamp, oldValues) => {
  const values = {
    ...oldValues,
    [path]: {...(oldValues[path] || {})},
  };
  const value = values[path];
  
  // Add any missing values (though there shouldn't be any...)
  if (!value.hasOwnProperty("refcount")) {
    value.refcount = 0;
  }
  value.value = newValue;
  value.lastUpdate = value.refcount > 0 ? timestamp : null;
  
  return values;
};

/**
 * Insert an entry or increment the pending count for a given path in
 * 'pendingActions', logging the value and action used.
 */
const addPendingAction = (path, value, action, oldPendingActions) => {
  const pendingActions = {
    ...oldPendingActions,
    [path]: {...(oldPendingActions[path] || {pending: 0})},
  };
  const pendingAction = pendingActions[path];
  pendingAction.pending++;
  pendingAction.lastValue = value;
  pendingAction.lastAction = action;
  
  return pendingActions;
};

/**
 * Decrement the pending count for a given path in 'pendingActions', removing
 * it entirely if it drops to zero.
 */
const pendingActionComplete = (path, oldPendingActions) => {
  const pendingActions = {
    ...oldPendingActions,
    [path]: {...(oldPendingActions[path] || {pending: 0})},
  };
  const pendingAction = pendingActions[path];
  pendingAction.pending--;
  
  // Remove completed actions
  if (pendingAction.pending <= 0) {
    delete pendingActions[path];
  }
  
  return pendingActions;
};

const initial_state = {
  host: null,
  client: null,
  connected: false,
  directories: {},
  events: {},
  properties: {},
  pendingActions: {},
  registrations: {},
};

/**
 * Reducer for Qth store state.
 */
const qth = (state=initial_state, action={}) => {
  switch (action.type) {
    case "CONNECTING":
      return {
        ...state,
        host: action.url,
        client: action.client,
        connected: false,
        // Keep directory listings in cache but invalidate them since they
        // could easily be different on the new server.
        directories: invalidateAllDirectories(state.directories),
        // Keep events/properties in cache but invalidate them since they could
        // easily be different on the new server.
        events: invalidateAllValues(state.events),
        properties: invalidateAllValues(state.properties),
        // All pending operations will be ignored on new server. (We could keep
        // values here and try sending them to the new server but that will
        // probably just confuse users as if anything stays in this list long
        // enough for the user to try a new connection they've probably long
        // forgotten about them).
        pendingActions: initial_state.pendingActions,
      };
    
    case "CONNECTED":
      return {
        ...state,
        connected: true,
      };
    
    case "DISCONNECTED":
      return {
        ...state,
        connected: false,
        // Invalidate directory listings, events and properties and currently
        // pending commands while disconnected. The pending commands *may*
        // occur anyway but we can't depend on it.
        directories: invalidateAllDirectories(state.directories),
        events: invalidateAllValues(state.events),
        properties: invalidateAllValues(state.properties),
        pendingActions: initial_state.pendingActions,
      };
    
    case "ENTERING_DIRECTORY":
      return {
        ...state,
        directories: enterDirectory(action.path, state.directories),
      };
    case "LEAVING_DIRECTORY":
      return {
        ...state,
        directories: leaveDirectory(action.path, state.directories),
      };
    case "UPDATE_DIRECTORY":
      return {
        ...state,
        directories: updateDirectory(action.path, action.contents, state.directories),
      };
    
    case "INCREMENT_WATCH_EVENT_REFCOUNT":
      return {
        ...state,
        events: watchValue(action.path, state.events),
      };
    case "DECREMENT_WATCH_EVENT_REFCOUNT":
      return {
        ...state,
        events: unwatchValue(action.path, state.events),
      };
    case "UPDATE_EVENT":
      return {
        ...state,
        events: updateValue(action.path, action.value, action.timestamp, state.events),
      };
    
    case "INCREMENT_WATCH_PROPERTY_REFCOUNT":
      return {
        ...state,
        properties: watchValue(action.path, state.properties),
      };
    case "DECREMENT_WATCH_PROPERTY_REFCOUNT":
      return {
        ...state,
        properties: unwatchValue(action.path, state.properties),
      };
    case "UPDATE_PROPERTY":
      return {
        ...state,
        properties: updateValue(action.path, action.value, action.timestamp, state.properties),
      };
    
    case "SENDING_EVENT":
      return {
        ...state,
        pendingActions: addPendingAction(action.path, action.value, "send", state.pendingActions),
      };
    case "SETTING_PROPERTY":
      return {
        ...state,
        pendingActions: addPendingAction(action.path, action.value, "set", state.pendingActions),
      };
    case "DELETING_PROPERTY":
      return {
        ...state,
        pendingActions: addPendingAction(action.path, undefined, "delete", state.pendingActions),
      };
    case "EVENT_OR_PROPERTY_CHANGE_COMPLETE":
      return {
        ...state,
        pendingActions: pendingActionComplete(action.path, state.pendingActions),
      };
    
    case "REGISTERING_PATH":
      return {
        ...state,
        registrations: {
          ...state.registrations,
          [action.path]: {
            behaviour: action.behaviour,
            description: action.description,
            ...action.options,
          },
        },
      };
    case "UNREGISTERING_PATH":
      return {
        ...state,
        registrations: {
          ...state.registrations,
          [action.path]: undefined,
        },
      };
    
    default:
      return state;
  };
};

export default qth;
