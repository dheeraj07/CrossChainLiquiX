import { useSelector } from "react-redux";
import { ethers } from "ethers";

export const OrderBook = () => {
  const symbols = useSelector((state) => state.tokens.symbols);
  const sellOrders = useSelector((state) => state.exchange.sellOrders);
  const buyOrders = useSelector((state) => state.exchange.buyOrders);

  return (
    <div className="component exchange__orderbook">
      <div className="component__header flex-between">
        <h2>Order Book</h2>
      </div>

      <div className="flex">
        <table className="exchange__orderbook--sell">
          <caption>Selling</caption>
          <thead>
            <tr>
              <th>{symbols && symbols[0]}</th>
              <th>Filled</th>
              <th>
                {symbols && symbols[0]}/{symbols && symbols[1]}
              </th>
              <th>{symbols && symbols[1]}</th>
            </tr>
          </thead>
          <tbody>
            {sellOrders && sellOrders.length > 0 ? (
              sellOrders.map((order, index) => {
                return (
                  <tr key={index}>
                    <td>
                      {ethers.utils.formatUnits(
                        order._amount.toString(),
                        "ether"
                      )}
                    </td>
                    <td>
                      {ethers.utils.formatUnits(
                        order._filled.toString(),
                        "ether"
                      )}
                    </td>
                    <td style={{ color: "red" }}>
                      {ethers.utils.formatUnits(
                        order._price.toString(),
                        "ether"
                      )}
                    </td>
                    <td>
                      {(
                        parseFloat(
                          ethers.utils.formatUnits(order._amount, "ether")
                        ) *
                        parseFloat(
                          ethers.utils.formatUnits(order._price, "ether")
                        )
                      ).toFixed(4)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <p className="flex-center">No Sell orders</p>
            )}
          </tbody>
        </table>

        <div className="divider"></div>

        <table className="exchange__orderbook--buy">
          <caption>Buying</caption>
          <thead>
            <tr>
              <th>{symbols && symbols[0]}</th>
              <th>Filled</th>
              <th>
                {symbols && symbols[0]}/{symbols && symbols[1]}
              </th>
              <th>{symbols && symbols[1]}</th>
            </tr>
          </thead>
          <tbody>
            {buyOrders && buyOrders.length > 0 ? (
              buyOrders.map((order, index) => {
                return (
                  <tr key={index}>
                    <td>
                      {ethers.utils.formatUnits(
                        order._amount.toString(),
                        "ether"
                      )}
                    </td>
                    <td>
                      {ethers.utils.formatUnits(
                        order._filled.toString(),
                        "ether"
                      )}
                    </td>
                    <td style={{ color: "green " }}>
                      {ethers.utils.formatUnits(
                        order._price.toString(),
                        "ether"
                      )}
                    </td>
                    <td>
                      {(
                        parseFloat(
                          ethers.utils.formatUnits(order._amount, "ether")
                        ) *
                        parseFloat(
                          ethers.utils.formatUnits(order._price, "ether")
                        )
                      ).toFixed(4)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <p className="flex-center">No Buy orders</p>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
