import {createStore, applyMiddleware} from "redux";
import ReduxThunk from "redux-thunk";

import Client from "qth";

import reducer from "../";
import {
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
} from "./async-actions";

describe("asynchronous qth actions (with mocked qth)", () => {
  describe("connection/disconnection", () => {
    // Auto connect for all these examples
    let store = null;
    let client = null;
    beforeEach(() => {
      jest.clearAllMocks();
      
      store = createStore(reducer, applyMiddleware(ReduxThunk));
      store.dispatch(connect("ws://example.com"));
      client = store.getState().qth.client;
    });
    
    test("basic connection", () => {
      const state = store.getState().qth;
      
      // Should have created a real Qth client
      expect(state.client).toBe(Client.mock.instances[0]);
      
      // Should have passed on the address
      expect(state.host).toBe("ws://example.com");
      expect(Client).toHaveBeenCalledWith("ws://example.com");
    });
    
    test("connection/disconnection event", () => {
      expect(store.getState().qth.connected).toBeFalsy();
      
      client.callCallbacks("connect");
      expect(store.getState().qth.connected).toBeTruthy();
      
      client.callCallbacks("offline");
      expect(store.getState().qth.connected).toBeFalsy();
    });
    
    test("restoring subscriptions etc.", () => {
      client.callCallbacks("connect");
      
      // Setup some stuff to recreate
      store.dispatch(enterDirectory("foo/"));
      store.dispatch(watchProperty("prop"));
      store.dispatch(watchEvent("event"));
      store.dispatch(registerPath("reg", "EVENT-1:N", "Test event."));
      
      const oldState = store.getState().qth;
      
      // Reconnect (making sure the new client is inserted
      store.dispatch(connect("ws://example.com/2"));
      client.callCallbacks("connect");
      expect(Client).toHaveBeenCalledTimes(2);
      const oldClient = client;
      client = Client.mock.instances[1];
      expect(store.getState().qth.client).toBe(client);
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
      expect(store.getState().qth).toEqual({
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
      
      store = createStore(reducer, applyMiddleware(ReduxThunk));
      store.dispatch(connect("ws://example.com"));
      client = store.getState().qth.client;
      client.callCallbacks("connect");
    });
    
    test("correct property watching/unwatching", () => {
      // Watch the root directory
      store.dispatch(enterDirectory(""));
      expect(store.getState().qth.directories).toEqual({
        "": {refcount: 1, contents: null, valid: false},
      });
      
      // Check a watch was requested
      expect(client.watchProperty).toHaveBeenCalledTimes(1);
      expect(client.watchProperty.mock.calls[0][0]).toBe("meta/ls/");
      
      // Simulate a response and check it arrives
      client.watchProperty.mock.calls[0][1]("meta/ls/", {});
      expect(store.getState().qth.directories).toEqual({
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
      expect(store.getState().qth.directories).toEqual({
        "": {refcount: 0, contents: {}, valid: false},
      });
    });
    
    test("handles non-existant directory", () => {
      // Watch the root directory, never send the value (as if it was deleted)
      // and unsubscribe and make sure nothing crashes.
      store.dispatch(enterDirectory(""));
      store.dispatch(leaveDirectory(""));
    });
    
    test("watching deeper directories", () => {
      // Watch a nested directory
      store.dispatch(enterDirectory("foo/bar/"));
      expect(store.getState().qth.directories).toEqual({
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
      expect(store.getState().qth.directories).toEqual({
        "": {refcount: 1, contents: {}, valid: true},
        "foo/": {refcount: 1, contents: null, valid: false},
        "foo/bar/": {refcount: 1, contents: null, valid: false},
      });
      client.watchProperty.mock.calls[1][1]("meta/ls/foo/", {});
      expect(store.getState().qth.directories).toEqual({
        "": {refcount: 1, contents: {}, valid: true},
        "foo/": {refcount: 1, contents: {}, valid: true},
        "foo/bar/": {refcount: 1, contents: null, valid: false},
      });
      client.watchProperty.mock.calls[2][1]("meta/ls/foo/bar/", {});
      expect(store.getState().qth.directories).toEqual({
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
      
      expect(store.getState().qth.directories).toEqual({
        "": {refcount: 0, contents: {}, valid: false},
        "foo/": {refcount: 0, contents: {}, valid: false},
        "foo/bar/": {refcount: 0, contents: {}, valid: false},
      });
    });
    
    test("watching values within directories", () => {
      store.dispatch(enterDirectory("dir/"));
      expect(store.getState().qth.directories).toEqual({
        "": {refcount: 1, contents: null, valid: false},
        "dir/": {refcount: 1, contents: null, valid: false},
      });
      
      // Simulate a response indicating some entries
      client.watchProperty.mock.calls[1][1]("meta/ls/dir/", {
        "subdir": [{behaviour: "DIRECTORY", description: "A subdir."}],
        "event": [{behaviour: "EVENT-1:N", description: "An event."}],
        "property": [{behaviour: "PROPERTY-1:N", description: "A property."}],
        "both": [
          {behaviour: "EVENT-1:N", description: "An event."},
          {behaviour: "PROPERTY-1:N", description: "A property."},
        ],
      });
      expect(store.getState().qth.directories).toEqual({
        "": {refcount: 1, contents: null, valid: false},
        "dir/": {
          refcount: 1,
          valid: true,
          contents: {
            "subdir": [{behaviour: "DIRECTORY", description: "A subdir."}],
            "event": [{behaviour: "EVENT-1:N", description: "An event."}],
            "property": [{behaviour: "PROPERTY-1:N", description: "A property."}],
            "both": [
              {behaviour: "EVENT-1:N", description: "An event."},
              {behaviour: "PROPERTY-1:N", description: "A property."},
            ],
          },
        },
      });
      
      // We'd also expect a number of value subscriptions to be created.
      expect(store.getState().qth.events).toEqual({
        "dir/event": {refcount: 1, value: undefined, lastUpdate: null},
        "dir/both": {refcount: 1, value: undefined, lastUpdate: null},
      });
      expect(store.getState().qth.properties).toEqual({
        "dir/property": {refcount: 1, value: undefined, lastUpdate: null},
        "dir/both": {refcount: 1, value: undefined, lastUpdate: null},
      });
      
      // When removing entries from the directory, the watch should update.
      // Removing event
      client.watchProperty.mock.calls[1][1]("meta/ls/dir/", {
        "subdir": [{behaviour: "DIRECTORY", description: "A subdir."}],
        "event": [{behaviour: "EVENT-1:N", description: "An event."}],
        "property": [{behaviour: "PROPERTY-1:N", description: "A property."}],
        "both": [
          {behaviour: "PROPERTY-1:N", description: "A property."},
        ],
      });
      expect(store.getState().qth.events).toEqual({
        "dir/event": {refcount: 1, value: undefined, lastUpdate: null},
        "dir/both": {refcount: 0, value: undefined, lastUpdate: null},
      });
      expect(store.getState().qth.properties).toEqual({
        "dir/property": {refcount: 1, value: undefined, lastUpdate: null},
        "dir/both": {refcount: 1, value: undefined, lastUpdate: null},
      });
      
      // Removing property
      client.watchProperty.mock.calls[1][1]("meta/ls/dir/", {
        "subdir": [{behaviour: "DIRECTORY", description: "A subdir."}],
        "event": [{behaviour: "EVENT-1:N", description: "An event."}],
        "property": [{behaviour: "PROPERTY-1:N", description: "A property."}],
      });
      expect(store.getState().qth.events).toEqual({
        "dir/event": {refcount: 1, value: undefined, lastUpdate: null},
        "dir/both": {refcount: 0, value: undefined, lastUpdate: null},
      });
      expect(store.getState().qth.properties).toEqual({
        "dir/property": {refcount: 1, value: undefined, lastUpdate: null},
        "dir/both": {refcount: 0, value: undefined, lastUpdate: null},
      });
      
      // Adding things should work too
      // Adding event
      client.watchProperty.mock.calls[1][1]("meta/ls/dir/", {
        "subdir": [{behaviour: "DIRECTORY", description: "A subdir."}],
        "event": [{behaviour: "EVENT-1:N", description: "An event."}],
        "property": [{behaviour: "PROPERTY-1:N", description: "A property."}],
        "event2": [{behaviour: "EVENT-1:N", description: "An event."}],
      });
      expect(store.getState().qth.events).toEqual({
        "dir/event": {refcount: 1, value: undefined, lastUpdate: null},
        "dir/event2": {refcount: 1, value: undefined, lastUpdate: null},
        "dir/both": {refcount: 0, value: undefined, lastUpdate: null},
      });
      expect(store.getState().qth.properties).toEqual({
        "dir/property": {refcount: 1, value: undefined, lastUpdate: null},
        "dir/both": {refcount: 0, value: undefined, lastUpdate: null},
      });
      
      // Adding property
      client.watchProperty.mock.calls[1][1]("meta/ls/dir/", {
        "subdir": [{behaviour: "DIRECTORY", description: "A subdir."}],
        "event": [{behaviour: "EVENT-1:N", description: "An event."}],
        "property": [{behaviour: "PROPERTY-1:N", description: "A property."}],
        "event2": [{behaviour: "EVENT-1:N", description: "An event."}],
        "property2": [{behaviour: "PROPERTY-1:N", description: "A property."}],
      });
      expect(store.getState().qth.events).toEqual({
        "dir/event": {refcount: 1, value: undefined, lastUpdate: null},
        "dir/event2": {refcount: 1, value: undefined, lastUpdate: null},
        "dir/both": {refcount: 0, value: undefined, lastUpdate: null},
      });
      expect(store.getState().qth.properties).toEqual({
        "dir/property": {refcount: 1, value: undefined, lastUpdate: null},
        "dir/property2": {refcount: 1, value: undefined, lastUpdate: null},
        "dir/both": {refcount: 0, value: undefined, lastUpdate: null},
      });
      
      // Finally, on unsubscription, everything should get cleared up
      store.dispatch(leaveDirectory("dir/"));
      expect(store.getState().qth.events).toEqual({
        "dir/event": {refcount: 0, value: undefined, lastUpdate: null},
        "dir/event2": {refcount: 0, value: undefined, lastUpdate: null},
        "dir/both": {refcount: 0, value: undefined, lastUpdate: null},
      });
      expect(store.getState().qth.properties).toEqual({
        "dir/property": {refcount: 0, value: undefined, lastUpdate: null},
        "dir/property2": {refcount: 0, value: undefined, lastUpdate: null},
        "dir/both": {refcount: 0, value: undefined, lastUpdate: null},
      });
    });
  });
  
  describe("watching values", () => {
    // Auto connect for all these examples
    let store = null;
    let client = null;
    beforeEach(() => {
      jest.clearAllMocks();
      
      store = createStore(reducer, applyMiddleware(ReduxThunk));
      store.dispatch(connect("ws://example.com"));
      client = store.getState().qth.client;
      client.callCallbacks("connect");
    });
    
    for (const [name, nameCS, watchAction, unwatchAction] of [
      ["events", "Event", watchEvent, unwatchEvent],
      ["properties", "Property", watchProperty, unwatchProperty],
    ]) {
      test(name, () => {
        // First watch should...
        store.dispatch(watchAction("foo"));
        
        // ...update the store
        expect(store.getState().qth[name]).toEqual({
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
        expect(store.getState().qth[name].foo.value).toBe(123);
        expect(store.getState().qth[name].foo.lastUpdate).toBeGreaterThan(0);
        
        // Unwatching shouldn't invalidate yet since refcount is non-zero
        store.dispatch(unwatchAction("foo"));
        expect(client[`unwatch${nameCS}`]).not.toHaveBeenCalled();
        expect(store.getState().qth[name].foo.lastUpdate).toBeGreaterThan(0);
        
        // Unwatching again, however, should!
        store.dispatch(unwatchAction("foo"));
        expect(client[`unwatch${nameCS}`]).toHaveBeenCalledTimes(1);
        expect(client[`unwatch${nameCS}`].mock.calls[0][0]).toBe("foo");
        expect(client[`unwatch${nameCS}`].mock.calls[0][1]).toBe(
          client[`watch${nameCS}`].mock.calls[0][1]);
        expect(store.getState().qth[name].foo.lastUpdate).toBe(null);
      });
    }
  });
  
  describe("changing values", () => {
    // Auto connect for all these examples
    let store = null;
    let client = null;
    beforeEach(() => {
      jest.clearAllMocks();
      
      store = createStore(reducer, applyMiddleware(ReduxThunk));
      store.dispatch(connect("ws://example.com"));
      client = store.getState().qth.client;
      client.callCallbacks("connect");
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
        expect(store.getState().qth.pendingActions).toEqual({
          "foo": {pending: 1, lastValue: expectedValue, lastAction: type},
        });
        
        // ...and result in a command
        expect(client[method]).toHaveBeenCalledTimes(1);
        expect(client[method].mock.calls[0][0]).toBe("foo");
        
        // Now when the promise resolves, the pending value should disappear
        await promise;
        expect(store.getState().qth.pendingActions).toEqual({});
      });
    }
  });
  
  describe("registration", () => {
    // Auto connect for all these examples
    let store = null;
    let client = null;
    beforeEach(() => {
      jest.clearAllMocks();
      
      store = createStore(reducer, applyMiddleware(ReduxThunk));
      store.dispatch(connect("ws://example.com"));
      client = store.getState().qth.client;
      client.callCallbacks("connect");
    });
    
    test("register/unregister", () => {
      // Simple registrations should pass through to Qth
      store.dispatch(registerPath("foo", "EVENT-1:N", "Test event."));
      expect(client.register).toHaveBeenCalledTimes(1);
      expect(client.register).toHaveBeenLastCalledWith(
        "foo", "EVENT-1:N", "Test event.", {});
      expect(store.getState().qth.registrations).toEqual({
        foo: {behaviour: "EVENT-1:N", description: "Test event."}
      });
      
      // As should re-registrations
      store.dispatch(registerPath("foo", "PROPERTY-1:N", "Test property.",
                                  {deleteOnUnregister: true}));
      expect(client.register).toHaveBeenCalledTimes(2);
      expect(client.register).toHaveBeenLastCalledWith(
        "foo", "PROPERTY-1:N", "Test property.", {deleteOnUnregister: true});
      expect(store.getState().qth.registrations).toEqual({
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
      expect(store.getState().qth.registrations).toEqual({
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
      expect(store.getState().qth.registrations).toEqual({
        bar: {behaviour: "EVENT-1:N", description: "Test event."},
      });
      
      store.dispatch(unregisterPath("bar"));
      expect(client.unregister).toHaveBeenCalledTimes(2);
      expect(client.unregister).toHaveBeenLastCalledWith("bar");
      expect(store.getState().qth.registrations).toEqual({});
    });
  });
});

