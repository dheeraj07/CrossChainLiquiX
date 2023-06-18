import { ethers } from "ethers";
import TOKEN_ABI from "../abis/ERC20.json";
import EXCHANGE_ABI from "../abis/Exchange.json";
import BRIDGE_ABI from "../abis/Bridge.json";
import { useSelector } from "react-redux";
import config from "../config.json";

export const subscribeToEvents = (exchange, dispatch) => {
  exchange.on("DepositEve", (token, user, amount, event) => {
    dispatch({ type: "TRANSFER_SUCCESS", event });
  });

  exchange.on("WithdrawEve", (token, user, amount, event) => {
    dispatch({ type: "TRANSFER_SUCCESS", event });
  });

  exchange.on(
    "OrderEve",
    (
      orderId,
      trader,
      parentToken,
      tradeToken,
      amount,
      price,
      timestamp,
      event
    ) => {
      const order = event.args;
      dispatch({ type: "LIMIT_ORDER_SUCCESS", order, event });
    }
  );
};

export const fetchRegisterPairEvents = async (exchange, dispatch) => {
  /*const filterw = exchange.filters.OrderBookEve();
  const registeredPairsv = await exchange.queryFilter(filterw);
  console.log("{{{{")
  registeredPairsv.forEach((eac) => 
  {
    console.log(eac.args)
  });
  console.log("}}}}}")*/

  const filter = exchange.filters.RegisterMarketEve();
  const registeredPairs = await exchange.queryFilter(filter);
  dispatch({ type: "TOKEN_PAIR_REGISTERED", registeredPairs });
};

export const loadProvider = async (dispatch) => {
  const connection = new ethers.providers.Web3Provider(window.ethereum);
  dispatch({ type: "PROVIDER_LOADED", connection });

  return connection;
};

export const loadDefaultProvider = async (dispatch) => {
  const RPC_URL = "http://localhost:8500/0";
  const defaultConnection = new ethers.providers.JsonRpcProvider(RPC_URL);
  dispatch({ type: "DEFAULT_PROVIDER_LOADED", defaultConnection });

  return defaultConnection;
};

export const loadNetwork = async (dispatch, provider) => {
  const { chainId } = await provider.getNetwork();
  dispatch({ type: "NETWORK_LOADED", chainId });

  return chainId;
};

export const loadAccount = async (provider, dispatch) => {
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });
  const account = ethers.utils.getAddress(accounts[0]);
  dispatch({ type: "ACCOUNT_LOADED", account });

  let balance = await provider.getBalance(account);
  balance = ethers.utils.formatEther(balance);
  dispatch({ type: "BALANCE_LOADED", balance });

  return account;
};

export const loadTokens = async (addresses, provider, defaultProvider, defaultChainID, dispatch) => {
  let token,
    symbolA,
    symbolB,
    ticker = "";
  token = new ethers.Contract(addresses[0], TOKEN_ABI, provider);
  symbolA = await token.symbol();
  ticker += symbolA;
  dispatch({ type: "TOKEN_LOADED_1", token, symbolA });

  token = new ethers.Contract(addresses[1], TOKEN_ABI, provider);
  symbolB = await token.symbol();
  ticker += symbolB;

  dispatch({ type: "TOKEN_LOADED_2", token, symbolB });


  console.log("config[defaultChainID].tokens.symbolA:  ", config[defaultChainID].tokens[symbolA])
  console.log("config[defaultChainID].tokens.symbolB:   ", config[defaultChainID].tokens[symbolA])
  await loadDefaultTokens(
    config[defaultChainID].tokens[symbolA],
    config[defaultChainID].tokens[symbolB],
    defaultProvider,
    dispatch
  );


  return ticker;
};


export const loadDefaultTokens = async (address1, address2, provider, dispatch) => {
  let token;

  token = new ethers.Contract(address1, TOKEN_ABI, provider);
  dispatch({ type: "DEFAULT_TOKEN_LOADED_1", token });

  token = new ethers.Contract(address2, TOKEN_ABI, provider);
  dispatch({ type: "DEFAULT_TOKEN_LOADED_2", token });
};


export const loadMarketTicker = async (marketTicker, dispatch) => {
  dispatch({ type: "MARKET_TICKER_LOADED", marketTicker });
};

export const loadExchange = async (address, provider, dispatch) => {
  const exchangeAddr = new ethers.Contract(address, EXCHANGE_ABI, provider);
  dispatch({ type: "EXCHANGE_LOADED", exchangeAddr });

  return exchangeAddr;
};

export const loadDefaultExchange = async (address, provider, dispatch) => {
  const defaultExchangeAddr = new ethers.Contract(address, EXCHANGE_ABI, provider);
  dispatch({type: "DEFAULT_EXCHANGE_LOADED", defaultExchangeAddr})

  return defaultExchangeAddr;
};

export const loadBridgeContract = async (address, provider, dispatch) => {
  const bridgeContract = new ethers.Contract(address, BRIDGE_ABI, provider);
  dispatch({ type: "BRIDGE_LOADED", bridgeContract });

  return bridgeContract;
};

export const loadBalances = async (exchange, tokens, defaultTokenContracts, dispatch, account) => {
  let balances = ethers.utils.formatUnits(
    await tokens[0].balanceOf(account),
    18
  );
  dispatch({ type: "PARENT_TOKEN_BALANCE_LOADED", balances });

  balances = ethers.utils.formatUnits(
    await exchange.balanceOf(defaultTokenContracts[0].address, account),
    18
  );
  dispatch({
    type: "PARENT_TOKEN_EXCHANGE_BALANCE_LOADED",
    balances,
  });

  balances = ethers.utils.formatUnits(await tokens[1].balanceOf(account), 18);
  dispatch({ type: "TRADE_TOKEN_BALANCE_LOADED", balances });

  balances = ethers.utils.formatUnits(
    await exchange.balanceOf(defaultTokenContracts[1].address, account),
    18
  );
  dispatch({ type: "TRADE_TOKEN_EXCHANGE_BALANCE_LOADED", balances });
};

export const transferTokens = async (
  provider,
  exchange,
  transferType,
  token,
  amount,
  dispatch
) => {
  let txn;

  dispatch({ type: "TRANSFER_REQUEST" });

  try {
    const signer = await provider.getSigner();
    const amountToTransfer = ethers.utils.parseUnits(amount.toString(), 18);

    if (transferType === "deposit") {
      txn = await token
        .connect(signer)
        .approve(exchange.address, amountToTransfer);
      await txn.wait();
      txn = await exchange
        .connect(signer)
        .depositToken(token.address, amountToTransfer);
      await txn.wait();
    } else if (transferType === "withdraw") {
      txn = await exchange
        .connect(signer)
        .withdrawTokens(token.address, amountToTransfer);
    }
  } catch (error) {
    console.log(error);
    dispatch({ type: "TRANSFER_FAIL" });
  }
};


export const crossChainDeposit = async (
  provider,
  bridge,
  transferType,
  amount,
  dispatch,
  defaultChainID,
  userAddress,
  symbol,
  token
) => {
  let txn;

  dispatch({ type: "TRANSFER_REQUEST" });

  try {
    const signer = await provider.getSigner();
    const amountToTransfer = ethers.utils.parseUnits(amount.toString(), 18);

    console.log("config[defaultChainID].bridge.address:  ", config[defaultChainID].bridge.address);
      console.log("userAddress:  ", userAddress);
      console.log("symbol: ", symbol);
      console.log("amount:  ", amount);
      console.log("bridge:  ", bridge);
      console.log("bridge addr:  ", bridge.address)

    if (transferType === "deposit") {
      /*txn = await token
        .connect(signer)
        .approve(bridge.address, amountToTransfer);
      await txn.wait();*/
      console.log("initiating bridge 1st level");
      txn = await bridge
        .connect(signer)
        .approveAndTransfer(token.address,
                            amountToTransfer
                            );
      await txn.wait();
      console.log("initiating bridge 2nd level");
      txn = await bridge
        .connect(signer)
        .depositCrossChain("Moonbeam", 
                            config[defaultChainID].bridge.address, 
                            userAddress, 
                            symbol, 
                            amountToTransfer,
                            {value: ethers.utils.parseUnits('1', 'ether')}
                            );
      await txn.wait();
      console.log(txn)
    }
  } catch (error) {
    console.log(error);
    dispatch({ type: "TRANSFER_FAIL" });
  }
};

export const initiateLimitOrder = async (
  provider,
  exchange,
  symbols,
  order,
  dispatch
) => {
  const marketName = symbols[0] + symbols[1];
  console.log("trade limit:  ", marketName);
  const orderAmount = ethers.utils.parseUnits(order.amount, 18);
  const orderPrice = ethers.utils.parseUnits(order.price, 18);
  const orderType = order.orderType;

  dispatch({ type: "NEW_LIMIT_ORDER" });

  try {
    const signer = await provider.getSigner();
    const txn = await exchange
      .connect(signer)
      .limitOrder(orderAmount, orderPrice, orderType, marketName, false, signer._address);
    await txn.wait();
  } catch (error) {
    console.log("LIMIT ORDER FAILED");
    dispatch({ type: "LIMIT_ORDER_FAIL" });
  }
};


export const initiateCrossChainLimitOrder = async (
  provider,
  bridge,
  symbols,
  order,
  dispatch,
  defaultChainID,
  account
) => {
  const marketName = symbols[0] + symbols[1];
  const orderAmount = ethers.utils.parseUnits(order.amount, 18);
  const orderPrice = ethers.utils.parseUnits(order.price, 18);
  const orderType = order.orderType;

  dispatch({ type: "NEW_LIMIT_ORDER" });
  console.log("bridge:   ", bridge.address)

    const signer = await provider.getSigner();
    const txn = await bridge.connect(signer)
      .crossChainTrade("Moonbeam", 
                        config[defaultChainID].bridge.address, 
                        orderAmount, 
                        orderPrice, 
                        orderType, 
                        marketName, 
                        0, 
                        account, {value: ethers.utils.parseUnits('1', 'ether')});
    await txn.wait();
    console.log(txn);
};


export const initiateCrossChainMarketOrder = async (
  provider,
  bridge,
  symbols,
  order,
  dispatch,
  defaultChainID,
  account
) => {
  const marketName = symbols[0] + symbols[1];
  const orderAmount = ethers.utils.parseUnits(order.amount, 18);
  const orderPrice = ethers.utils.parseUnits(order.price, 18);
  const orderType = order.orderType;

    const signer = await provider.getSigner();
    const txn = await bridge.connect(signer)
      .crossChainTrade("Moonbeam", 
                        config[defaultChainID].bridge.address, 
                        orderAmount, 
                        orderPrice, 
                        orderType, 
                        marketName, 
                        1, 
                        account, {value: ethers.utils.parseUnits('1', 'ether')});
    await txn.wait();
    console.log(txn);
};

export const setDefaultChain = async (dispatch) => 
{
  const defaultChainID = 2500;
  dispatch({type: "SET_DEFAULT_CHAIN", defaultChainID})
  return defaultChainID;
}

export const initiateMarketOrder = async (
  provider,
  exchange,
  symbols,
  order,
  dispatch
) => {
  const marketName = symbols[0] + symbols[1];
  console.log("trade market:  ", marketName);
  const orderAmount = ethers.utils.parseUnits(order.amount, 18);
  const orderPrice = ethers.utils.parseUnits(order.price, 18);
  const orderType = order.orderType;

  try {
    const signer = await provider.getSigner();
    const txn = await exchange
      .connect(signer)
      .marketOrder(orderAmount, orderPrice, orderType, marketName);
    await txn.wait();
  } catch (error) {
    console.log(error);
    console.log("MARKET ORDER FAILED");
    dispatch({ type: "LIMIT_ORDER_FAIL" });
  }
};

export const registerMarket = async (
  provider,
  exchange,
  token1,
  token2,
  dispatch
) => {
  try {
    const signer = await provider.getSigner();
    const txn = await exchange
      .connect(signer)
      .RegisterMarket(token1, token2, "USDT", "MINA");
    await txn.wait();
    await fetchRegisterPairEvents(exchange, dispatch);
  } catch (error) {
    console.log("Registering market failed");
    console.log(error);
  }
};

async function getOrders(marketname, index, provider, exchange, account) {
  const signer = await provider.getSigner();

  let arrayLength = await exchange
    .connect(signer)
    .getOrderBookLength(index, marketname);

    console.log("arrayLength:  ", arrayLength);
  let orders = [];
  for (let i = 0; i < arrayLength; i++) {
    const order = await exchange
      .connect(signer)
      .orderBook(marketname, index, i);
    orders.push(order);
  }
  return orders;
}

export const loadAllOrders = async (
  marketName,
  provider,
  exchange,
  dispatch,
  account
) => {
  console.log("provider:  ",provider);
  console.log("exchange:  ",exchange)
  let buyOrders = await getOrders(marketName, 0, provider, exchange, account);
  let sellOrders = await getOrders(marketName, 1, provider, exchange, account);

  await loadUserOrders(sellOrders, buyOrders, dispatch, account);

  dispatch({ type: "BUY_ORDERS_LOADED", buyOrders });
  dispatch({ type: "SELL_ORDERS_LOADED", sellOrders });
};

export const loadAllTrades = async (marketName, exchange, dispatch) => {
  const filter = exchange.filters.TradeEve(
    marketName,
    null,
    null,
    null,
    null,
    null,
    null
  );
  let allTrades = await exchange.queryFilter(filter);

  dispatch({ type: "ALL_TRADES_LOADED", allTrades });
};

export const loadUserOrders = async (
  sellOrders,
  buyOrders,
  dispatch,
  account
) => {
  let userOrders = [];

  for (let i = 0; i < sellOrders.length; i++) {
    if (account === sellOrders[i]._trader) {
      userOrders.push(sellOrders[i]);
    }
  }

  for (let i = 0; i < buyOrders.length; i++) {
    if (account === buyOrders[i]._trader) {
      userOrders.push(buyOrders[i]);
    }
  }

  dispatch({ type: "USER_ORDERS_LOADED", userOrders });
};

export const loadUserTrades = async (
  marketName,
  exchange,
  dispatch,
  account
) => {
  const filter = exchange.filters.TradeEve(
    marketName,
    null,
    account,
    null,
    null,
    null,
    null
  );
  let userTrades = await exchange.queryFilter(filter);

  dispatch({ type: "USER_TRADES_LOADED", userTrades });
};

export const cancelOrder = async (
  order,
  provider,
  exchange,
  dispatch,
  account,
  marketTicker
) => {

  const signer = await provider.getSigner();
  const txn = await exchange
    .connect(signer)
    .cancelOrder(order._orderId.toNumber(), order.side, marketTicker);
  await txn.wait();
  console.log("order cancalled successfully");
};

export const reloadTradeDashBoard = async (
  marketName,
  provider,
  exchange,
  dispatch,
  account
) => {
  await loadAllOrders(marketName, provider, exchange, dispatch, account);
  await loadAllTrades(marketName, exchange, dispatch);
  await loadUserTrades(marketName, exchange, dispatch, account);
};