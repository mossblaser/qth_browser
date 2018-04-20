import qth from "./reducer";

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
