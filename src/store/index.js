import {combineReducers} from "redux";

import qth from "./qth";
import * as qth_actions from "./qth";

import ui from "./ui";
import * as ui_actions from "./ui";

const reducer = combineReducers({
  qth,
  ui,
});

export default reducer;
export {qth_actions, ui_actions};
