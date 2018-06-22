import Client from "qth";

import {allSubdirectories, containsEvent, containsProperty} from "../../qth_utils.js";

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
 * Connect to a new Qth server. Takes the URL of the server in the same format
 * as Qth.js.
 */
export const connect = url => (dispatch, getState) => {
  const setupNewClient = () => {
    let client;
    try {
      client = new Client(url);
    } catch(err) {
      dispatch(connecting(url, null));
      console.error(err);
      return;
    }
    
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
 * Start monitoring a given directory.
 *
 * This actually subscribes to the directory and all parent directories (updating
 * the 'directories' dictionary).
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
 * Stop monitoring a given directory (and all of its parent directories).
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

