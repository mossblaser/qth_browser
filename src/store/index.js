import {combineReducers} from "redux";

import qth from "./qth";
import * as qthActions from "./qth";
import lockStateAndUrl from "./url";
import lockStateAndCookie from "./cookie";

import ui from "./ui";
import * as uiActions from "./ui";

const reducer = combineReducers({
  qth,
  ui,
});

export default reducer;
export {qthActions, uiActions, lockStateAndUrl, lockStateAndCookie};
