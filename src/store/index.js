import {combineReducers} from "redux";

import qth from "./qth";
import * as qth_actions from "./qth";

const reducer = combineReducers({
  qth,
});

export default reducer;
export {qth_actions};
