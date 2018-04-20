/**
 * A new connection is being made (disconnecting from any previous server).
 * The url should be the Qth server URL, the client should be a Qth Client
 * object which has been configured to connect to the server.
 */
export const connecting = (url, client) => ({
  type: 'CONNECTING',
  url,
  client,
});

/**
 * We are now connected to Qth!
 */
export const connected = () => ({
  type: 'CONNECTED',
});

/**
 * We have disconnected from Qth!
 */
export const disconnected = () => ({
  type: 'DISCONNECTED',
});

/**
 * Enter a directory. This will cause a corresponding path to appear in the
 * 'directories' object (if it isn't already present) and the refcount to be
 * incremented.
 */
export const enteringDirectory = path => ({
  type: 'ENTERING_DIRECTORY',
  path,
});

/**
 * Leave a directory. This decrements the associated refcount in 'directories'.
 */
export const leavingDirectory = path => ({
  type: 'LEAVING_DIRECTORY',
  path,
});

/**
 * Update the contents of a directory listing.
 */
export const updateDirectory = (path, contents) => ({
  type: 'UPDATE_DIRECTORY',
  path,
  contents,
});

/**
 * Increment the refcount for a given watched event in 'events'.
 */
export const incrementWatchEventRefcount = path => ({
  type: 'INCREMENT_WATCH_EVENT_REFCOUNT',
  path,
});

/**
 * Stop watching a Qth event. This will cause an object with the specified name
 * to appear in 'events' describing this event.
 */
export const decrementWatchEventRefcount = path => ({
  type: 'DECREMENT_WATCH_EVENT_REFCOUNT',
  path,
});

/**
 * Decrement the refcount for a given watched event in 'events'.
 */
export const updateEvent = (path, value) => ({
  type: 'UPDATE_EVENT',
  path,
  value,
  timestamp: new Date().getTime(),
});

/**
 * Increment the refcount for a given watched property in 'properties'.
 */
export const incrementWatchPropertyRefcount = path => ({
  type: 'INCREMENT_WATCH_PROPERTY_REFCOUNT',
  path,
});

/**
 * Decrement the refcount for a given watched property in 'properties'.
 */
export const decrementWatchPropertyRefcount = path => ({
  type: 'DECREMENT_WATCH_PROPERTY_REFCOUNT',
  path,
});

/**
 * Update the contents of a watched property.
 */
export const updateProperty = (path, value) => ({
  type: 'UPDATE_PROPERTY',
  path,
  value,
  timestamp: new Date().getTime(),
});

/**
 * Indicate that a given event is being sent in pendingActions.send.
 */
export const sendingEvent = (path, value) => ({
  type: 'SENDING_EVENT',
  path,
  value,
});

/**
 * Indicate that a given property is being set in pendingActions.set.
 */
export const settingProperty = (path, value) => ({
  type: 'SETTING_PROPERTY',
  path,
  value,
});

/**
 * Indicate that a given property is being deleted in pendingActions.delete.
 */
export const deletingProperty = path => ({
  type: 'DELETING_PROPERTY',
  path,
});

/**
 * Indicate that a given event or property change (instigated by sendingEvent,
 * settingProperty or deletingProperty has been completed.
 */
export const eventOrPropertyChangeComplete = path => ({
  type: 'EVENT_OR_PROPERTY_CHANGE_COMPLETE',
  path,
});

/**
 * Add/update a Qth registration to 'registrations' (taking the same arguments
 * as Qth.js).
 */
export const registeringPath = (path, behaviour, description, options={}) => ({
  type: 'REGISTERING_PATH',
  path,
  behaviour,
  description,
  options,
});

/**
 * Remove a Qth registration from 'registrations'.
 */
export const unregisteringPath = path => ({
  type: 'UNREGISTERING_PATH',
  path,
});
