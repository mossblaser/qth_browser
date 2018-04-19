/**
 * A Mock Qth client.
 */

const MockedClient = jest.genMockFromModule("qth").default;

class Client extends MockedClient {
  constructor(...args) {
    super(...args);
    
    this._onCallbacks = {};
  }
  
  on(name, callback) {
    // For logging puprposes
    super.on(name, callback);
    
    if (!this._onCallbacks[name]) {
      this._onCallbacks[name] = [];
    }
    this._onCallbacks[name].push(callback);
  }
  
  callCallbacks(name, ...args) {
    for (const callback of this._onCallbacks[name] || []) {
      callback(...args);
    }
  }
  
  end(force, callback) {
    callback();
  }
}

export default Client;
