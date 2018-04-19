import {createStore, applyMiddleware} from "redux";
import ReduxThunk from "redux-thunk";

import qth from "./reducers";

import Client from "qth";

import {
  // Sync actions
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
  
  // Async actions
  connect,
  enterDirectory,
  leaveDirectory,
  watchEvent,
  unwatchEvent,
  watchProperty,
  unwatchProperty,
  sendEvent,
  setProperty,
  deleteProperty,
  registerPath,
  unregisterPath,
} from "./actions";


// Internal use: Modifies an increment/decrement action to set the time
// to a fixed value.
const fakeTime = (action, timestamp=0) => {
  expect(action.hasOwnProperty("timestamp")).toBeTruthy();
  return {
    ...action,
    timestamp,
  }
};


describe("synchronous actions", () => {
  describe("directory management", () => {
    test("default state is empty", () => {
      let state = qth();
      expect(state.directories).toEqual({});
    });
    
    test("entering/leaving", () => {
      let state = qth();
      
      // Single directory should work
      state = qth(state, enteringDirectory("foo"));
      expect(state.directories).toEqual({
        foo: {refcount: 1, contents: null, valid: false},
      });
      
      // Adding again should increment refcount
      state = qth(state, enteringDirectory("foo"));
      expect(state.directories).toEqual({
        foo: {refcount: 2, contents: null, valid: false},
      });
      
      // Adding a different one should work
      state = qth(state, enteringDirectory("bar"));
      expect(state.directories).toEqual({
        foo: {refcount: 2, contents: null, valid: false},
        bar: {refcount: 1, contents: null, valid: false},
      });
      
      // No auto-parent-adding should be done
      state = qth(state, enteringDirectory("spam/eggs"));
      expect(state.directories).toEqual({
        foo: {refcount: 2, contents: null, valid: false},
        bar: {refcount: 1, contents: null, valid: false},
        "spam/eggs": {refcount: 1, contents: null, valid: false},
      });
      
      // Leaving a directory should decrement the refcount
      state = qth(state, leavingDirectory("foo"));
      expect(state.directories).toEqual({
        foo: {refcount: 1, contents: null, valid: false},
        bar: {refcount: 1, contents: null, valid: false},
        "spam/eggs": {refcount: 1, contents: null, valid: false},
      });
      
      // Refcount hitting zero should not result in entry being removed (we'll
      // test later that it does make 'valid' turn off).
      state = qth(state, leavingDirectory("foo"));
      expect(state.directories).toEqual({
        foo: {refcount: 0, contents: null, valid: false},
        bar: {refcount: 1, contents: null, valid: false},
        "spam/eggs": {refcount: 1, contents: null, valid: false},
      });
    });
    
    test("updating", () => {
      let state = qth();
      
      // Test state
      state = qth(state, enteringDirectory("foo"));
      state = qth(state, enteringDirectory("bar"));
      state = qth(state, leavingDirectory("bar"));
      expect(state.directories).toEqual({
        foo: {refcount: 1, contents: null, valid: false},
        bar: {refcount: 0, contents: null, valid: false},
      });
      
      // Updating an existing value should work and mark it as valid
      state = qth(state, updateDirectory("foo", {}));
      expect(state.directories).toEqual({
        foo: {refcount: 1, contents: {}, valid: true},
        bar: {refcount: 0, contents: null, valid: false},
      });
      
      // Updating a refcount-0 value should also work but valid should not be
      // set
      state = qth(state, updateDirectory("bar", {}));
      expect(state.directories).toEqual({
        foo: {refcount: 1, contents: {}, valid: true},
        bar: {refcount: 0, contents: {}, valid: false},
      });
      
      // Leaving a directory should remove valid but retain value we set
      state = qth(state, leavingDirectory("foo", {}));
      expect(state.directories).toEqual({
        foo: {refcount: 0, contents: {}, valid: false},
        bar: {refcount: 0, contents: {}, valid: false},
      });
    });
  });
  
  for (const [stateName, incrementAC, decrementAC, updateAC] of [
    ["events", incrementWatchEventRefcount, decrementWatchEventRefcount, updateEvent],
    ["properties", incrementWatchPropertyRefcount, decrementWatchPropertyRefcount, updateProperty],
  ]) {
    describe(`watching ${stateName}`, () => {
      
      test("default state is empty", () => {
        let state = qth();
        expect(state[stateName]).toEqual({});
      });
      
      test("entering/leaving", () => {
        let state = qth();
        
        // Single value should work
        state = qth(state, incrementAC("foo"));
        expect(state[stateName]).toEqual({
          foo: {refcount: 1, value: undefined, lastUpdate: null},
        });
        
        // Adding again should increment refcount
        state = qth(state, incrementAC("foo"));
        expect(state[stateName]).toEqual({
          foo: {refcount: 2, value: undefined, lastUpdate: null},
        });
        
        // Adding a different one should work
        state = qth(state, incrementAC("bar"));
        expect(state[stateName]).toEqual({
          foo: {refcount: 2, value: undefined, lastUpdate: null},
          bar: {refcount: 1, value: undefined, lastUpdate: null},
        });
        
        // Unwatching should decrement the refcount
        state = qth(state, decrementAC("foo"));
        expect(state[stateName]).toEqual({
          foo: {refcount: 1, value: undefined, lastUpdate: null},
          bar: {refcount: 1, value: undefined, lastUpdate: null},
        });
        
        // Refcount hitting zero should not result in entry being removed (we'll
        // test later that it does clear the lastUpdate field).
        state = qth(state, decrementAC("foo"));
        expect(state[stateName]).toEqual({
          foo: {refcount: 0, value: undefined, lastUpdate: null},
          bar: {refcount: 1, value: undefined, lastUpdate: null},
        });
      });
      
      test("updating", () => {
        let state = qth();
        
        // Test state
        state = qth(state, incrementAC("foo"));
        state = qth(state, incrementAC("bar"));
        state = qth(state, decrementAC("bar"));
        expect(state[stateName]).toEqual({
          foo: {refcount: 1, value: undefined, lastUpdate: null},
          bar: {refcount: 0, value: undefined, lastUpdate: null},
        });
        
        // Updating an existing value should work and give it its first
        // timestamp
        state = qth(state, fakeTime(updateAC("foo", {})));
        expect(state[stateName]).toEqual({
          foo: {refcount: 1, value: {}, lastUpdate: 0},
          bar: {refcount: 0, value: undefined, lastUpdate: null},
        });
        
        // Updating again should change the timestamp
        state = qth(state, fakeTime(updateAC("foo", {foo: {}}), 123));
        expect(state[stateName]).toEqual({
          foo: {refcount: 1, value: {foo: {}}, lastUpdate: 123},
          bar: {refcount: 0, value: undefined, lastUpdate: null},
        });
        
        // Updating a refcount-0 value should also work but the timestamp
        // shouldn't be set
        state = qth(state, fakeTime(updateAC("bar", {})));
        expect(state[stateName]).toEqual({
          foo: {refcount: 1, value: {foo: {}}, lastUpdate: 123},
          bar: {refcount: 0, value: {}, lastUpdate: null},
        });
        
        // Unwatching a value should remove timestamp but retain value we set
        state = qth(state, decrementAC("foo", {}));
        expect(state[stateName]).toEqual({
          foo: {refcount: 0, value: {foo: {}}, lastUpdate: null},
          bar: {refcount: 0, value: {}, lastUpdate: null},
        });
      });
    });
  }
  
  describe("sending/setting/deleting values", () => {
    
    test("default state is empty", () => {
      let state = qth();
      expect(state.pendingActions).toEqual({});
    });
  
    for (const [actionName, setterAC, completerAC, hasValue] of [
      ["send", sendingEvent, eventOrPropertyChangeComplete, true],
      ["set", settingProperty, eventOrPropertyChangeComplete, true],
      ["delete", deletingProperty, eventOrPropertyChangeComplete, false],
    ]) {
      test(`performing/completing ${actionName}`, () => {
        let state = qth();
        
        // Sending once should work
        state = qth(state, setterAC("foo", hasValue ? 123 : undefined));
        expect(state.pendingActions).toEqual({
          foo: {pending: 1, lastValue: hasValue ? 123 : undefined, lastAction: actionName},
        });
        
        // Sending another should update (and increment pending count)
        state = qth(state, setterAC("foo", hasValue ? 321 : undefined));
        expect(state.pendingActions).toEqual({
          foo: {pending: 2, lastValue: hasValue ? 321 : undefined, lastAction: actionName},
        });
        
        // Adding another should work
        state = qth(state, setterAC("bar", hasValue ? {} : undefined));
        expect(state.pendingActions).toEqual({
          foo: {pending: 2, lastValue: hasValue ? 321 : undefined, lastAction: actionName},
          bar: {pending: 1, lastValue: hasValue ? {} : undefined, lastAction: actionName},
        });
        
        // Completing should decrement
        state = qth(state, completerAC("foo"));
        expect(state.pendingActions).toEqual({
          foo: {pending: 1, lastValue: hasValue ? 321 : undefined, lastAction: actionName},
          bar: {pending: 1, lastValue: hasValue ? {} : undefined, lastAction: actionName},
        });
        
        // Completing when count reaches 0 should remove the entry
        state = qth(state, completerAC("foo"));
        expect(state.pendingActions).toEqual({
          bar: {pending: 1, lastValue: hasValue ? {} : undefined, lastAction: actionName},
        });
        state = qth(state, completerAC("bar"));
        expect(state.pendingActions).toEqual({});
      });
    }
    
    test(`several types of action on one path`, () => {
      let state = qth();
      
      state = qth(state, sendingEvent("foo", 123))
      expect(state.pendingActions).toEqual({
        foo: {pending: 1, lastValue: 123, lastAction: "send"},
      });
      
      state = qth(state, settingProperty("foo", 321))
      expect(state.pendingActions).toEqual({
        foo: {pending: 2, lastValue: 321, lastAction: "set"},
      });
      
      state = qth(state, deletingProperty("foo"))
      expect(state.pendingActions).toEqual({
        foo: {pending: 3, lastValue: undefined, lastAction: "delete"},
      });
    });
  });
  
  describe("registration", () => {
    test("default state is empty", () => {
      let state = qth();
      expect(state.registrations).toEqual({});
    });
    
    test("add/update/remove registrations", () => {
      let state = qth();
      
      // Basic registration (no options)
      state = qth(state, registeringPath("foo", "EVENT-1:N", "Test event."));
      expect(state.registrations).toEqual({
        foo: {behaviour: "EVENT-1:N", description: "Test event."},
      });
      
      // Registration with options
      state = qth(state, registeringPath("bar",
                                         "PROPERTY-1:N",
                                         "Test property.",
                                         {deleteOnUnregister: true}));
      expect(state.registrations).toEqual({
        foo: {behaviour: "EVENT-1:N", description: "Test event."},
        bar: {behaviour: "PROPERTY-1:N", description: "Test property.", deleteOnUnregister: true},
      });
      
      // Change registration
      state = qth(state, registeringPath("foo", "PROPERTY-1:N", "Test property 2."));
      expect(state.registrations).toEqual({
        foo: {behaviour: "PROPERTY-1:N", description: "Test property 2."},
        bar: {behaviour: "PROPERTY-1:N", description: "Test property.", deleteOnUnregister: true},
      });
      
      // Remove registration
      state = qth(state, unregisteringPath("foo"));
      expect(state.registrations).toEqual({
        bar: {behaviour: "PROPERTY-1:N", description: "Test property.", deleteOnUnregister: true},
      });
      state = qth(state, unregisteringPath("bar"));
      expect(state.registrations).toEqual({});
    });
  });
  
  describe("connection/disconnection", () => {
    test("default state is disconnected", () => {
      let state = qth();
      expect(state.host).toBeNull();
      expect(state.client).toBeNull();
      expect(state.connected).toBeFalsy();
    });
    
    test("connecting from cold", () => {
      let state = qth();
      
      const client = {};
      state = qth(state, connecting("ws://example.com", client));
      expect(state.host).toBe("ws://example.com");
      expect(state.client).toBe(client);
      expect(state.connected).toBeFalsy();
      
      // Verify other empty bits stil are
      expect(state.directories).toEqual({});
      expect(state.events).toEqual({});
      expect(state.properties).toEqual({});
      expect(state.pendingActions).toEqual({});
      expect(state.registrations).toEqual({});
      
      // Connection complete
      state = qth(state, connected());
      expect(state.connected).toBeTruthy();
    });
    
    test("reconnecting from warm", () => {
      let state = qth();
      
      // Carry out a few actions
      state = qth(state, enteringDirectory("foo"));
      state = qth(state, updateDirectory("foo", {}));
      
      state = qth(state, incrementWatchEventRefcount("foo"));
      state = qth(state, fakeTime(updateEvent("foo", 123)));
      
      state = qth(state, incrementWatchPropertyRefcount("bar"));
      state = qth(state, fakeTime(updateProperty("bar", 321)));
      
      state = qth(state, sendingEvent("foo", 123));
      state = qth(state, settingProperty("bar", 123));
      state = qth(state, deletingProperty("baz"));
      
      state = qth(state, registeringPath("foo", "EVENT-1:N", "An event."));
      
      const client = {};
      state = qth(state, connecting("ws://example.com", client));
      expect(state.host).toBe("ws://example.com");
      expect(state.client).toBe(client);
      expect(state.connected).toBeFalsy();
      
      // Verify data has been invalidated/removed as appropriate
      expect(state.directories).toEqual({
        foo: {refcount: 1, contents: {}, valid: false},
      });
      expect(state.events).toEqual({
        foo: {refcount: 1, value: 123, lastUpdate: null},
      });
      expect(state.properties).toEqual({
        bar: {refcount: 1, value: 321, lastUpdate: null},
      });
      expect(state.pendingActions).toEqual({});
      expect(state.registrations).toEqual({
        foo: {behaviour: "EVENT-1:N", description: "An event."},
      });
    });
    
    test("disconnecting", () => {
      let state = qth();
      
      // Connect
      const client = {};
      state = qth(state, connecting("ws://example.com", client));
      state = qth(state, connected());
      expect(state.host).toBe("ws://example.com");
      expect(state.client).toBe(client);
      expect(state.connected).toBeTruthy();
      
      // Carry out a few actions
      state = qth(state, enteringDirectory("foo"));
      state = qth(state, updateDirectory("foo", {}));
      
      state = qth(state, incrementWatchEventRefcount("foo"));
      state = qth(state, fakeTime(updateEvent("foo", 123)));
      
      state = qth(state, incrementWatchPropertyRefcount("bar"));
      state = qth(state, fakeTime(updateProperty("bar", 321)));
      
      state = qth(state, sendingEvent("foo", 123));
      state = qth(state, settingProperty("bar", 123));
      state = qth(state, deletingProperty("baz"));
      
      state = qth(state, registeringPath("foo", "EVENT-1:N", "An event."));
      
      // Disconnect
      state = qth(state, disconnected());
      
      // Verify data has been invalidated/removed as appropriate
      expect(state.host).toBe("ws://example.com");
      expect(state.client).toBe(client);
      expect(state.connected).toBeFalsy();
      expect(state.directories).toEqual({
        foo: {refcount: 1, contents: {}, valid: false},
      });
      expect(state.events).toEqual({
        foo: {refcount: 1, value: 123, lastUpdate: null},
      });
      expect(state.properties).toEqual({
        bar: {refcount: 1, value: 321, lastUpdate: null},
      });
      expect(state.pendingActions).toEqual({});
      expect(state.registrations).toEqual({
        foo: {behaviour: "EVENT-1:N", description: "An event."},
      });
    });
  });
});


describe("asynchronous actions (with mocked qth)", () => {
  describe("connection/disconnection", () => {
    // Auto connect for all these examples
    let store = null;
    let client = null;
    beforeEach(() => {
      jest.clearAllMocks();
      
      store = createStore(qth, applyMiddleware(ReduxThunk));
      store.dispatch(connect("ws://example.com"));
      client = store.getState().client;
    });
    
    test("basic connection", () => {
      const state = store.getState();
      
      // Should have created a real Qth client
      expect(state.client).toBe(Client.mock.instances[0]);
      
      // Should have passed on the address
      expect(state.host).toBe("ws://example.com");
      expect(Client).toHaveBeenCalledWith("ws://example.com");
    });
    
    test("connection/disconnection event", () => {
      expect(store.getState().connected).toBeFalsy();
      
      client.callCallbacks("connect");
      expect(store.getState().connected).toBeTruthy();
      
      client.callCallbacks("offline");
      expect(store.getState().connected).toBeFalsy();
    });
    
    test("restoring subscriptions etc.", () => {
      client.callCallbacks("connect");
      
      // Setup some stuff to recreate
      store.dispatch(enterDirectory("foo/"));
      store.dispatch(watchProperty("prop"));
      store.dispatch(watchEvent("event"));
      store.dispatch(registerPath("reg", "EVENT-1:N", "Test event."));
      
      const oldState = store.getState();
      
      // Reconnect (making sure the new client is inserted
      store.dispatch(connect("ws://example.com/2"));
      store.dispatch(connected());
      expect(Client).toHaveBeenCalledTimes(2);
      const oldClient = client;
      client = Client.mock.instances[1];
      expect(store.getState().client).toBe(client);
      expect(oldClient.end).toHaveBeenCalledTimes(1);
      
      // Existing subscriptions should have been reestablished
      expect(client.watchProperty).toHaveBeenCalledTimes(3);
      expect(client.watchProperty.mock.calls[0][0]).toBe("meta/ls/");
      expect(client.watchProperty.mock.calls[1][0]).toBe("meta/ls/foo/");
      
      expect(client.watchProperty.mock.calls[2][0]).toBe("prop");
      
      expect(client.watchEvent).toHaveBeenCalledTimes(1);
      expect(client.watchEvent.mock.calls[0][0]).toBe("event");
      
      expect(client.register).toHaveBeenCalledTimes(1);
      expect(client.register.mock.calls[0][0]).toBe("reg");
      
      expect(client.unwatchProperty).not.toHaveBeenCalled();
      expect(client.unwatchEvent).not.toHaveBeenCalled();
      expect(client.unregister).not.toHaveBeenCalled();
      
      // No state change (beyond client object/hostname) should have occurred
      expect(store.getState()).toEqual({
        ...oldState,
        host: "ws://example.com/2",
        client,
      });
    });
  });
  
  describe("directory watching", () => {
    // Auto connect for all these examples
    let store = null;
    let client = null;
    beforeEach(() => {
      jest.clearAllMocks();
      
      store = createStore(qth, applyMiddleware(ReduxThunk));
      store.dispatch(connect("ws://example.com"));
      store.dispatch(connected());
      client = store.getState().client;
    });
    
    test("correct property watching/unwatching", () => {
      // Watch the root directory
      store.dispatch(enterDirectory(""));
      expect(store.getState().directories).toEqual({
        "": {refcount: 1, contents: null, valid: false},
      });
      
      // Check a watch was requested
      expect(client.watchProperty).toHaveBeenCalledTimes(1);
      expect(client.watchProperty.mock.calls[0][0]).toBe("meta/ls/");
      
      // Simulate a response and check it arrives
      client.watchProperty.mock.calls[0][1]("meta/ls/", {});
      expect(store.getState().directories).toEqual({
        "": {refcount: 1, contents: {}, valid: true},
      });
      
      // Watching again shouldn't cause more watches
      store.dispatch(enterDirectory(""));
      expect(client.watchProperty).toHaveBeenCalledTimes(1);
      
      // Refcount still above zero shouldn't result in unwatching
      store.dispatch(leaveDirectory(""));
      expect(client.unwatchProperty).not.toHaveBeenCalled();
      
      // When refcount reaches zero, should unwatch
      store.dispatch(leaveDirectory(""));
      expect(client.unwatchProperty).toHaveBeenCalledTimes(1);
      expect(client.unwatchProperty.mock.calls[0][0]).toBe("meta/ls/");
      expect(client.unwatchProperty.mock.calls[0][1]).toBe(
        client.watchProperty.mock.calls[0][1]);
      expect(store.getState().directories).toEqual({
        "": {refcount: 0, contents: {}, valid: false},
      });
    });
    
    test("watching deeper directories", () => {
      // Watch a nested directory
      store.dispatch(enterDirectory("foo/bar/"));
      expect(store.getState().directories).toEqual({
        "": {refcount: 1, contents: null, valid: false},
        "foo/": {refcount: 1, contents: null, valid: false},
        "foo/bar/": {refcount: 1, contents: null, valid: false},
      });
      
      // Check watches were created for all subdirectories
      expect(client.watchProperty).toHaveBeenCalledTimes(3);
      expect(client.watchProperty.mock.calls[0][0]).toBe("meta/ls/");
      expect(client.watchProperty.mock.calls[1][0]).toBe("meta/ls/foo/");
      expect(client.watchProperty.mock.calls[2][0]).toBe("meta/ls/foo/bar/");
      
      // Simulate a response and check each arrives seperately
      client.watchProperty.mock.calls[0][1]("meta/ls/", {});
      expect(store.getState().directories).toEqual({
        "": {refcount: 1, contents: {}, valid: true},
        "foo/": {refcount: 1, contents: null, valid: false},
        "foo/bar/": {refcount: 1, contents: null, valid: false},
      });
      client.watchProperty.mock.calls[1][1]("meta/ls/foo/", {});
      expect(store.getState().directories).toEqual({
        "": {refcount: 1, contents: {}, valid: true},
        "foo/": {refcount: 1, contents: {}, valid: true},
        "foo/bar/": {refcount: 1, contents: null, valid: false},
      });
      client.watchProperty.mock.calls[2][1]("meta/ls/foo/bar/", {});
      expect(store.getState().directories).toEqual({
        "": {refcount: 1, contents: {}, valid: true},
        "foo/": {refcount: 1, contents: {}, valid: true},
        "foo/bar/": {refcount: 1, contents: {}, valid: true},
      });
      
      // When refcount reaches zero, should unwatch
      store.dispatch(leaveDirectory("foo/bar/"));
      expect(client.unwatchProperty).toHaveBeenCalledTimes(3);
      
      expect(client.unwatchProperty.mock.calls[0][0]).toBe("meta/ls/");
      expect(client.unwatchProperty.mock.calls[1][0]).toBe("meta/ls/foo/");
      expect(client.unwatchProperty.mock.calls[2][0]).toBe("meta/ls/foo/bar/");
      expect(client.unwatchProperty.mock.calls[0][1]).toBe(
        client.watchProperty.mock.calls[0][1]);
      expect(client.unwatchProperty.mock.calls[1][1]).toBe(
        client.watchProperty.mock.calls[1][1]);
      expect(client.unwatchProperty.mock.calls[2][1]).toBe(
        client.watchProperty.mock.calls[2][1]);
      
      expect(store.getState().directories).toEqual({
        "": {refcount: 0, contents: {}, valid: false},
        "foo/": {refcount: 0, contents: {}, valid: false},
        "foo/bar/": {refcount: 0, contents: {}, valid: false},
      });
    });
  });
  
  describe("watching values", () => {
    // Auto connect for all these examples
    let store = null;
    let client = null;
    beforeEach(() => {
      jest.clearAllMocks();
      
      store = createStore(qth, applyMiddleware(ReduxThunk));
      store.dispatch(connect("ws://example.com"));
      store.dispatch(connected());
      client = store.getState().client;
    });
    
    for (const [name, nameCS, watchAction, unwatchAction] of [
      ["events", "Event", watchEvent, unwatchEvent],
      ["properties", "Property", watchProperty, unwatchProperty],
    ]) {
      test(name, () => {
        // First watch should...
        store.dispatch(watchAction("foo"));
        
        // ...update the store
        expect(store.getState()[name]).toEqual({
          "foo": {refcount: 1, value: undefined, lastUpdate: null},
        });
        
        // ...and result in a registration
        expect(client[`watch${nameCS}`]).toHaveBeenCalledTimes(1);
        expect(client[`watch${nameCS}`].mock.calls[0][0]).toBe("foo");
        
        // Duplicated watch should not result in another Qth watch call
        store.dispatch(watchAction("foo"));
        expect(client[`watch${nameCS}`]).toHaveBeenCalledTimes(1);
        
        // Calling the provided callback should result in a call
        client[`watch${nameCS}`].mock.calls[0][1]("foo", 123);
        expect(store.getState()[name].foo.value).toBe(123);
        expect(store.getState()[name].foo.lastUpdate).toBeGreaterThan(0);
        
        // Unwatching shouldn't invalidate yet since refcount is non-zero
        store.dispatch(unwatchAction("foo"));
        expect(client[`unwatch${nameCS}`]).not.toHaveBeenCalled();
        expect(store.getState()[name].foo.lastUpdate).toBeGreaterThan(0);
        
        // Unwatching again, however, should!
        store.dispatch(unwatchAction("foo"));
        expect(client[`unwatch${nameCS}`]).toHaveBeenCalledTimes(1);
        expect(client[`unwatch${nameCS}`].mock.calls[0][0]).toBe("foo");
        expect(client[`unwatch${nameCS}`].mock.calls[0][1]).toBe(
          client[`watch${nameCS}`].mock.calls[0][1]);
        expect(store.getState()[name].foo.lastUpdate).toBe(null);
      });
    }
  });
  
  describe("changing values", () => {
    // Auto connect for all these examples
    let store = null;
    let client = null;
    beforeEach(() => {
      jest.clearAllMocks();
      
      store = createStore(qth, applyMiddleware(ReduxThunk));
      store.dispatch(connect("ws://example.com"));
      store.dispatch(connected());
      client = store.getState().client;
    });
    
    for (const [type, method, action, expectedValue] of [
      ["send", "sendEvent", path => sendEvent(path, 123), 123],
      ["set", "setProperty", path => setProperty(path, 123), 123],
      ["delete", "deleteProperty", path => deleteProperty(path), undefined],
    ]) {
      test(type, async () => {
        const promise = Promise.resolve();
        client[method].mockReturnValueOnce(promise);
        
        // Action should occur
        store.dispatch(action("foo"));
        
        // ...update the store
        expect(store.getState().pendingActions).toEqual({
          "foo": {pending: 1, lastValue: expectedValue, lastAction: type},
        });
        
        // ...and result in a command
        expect(client[method]).toHaveBeenCalledTimes(1);
        expect(client[method].mock.calls[0][0]).toBe("foo");
        
        // Now when the promise resolves, the pending value should disappear
        await promise;
        expect(store.getState().pendingActions).toEqual({});
      });
    }
  });
  
  describe("registration", () => {
    // Auto connect for all these examples
    let store = null;
    let client = null;
    beforeEach(() => {
      jest.clearAllMocks();
      
      store = createStore(qth, applyMiddleware(ReduxThunk));
      store.dispatch(connect("ws://example.com"));
      store.dispatch(connected());
      client = store.getState().client;
    });
    
    test("register/unregister", () => {
      // Simple registrations should pass through to Qth
      store.dispatch(registerPath("foo", "EVENT-1:N", "Test event."));
      expect(client.register).toHaveBeenCalledTimes(1);
      expect(client.register).toHaveBeenLastCalledWith(
        "foo", "EVENT-1:N", "Test event.", {});
      expect(store.getState().registrations).toEqual({
        foo: {behaviour: "EVENT-1:N", description: "Test event."}
      });
      
      // As should re-registrations
      store.dispatch(registerPath("foo", "PROPERTY-1:N", "Test property.",
                                  {deleteOnUnregister: true}));
      expect(client.register).toHaveBeenCalledTimes(2);
      expect(client.register).toHaveBeenLastCalledWith(
        "foo", "PROPERTY-1:N", "Test property.", {deleteOnUnregister: true});
      expect(store.getState().registrations).toEqual({
        foo: {
          behaviour: "PROPERTY-1:N",
          description: "Test property.",
          deleteOnUnregister: true
        },
      });
      
      // As should registering additional values
      store.dispatch(registerPath("bar", "EVENT-1:N", "Test event."));
      expect(client.register).toHaveBeenCalledTimes(3);
      expect(client.register).toHaveBeenLastCalledWith("bar", "EVENT-1:N", "Test event.", {});
      expect(store.getState().registrations).toEqual({
        foo: {
          behaviour: "PROPERTY-1:N",
          description: "Test property.",
          deleteOnUnregister: true
        },
        bar: {behaviour: "EVENT-1:N", description: "Test event."},
      });
      
      // Unreigstration should work
      store.dispatch(unregisterPath("foo"));
      expect(client.unregister).toHaveBeenCalledTimes(1);
      expect(client.unregister).toHaveBeenLastCalledWith("foo");
      expect(store.getState().registrations).toEqual({
        bar: {behaviour: "EVENT-1:N", description: "Test event."},
      });
      
      store.dispatch(unregisterPath("bar"));
      expect(client.unregister).toHaveBeenCalledTimes(2);
      expect(client.unregister).toHaveBeenLastCalledWith("bar");
      expect(store.getState().registrations).toEqual({});
    });
  });
});
