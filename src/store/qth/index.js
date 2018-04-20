/**
 * The Qth-state Redux store.
 *
 * The reducer and actions exported by this module provide state storage for
 * all Qth related activity. The store is organised as below an expects to live
 * in 'qth' in the top-level Redux store.
 *
 *   qth: {
 *     host: "ws://...", // Qth server being used.
 *     client: null, // Current Qth Client object
 *     connected: true, // Current connection state.
 *     directories: { // Directory watchers
 *       "": {
 *         refcount: 1, // Refcount to keep subscription alive.
 *         valid: true,
 *         contents: { Qth directory listing },
 *       },
 *       "foo/": {
 *         refcount: 1,
 *         valid: true, // True if have received data (not necessarily if directory doesn't actually exist. Check parents for this.
 *         contents: { Qth directory listing },
 *       },
 *       "bar/": {
 *         refcount: 0,
 *         valid: false, // False if not subscribed (just caching the value) or if still waiting for contents.
 *         contents: { Qth directory listing },
 *       },
 *     },
 *     events: { // Subscriptions to specific Qth events.
 *       "foo/bar": {
 *         refcount: 1, // Refcount keeps subscription alive. Values remain once 0 for caching purposes.
 *         value: undefined, // Last Qth value received.
 *         lastUpdate: 0, // Timestamp of last value arrival.
 *       },
 *     },
 *     properties: { // Subscriptions to specific Qth properties.
 *       "foo/baz": {
 *         refcount: 1,
 *         value: undefined,
 *         lastUpdate: 0,
 *       },
 *     },
 *     pendingActions: { // All actions (send/set/delete) currently pending.
 *       "foo/bar": {pending: 2, lastValue: 123, lastAction: "set"},
 *     },
 *     registrations: { // Currently active registrations.
 *       "foo/bar": {
 *         behaviour,
 *         description,
 *         ...options,
 *       },
 *     }
 *   };
 */




import qth from "./reducer";
export default qth;

export * from "./async-actions";
