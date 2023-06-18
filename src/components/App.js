import { useEffect } from "react";
import config from "../config.json";
import { useDispatch } from "react-redux";
import {
  loadProvider,
  loadNetwork,
  loadAccount,
  loadExchange,
  subscribeToEvents,
  fetchRegisterPairEvents,
  setDefaultChain,
  loadBridgeContract,
  loadDefaultExchange,
  loadDefaultProvider
} from "../store/interactions";
import { Navbar } from "./Navbar";
import { Markets } from "./Markets";
import { Balance } from "./Balance";
import { Order } from "./Order";
import { RegisterMarkets } from "./RegisterMarket";
import { OrderBook } from "./Orderbook";
import { Trades } from "./Trades";
import { Transactions } from "./MyTransactions";

function App() {
  const dispatch = useDispatch();

  const loadBlockchainData = async () => {
    const provider = await loadProvider(dispatch);
    const defaultProvider = await loadDefaultProvider(dispatch);
    const chainID = await loadNetwork(dispatch, provider);

    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });

    window.ethereum.on("accountsChanged", async () => {
      await loadAccount(provider, dispatch);
    });

    const defaultChainID = await setDefaultChain(dispatch);

    const exchange = await loadExchange(
      config[chainID].exchange.address,
      provider,
      dispatch
    );

    const defaultExchange = await loadDefaultExchange(
      config[defaultChainID].exchange.address,
      defaultProvider,
      dispatch
    );

    console.log("defaultExchange:   ", defaultExchange)

    const bridge = await loadBridgeContract(
      config[chainID].bridge.address,
      provider,
      dispatch
    );

    await fetchRegisterPairEvents(exchange, dispatch);
    subscribeToEvents(exchange, dispatch);
  };

  useEffect(() => {
    loadBlockchainData();
  });

  return (
    <div>
      <Navbar />

      <main className="exchange grid">
        <section className="exchange__section--left grid">
          <RegisterMarkets />

          <Markets />

          <Balance />

          <Order />
        </section>
        <section className="exchange__section--right grid">
          <OrderBook />

          <Transactions />

          <Trades />
        </section>
      </main>

      {/* Alert */}
    </div>
  );
}

export default App;
