import { useSelector, useDispatch } from "react-redux";
import { loadTokens, registerMarket } from "../store/interactions";
import { useState } from "react";

export const RegisterMarkets = () => {
  const provider = useSelector((state) => state.provider.connection);
  const exchange = useSelector((state) => state.exchange.contract);

  const [token1, setToken1] = useState("");
  const [token2, setToken2] = useState("");
  const dispatch = useDispatch();

  const registerMarketHelper = () => {
    registerMarket(provider, exchange, token1, token2, dispatch);
  };

  return (
    <div className="component register__markets">
      <div className="component__header">
        <h2> Register Market </h2>
      </div>

      <div className="exchange__transfers--form">
        <label htmlFor="token1">Token1 Address</label>
        <input
          type="text"
          id="token1"
          value={token1}
          placeholder="Token1"
          onChange={(e) => setToken1(e.target.value)}
        />
        <label htmlFor="token2">Token2 Address</label>
        <input
          type="text"
          id="token2"
          value={token2}
          placeholder="Token2"
          onChange={(e) => setToken2(e.target.value)}
        />

        <button className="button" onClick={registerMarketHelper}>
          Register Market
        </button>
      </div>

      <hr />
    </div>
  );
};
