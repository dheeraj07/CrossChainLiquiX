import { useDispatch, useSelector } from "react-redux";
import { ethers } from "ethers";
import { NoContent } from "./NoContent";
import { useRef, useState } from "react";
import { cancelOrder, reloadTradeDashBoard } from "../store/interactions";
const moment = require("moment");

export const Transactions = () => {
  const tradeRef = useRef(null);
  const orderRef = useRef(null);
  const [showOrders, setShowOrders] = useState(true);
  const symbols = useSelector((state) => state.tokens.symbols);
  const marketTicker = useSelector((state) => state.exchange.market);
  const dispatch = useDispatch();

  const userOrders = useSelector((state) => state.exchange.userOrders);
  const userTrades = useSelector((state) => state.exchange.userTrades);
  const account = useSelector((state) => state.provider.account);
  const provider = useSelector((state) => state.provider.connection);
  const exchange = useSelector((state) => state.exchange.contract);

  const tabHandler = (e) => {
    if (e.target.className !== orderRef.current.className) {
      orderRef.current.className = "tab";
      setShowOrders(false);
    } else {
      tradeRef.current.className = "tab";
      setShowOrders(true);
    }
    e.target.className = "tab tab--active";
  };

  const cancelHandler = async (order) => {
    await cancelOrder(
      order,
      provider,
      exchange,
      dispatch,
      account,
      marketTicker
    );
    await reloadTradeDashBoard(
      marketTicker,
      provider,
      exchange,
      dispatch,
      account
    );
  };

  return (
    <div className="component exchange__transactions">
      {showOrders ? (
        <div>
          <div className="component__header flex-between">
            <h2>My Orders</h2>

            <div className="tabs">
              <button
                onClick={tabHandler}
                ref={orderRef}
                className="tab tab--active"
              >
                Orders
              </button>
              <button onClick={tabHandler} ref={tradeRef} className="tab">
                Trades
              </button>
            </div>
          </div>

          {userOrders && userOrders.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Amount({symbols[0]})</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {userOrders && userOrders.length > 0 ? (
                  userOrders.map((order, index) => {
                    //TRY TO SHOW THESE COLUMNS: DATE / BOUGHT X / SOLD Y
                    return (
                      <tr key={index}>
                        <td
                          style={{ color: order.side === 1 ? "red" : "green" }}
                        >
                          {ethers.utils.formatUnits(
                            order._amount.toString(),
                            "ether"
                          )}
                        </td>
                        <td>
                          {moment
                            .unix(order._timestamp.toString())
                            .format("YYYY-MM-DD")}
                        </td>
                        <td>
                          <button
                            className="button--sm"
                            onClick={() => cancelHandler(order)}
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr className="flex-center">No Orders</tr>
                )}
              </tbody>
            </table>
          ) : (
            <NoContent text="No Orders" />
          )}
        </div>
      ) : (
        <div>
          <div className="component__header flex-between">
            <h2>My Trades</h2>

            <div className="tabs">
              <button
                onClick={tabHandler}
                ref={orderRef}
                className="tab tab--active"
              >
                Orders
              </button>
              <button onClick={tabHandler} ref={tradeRef} className="tab">
                Trades
              </button>
            </div>
          </div>

          {userTrades && userTrades.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Order-ID</th>
                  <th>Trade Amount</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {userTrades && userTrades.length > 0 ? (
                  userTrades.map((trade, index) => {
                    //TRY TO SHOW THESE COLUMNS: DATE / BOUGHT X / SOLD Y
                    return (
                      <tr key={index}>
                        <td>{trade.args._orderId.toString()}</td>
                        <td style={{ color: "green " }}>
                          {ethers.utils.formatUnits(
                            trade.args._tradeAmount.toString(),
                            "ether"
                          )}
                        </td>
                        <td>
                          {moment
                            .unix(trade.args._timestamp.toString())
                            .format("YYYY-MM-DD")}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr className="flex-center">No Trades</tr>
                )}
              </tbody>
            </table>
          ) : (
            <NoContent text="No Trades" />
          )}
        </div>
      )}
    </div>
  );
};
