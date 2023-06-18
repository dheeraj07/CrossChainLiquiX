import { useSelector } from "react-redux";
import { ethers } from "ethers";
import { NoContent } from "./NoContent";
const moment = require("moment");

export const Trades = () => {
  const allTrades = useSelector((state) => state.exchange.allTrades);

  return (
    <div className="component exchange__trades">
      <div className="component__header flex-between">
        <h2>Trades</h2>
      </div>

      {allTrades && allTrades.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Order-ID</th>
              <th>Trade Amount</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {allTrades.map((trade, index) => {
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
            })}
          </tbody>
        </table>
      ) : (
        <NoContent text="No Trades" />
      )}
    </div>
  );
};
