import { useState, useRef } from "react";
import {
  initiateLimitOrder,
  reloadTradeDashBoard,
  initiateMarketOrder,
  initiateCrossChainLimitOrder
} from "../store/interactions";
import { useSelector, useDispatch } from "react-redux";

export const Order = () => {
  const [isBuy, setBuy] = useState(true);
  const [amount, setAmount] = useState(0);
  const [price, setPrice] = useState(0);
  const [currentOrderType, setOrderType] = useState("LIMIT");
  const provider = useSelector((state) => state.provider.connection);
  const account = useSelector((state) => state.provider.account);
  const exchange = useSelector((state) => state.exchange.contract);
  const marketTicker = useSelector((state) => state.exchange.market);
  const symbols = useSelector((state) => state.tokens.symbols);
  const defaultChainID = useSelector((state) => state.exchange.defaultChain);
  const chainID = useSelector((state) => state.provider.chainId);
  const bridge = useSelector((state) => state.exchange.bridgeContract);
  const dispatch = useDispatch();

  const buyRef = useRef(null);
  const sellRef = useRef(null);

  const orderHandler = async (e) => {
    e.preventDefault();
    const order = {
      amount,
      price,
      orderType: isBuy ? 0 : 1,
    };
    if(defaultChainID === chainID)
    {
      if (currentOrderType === "LIMIT") {
        console.log("limit");
        await initiateLimitOrder(provider, exchange, symbols, order, dispatch);
      } else {
        console.log("market order");
        await initiateMarketOrder(provider, exchange, symbols, order, dispatch);
      }
  
      e.target.reset();
  
      if (marketTicker) {
        await reloadTradeDashBoard(
          marketTicker,
          provider,
          exchange,
          dispatch,
          account
        );
      }
      else {
        console.log("market order");
        
      }
    }
    else{
      if (currentOrderType === "LIMIT") {
        console.log("limit");
      await initiateCrossChainLimitOrder(
        provider,
        bridge,
        symbols,
        order,
        dispatch,
        defaultChainID,
        account);
      }
    }
  };

  function activeTabHandler(e) {
    if (e.target.className !== buyRef.current.className) {
      buyRef.current.className = "tab";
      setBuy(false);
    } else {
      sellRef.current.className = "tab";
      setBuy(true);
    }
    e.target.className = "tab tab--active";
  }

  return (
    <div className="component exchange__orders">
      {/* 
        Need to disable PRICE field once market order is selected
        */}
      <div className="component exchange__markets">
        <select
          name="markets"
          id="markets"
          value={currentOrderType}
          onChange={(e) => setOrderType(e.target.value)}
        >
          <option value="LIMIT">Limit Order</option>
          <option value="MARKET">Market Order</option>
        </select>
      </div>

      <div
        style={{ marginTop: "15px" }}
        className="component__header flex-between"
      >
        <h2>New Order</h2>
        <div className="tabs">
          <button
            ref={buyRef}
            onClick={activeTabHandler}
            className="tab tab--active"
          >
            Buy
          </button>
          <button ref={sellRef} onClick={activeTabHandler} className="tab">
            Sell
          </button>
        </div>
      </div>

      <form onSubmit={orderHandler}>
        <label htmlFor="amount">{isBuy ? "Buy Amount" : "Sell Amount"}</label>
        <input
          type="text"
          id="amount"
          placeholder="0.0000"
          onChange={(e) => setAmount(e.target.value)}
        />

        <label htmlFor="price">{isBuy ? "Buy Price" : "Sell Price"}</label>
        <input
          type="text"
          id="price"
          placeholder="0.0000"
          onChange={(e) => setPrice(e.target.value)}
        />

        <button className="button button--filled" type="submit">
          {isBuy ? "Buy Amount" : "Sell Amount"}
        </button>
      </form>
    </div>
  );
};
