import { createStore, combineReducers, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import { composeWithDevTools } from "redux-devtools-extension";
import { provider, tokens, exchange } from "./reducers";

const reducers = combineReducers({
  provider,
  tokens,
  exchange,
});

const initialState = {};

const middleWare = [thunk];

const store = createStore(
  reducers,
  initialState,
  composeWithDevTools(applyMiddleware(...middleWare))
);

export default store;
