import {createStore, applyMiddleware} from "redux";
import ReduxThunk from "redux-thunk";

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
} from "./actions";

import qth from "./reducers";

const store = createStore(qth, applyMiddleware(ReduxThunk));

console.log("Hello...");

const tag = document.getElementById("state");
store.subscribe(() => {
	tag.innerText = JSON.stringify({
		...store.getState(),
		client: "...snip...",
	}, null, 2);
});

store.dispatch(connect("ws://localhost:8080"));
store.dispatch(enterDirectory("foo/"));
