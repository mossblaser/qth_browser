/**
 * The UI-state Redux store.
 *
 * The reducer and actions exported by this module provide state storage for
 * all UI related activity. The store is organised as below an expects to live
 * in 'ui' in the top-level Redux store.
 *
 * ui: {
 *   // The path being displayed. Start at the root
 *   path: "",
 *   // During the latest UI interaction did we ascend or descend the logical
 *   // heirarchy? ("ASCEND" if went from, e.g. foo/bar/ to foo/, "DESCEND" if
 *   // went from foo/ to foo/bar/)
 *   hierarchyDirection: "DIRECTORY",
 *   // What type of display is open. One of 'DIRECTORY' or 'VALUE'.
 *   mode: "DIRECTORY",
 *   // A least-recently-used cache of property and event values set/sent by
 *   // the client. Most recently used first. Populated by snooping on Qth
 *   // actions.
 *   recentPropertyValues: [value, ...],
 *   recentEventValues: [value, ...],
 *   // Is the menu visible?
 *   menuVisible: false,
 * }
 */




import ui from "./reducer";
export default ui;

export * from "./actions";

