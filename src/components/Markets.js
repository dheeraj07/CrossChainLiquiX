import config from "../config";
import { useSelector, useDispatch } from "react-redux";
import {
  loadTokens,
  loadAllOrders,
  loadMarketTicker,
  loadAllTrades,
  loadUserOrders,
  loadUserTrades,
  loadDefaultTokens,
} from "../store/interactions";

export const Markets = () => {
  const provider = useSelector((state) => state.provider.connection);
  const defaultProvider = useSelector(
    (state) => state.provider.defaultConnection
  );
  const defaultChainID = useSelector((state) => state.exchange.defaultChain);
  const chainID = useSelector((state) => state.provider.chainId);
  const exchange = useSelector((state) => state.exchange.contract);
  const markets = useSelector((state) => state.exchange.markets);
  const account = useSelector((state) => state.provider.account);
  const sellOrders = useSelector((state) => state.exchange.sellOrders);
  const buyOrders = useSelector((state) => state.exchange.buyOrders);
  const defaultExchange = useSelector(
    (state) => state.exchange.defaultExchangeContract
  );

  const dispatch = useDispatch();

  const marketHandler = async (e) => {
    const marketName = await loadTokens(
      e.target.value.split(","),
      provider,
      defaultProvider,
      defaultChainID,
      dispatch
    );
    await loadMarketTicker(marketName, dispatch);
    await loadAllOrders(
      marketName,
      defaultProvider,
      defaultExchange,
      dispatch,
      account
    );
    await loadAllTrades(marketName, defaultExchange, dispatch);

    if (
      (sellOrders && sellOrders.length > 0) ||
      (buyOrders && buyOrders.length > 0)
    ) {
      await loadUserOrders(sellOrders, buyOrders, dispatch, account);
    }
    await loadUserTrades(marketName, exchange, dispatch, account);
  };

  return (
    <div className="component exchange__markets">
      <div className="component__header">
        <h2> Select Market </h2>
      </div>
      {chainID && config[chainID] ? (
        markets && markets.length > 0 ? (
          <select
            name="markets"
            id="markets"
            onChange={marketHandler}
            defaultValue=""
          >
            <option value="" disabled>
              Select a Market
            </option>
            {markets.map((pair, index) => {
              return (
                <option
                  key={index}
                  //${pair.args._parentTokenSymbol},${pair.args._tradeTokenSymbol}
                  value={pair.args}
                >
                  {pair.args._marketName}
                </option>
              );
            })}
          </select>
        ) : (
          "No markets registered"
        )
      ) : (
        <div>
          <p> Not deployed to network</p>
        </div>
      )}
      <hr />
    </div>
  );
};
