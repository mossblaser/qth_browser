import Client from "qth";

import {
  enteringDirectory,
  leavingDirectory,
  updateDirectory,
  incrementWatchEventRefcount,
  decrementWatchEventRefcount,
  updateEvent,
  incrementWatchPropertyRefcount,
  decrementWatchPropertyRefcount,
  updateProperty,
  sendingEvent,
  settingProperty,
  deletingProperty,
  eventOrPropertyChangeComplete,
  registeringPath,
  unregisteringPath,
  connecting,
  connected,
  disconnected,
} from "./actions";

/**
 * Internal. Does a directory contents listing contain an event?
 */
const containsEvent = entries =>
  entries &&
  entries.some(({behaviour}) => behaviour.startsWith("EVENT-"));

/**
 * Internal. Does a directory contents listing contain a property?
 */
const containsProperty = entries =>
  entries &&
  entries.some(({behaviour}) => behaviour.startsWith("PROPERTY-"));

/**
 * Connect to a new Qth server. Takes the URL of the server in the same format
 * as Qth.js.
 */
export const connect = url => (dispatch, getState) => {
  const setupNewClient = () => {
    const client = new Client(url);
    
    // Subscribe to state change notifications
    client.on("connect", () => dispatch(connected()));
    client.on("offline", () => dispatch(disconnected()));
    
    // Create callbacks for directory, event and property watching (these need
    // to be kept so we can unregister them when required and must relate to
    // this specific client).
    // XXX: As a dirty hack we store them in the client object (so that we have
    // somewhere to keep them).
    client.$$onDirectoryUpdate = (metaLsPath, contents) => {
      const stateBefore = getState().qth;
      
      const path = metaLsPath.slice("meta/ls/".length);
      dispatch(updateDirectory(path, contents));
      
      // Update value watches (NB: this if statement should never be false
      // since updates shouldn't be arriving for non-watched directories
      // however it could occur if callbacks from Qth are badly delayed).
      if (stateBefore.directories.hasOwnProperty(path) &&
          stateBefore.directories[path].refcount > 0) {
        // NB: contents may become undefined if the directory is deleted
        contents = contents || {};
        const contentsBefore = stateBefore.directories[path].contents || {};
        
        const propertiesBefore = new Set();
        const eventsBefore = new Set();
        for (const [name, entries] of Object.entries(contentsBefore)) {
          if (containsEvent(entries)) {
            eventsBefore.add(name);
          }
          if (containsProperty(entries)) {
            propertiesBefore.add(name);
          }
        }
        const propertiesNow = new Set();
        const eventsNow = new Set();
        for (const [name, entries] of Object.entries(contents)) {
          if (containsEvent(entries)) {
            eventsNow.add(name);
          }
          if (containsProperty(entries)) {
            propertiesNow.add(name);
          }
        }
        
        // New entries
        for (const name of eventsNow) {
          if (!eventsBefore.has(name)) {
            dispatch(watchEvent(`${path}${name}`));
          }
        }
        for (const name of propertiesNow) {
          if (!propertiesBefore.has(name)) {
            dispatch(watchProperty(`${path}${name}`));
          }
        }
        
        // Removed entries
        for (const name of eventsBefore) {
          if (!eventsNow.has(name)) {
            dispatch(unwatchEvent(`${path}${name}`));
          }
        }
        for (const name of propertiesBefore) {
          if (!propertiesNow.has(name)) {
            dispatch(unwatchProperty(`${path}${name}`));
          }
        }
      }
    };
    client.$$onEventUpdate = (path, value) => {
      dispatch(updateEvent(path, value));
    };
    client.$$onPropertyUpdate = (path, value) => {
      dispatch(updateProperty(path, value));
    };
    
    // Reinstate subscriptions for watching directories
    const state = getState().qth;
    for (const [path, {refcount}] of Object.entries(state.directories)) {
      if (refcount > 0) {
        client.watchProperty(`meta/ls/${path}`, client.$$onDirectoryUpdate);
      }
    }
    
    // Reinstate value subscriptions
    for (const [path, {refcount}] of Object.entries(state.events)) {
      if (refcount > 0) {
        client.watchEvent(path, client.$$onEventUpdate);
      }
    }
    for (const [path, {refcount}] of Object.entries(state.properties)) {
      if (refcount > 0) {
        client.watchProperty(path, client.$$onPropertyUpdate);
      }
    }
    
    // Reinstate registrations
    for (const [path, {behaviour, description, ...options}] of Object.entries(state.registrations)) {
      client.register(path, behaviour, description, options);
    }
    dispatch(connecting(url, client));
  };
  
  // Disconnect old client (if present) before setting up the new one
  const oldClient = getState().qth.client;
  if (oldClient) {
    oldClient.end(true, setupNewClient);
  } else {
    setupNewClient();
  }
};


/**
 * Internal function: get the refcount of a particular event or property from
 * the 'directories', 'events' or 'properties' dictionary.
 */
const getRefcount = (path, values) => {
  if (values[path]) {
    return values[path].refcount || 0;
  } else {
    return 0;
  }
};

/**
 * Internal generator: Generate all of the subdirectories and containing
 * directory of a given path.
 *
 * E.g. given a Qth path, e.g. "foo/bar/baz", generates "", "foo/" and
 * "foo/bar/" or given "foo/bar/" generates the same.
 */
function* allSubdirectories(path) {
  yield "";
  
  const parts = path.split("/");
  let curPath = "";
  for (let i = 0; i < parts.length - 1; i++) {
    curPath += parts[i] + "/";
    yield curPath;
  }
}

/**
 * Start monitoring a given directory.
 *
 * This actually subscribes to potentially a large number of endpoints.
 * Firstly, it subscribes to the directory and all parent directories (updating
 * the 'directories' dictionary).  Secondly it also subscribes to all values
 * within that directory. These value subscriptions appear in 'events' and
 * 'properties' accordingly. Using this collection of subscriptions the full
 * directory tree up to the provided directory can be validated. Additionally,
 * all values can be displayed once known.
 */
export const enterDirectory = path => (dispatch, getState) => {
  const state = getState().qth;
  
  for (const subpath of allSubdirectories(path)) {
    dispatch(enteringDirectory(subpath));
    if (getRefcount(subpath, state.directories) == 0 && state.client) {
      state.client.watchProperty(`meta/ls/${subpath}`, state.client.$$onDirectoryUpdate);
    }
  }
};

/**
 * Stop monitoring a given directory (and all of its parent directories and
 * values).
 */
export const leaveDirectory = path => (dispatch, getState) => {
  const state = getState().qth;
  
  // Unwatch directories
  for (const subpath of allSubdirectories(path)) {
    dispatch(leavingDirectory(subpath));
    if (getRefcount(subpath, state.directories) == 1 && state.client) {
      state.client.unwatchProperty(`meta/ls/${subpath}`, state.client.$$onDirectoryUpdate);
    }
  }
  
  // Unwatch any events/properties in this directory
  if (getRefcount(path, state.directories) == 1 && state.client) {
    for (const [name, entries] of Object.entries(state.directories[path].contents || {})) {
      if (containsEvent(entries)) {
        dispatch(unwatchEvent(`${path}${name}`));
      }
      if (containsProperty(entries)) {
        dispatch(unwatchProperty(`${path}${name}`));
      }
    }
  }
};

/**
 * Watch the Qth property at the supplied path, adding a new entry in
 * 'properties'.
 */
export const watchProperty = path => (dispatch, getState) => {
  const state = getState().qth;
  dispatch(incrementWatchPropertyRefcount(path));
  
  if (getRefcount(path, state.properties) == 0 && state.client) {
    state.client.watchProperty(path, state.client.$$onPropertyUpdate);
  }
}

/**
 * Unwatch the Qth property at the supplied path, possibly invalidating the
 * entry in 'properties'.
 */
export const unwatchProperty = path => (dispatch, getState) => {
  const state = getState().qth;
  dispatch(decrementWatchPropertyRefcount(path));
  
  if (getRefcount(path, state.properties) == 1 && state.client) {
    state.client.unwatchProperty(path, state.client.$$onPropertyUpdate);
  }
}

/**
 * Watch the Qth event at the supplied path, adding a new entry in
 * 'events'.
 */
export const watchEvent = path => (dispatch, getState) => {
  const state = getState().qth;
  dispatch(incrementWatchEventRefcount(path));
  if (getRefcount(path, state.events) == 0 && state.client) {
    state.client.watchEvent(path, state.client.$$onEventUpdate);
  }
}

/**
 * Unwatch the Qth event at the supplied path, possibly invalidating the
 * entry in 'events'.
 */
export const unwatchEvent = path => (dispatch, getState) => {
  const state = getState().qth;
  dispatch(decrementWatchEventRefcount(path));
  
  if (getRefcount(path, state.events) == 1 && state.client) {
    state.client.unwatchEvent(path, state.client.$$onEventUpdate);
  }
};

/**
 * Send an event to the specified path with the supplied JSON-serialiseable
 * value. Status will be reported in 'pendingActions.send'.
 */
export const sendEvent = (path, value=null) => (dispatch, getState) => {
  const state = getState().qth;
  if (state.client) {
    dispatch(sendingEvent(path, value));
    state.client.sendEvent(path, value)
      .then(() => { dispatch(eventOrPropertyChangeComplete(path)) })
      .catch(() => { dispatch(eventOrPropertyChangeComplete(path)) });
  }
};

/**
 * Set the property at the specified path with the supplied JSON-serialiseable
 * value. Status will be reported in 'pendingActions.set'.
 */
export const setProperty = (path, value) => (dispatch, getState) => {
  const state = getState().qth;
  if (state.client) {
    dispatch(settingProperty(path, value));
    state.client.setProperty(path, value)
      .then(() => { dispatch(eventOrPropertyChangeComplete(path)) })
      .catch(() => { dispatch(eventOrPropertyChangeComplete(path)) });
  }
};

/**
 * Delete property at the specified path. Status will be reported in
 * 'pendingActions.delete'.
 */
export const deleteProperty = path => (dispatch, getState) => {
  const state = getState().qth;
  if (state.client) {
    dispatch(deletingProperty(path));
    state.client.deleteProperty(path)
      .then(() => { dispatch(eventOrPropertyChangeComplete(path)) })
      .catch(() => { dispatch(eventOrPropertyChangeComplete(path)) });
  }
};

/**
 * Register/reregister a path with Qth. Accepts the same arguments as Qth.js
 * and update the registration entry in 'registrations'.
 */
export const registerPath = (path, behaviour, description, options={}) => (dispatch, getState) => {
  const state = getState().qth;
  dispatch(registeringPath(path, behaviour, description, options));
  if (state.client) {
    state.client.register(path, behaviour, description, options);
  }
};

/**
 * Unregister a path from Qth. Also updates the registration entry in
 * 'registrations'.
 */
export const unregisterPath = path => (dispatch, getState) => {
  const state = getState().qth;
  dispatch(unregisteringPath(path));
  if (state.client) {
    state.client.unregister(path);
  }
};

