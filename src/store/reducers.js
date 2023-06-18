export const provider = (state = {}, action) => {
  switch (action.type) {
    case "PROVIDER_LOADED":
      return {
        ...state,
        connection: action.connection,
      };
    case "DEFAULT_PROVIDER_LOADED":
      return {
        ...state,
        defaultConnection: action.defaultConnection,
      };
    case "NETWORK_LOADED":
      return {
        ...state,
        chainId: action.chainId,
      };
    case "ACCOUNT_LOADED":
      return {
        ...state,
        account: action.account,
      };
    case "BALANCE_LOADED":
      return {
        ...state,
        balance: action.balance,
      };
    default:
      return state;
  }
};

export const tokens = (
  state = { loaded: false, contracts: [], symbols: [], balances: [], defaultContracts: [] },
  action
) => {
  switch (action.type) {
    case "TOKEN_LOADED_1":
      return {
        ...state,
        loaded: true,
        contracts: [action.token],
        symbols: [action.symbolA],
      };
    case "PARENT_TOKEN_BALANCE_LOADED":
      return {
        ...state,
        balances: [action.balances],
      };
    case "TOKEN_LOADED_2":
      return {
        ...state,
        loaded: true,
        contracts: [...state.contracts, action.token],
        symbols: [...state.symbols, action.symbolB],
      };
    case "DEFAULT_TOKEN_LOADED_1":
      return {
        ...state,
        defaultContracts: [action.token]
      };
    case "DEFAULT_TOKEN_LOADED_2":
      return {
        ...state,
        defaultcontracts: [...state.defaultContracts, action.token]
      };
    case "TRADE_TOKEN_BALANCE_LOADED":
      return {
        ...state,
        balances: [...state.balances, action.balances],
      };
    default:
      return state;
  }
};

export const exchange = (
  state = { loaded: false, contract: {}, bridgeContract: {}, defaultExchangeContract: {}, transaction: { isSuccessfu: false}, events: [], sellOrders:[], buyOrders: [], markets: [], market: "", allTrades: [], userOrders: [], userTrades: [], defaultChain: 0},
  action
) => {
  switch (action.type) {
    case "EXCHANGE_LOADED":
      return {
        ...state,
        loaded: true,
        contract: action.exchangeAddr,
      }
    case "DEFAULT_EXCHANGE_LOADED":
    return {
      ...state,
      defaultExchangeContract: action.defaultExchangeAddr,
    }
    case "BRIDGE_LOADED":
      return {
        ...state,
        bridgeContract: action.bridgeContract,
      }
    case "SET_DEFAULT_CHAIN":
      return {
        ...state,
        defaultChain: action.defaultChainID
      }
    case "MARKET_TICKER_LOADED":
      return {
        ...state,
        market: action.marketTicker
      }
    case "BUY_ORDERS_LOADED":
      return {
        ...state,
        buyOrders: action.buyOrders,
      }
    case "SELL_ORDERS_LOADED":
      return {
        ...state,
        sellOrders: action.sellOrders,
      }
    case "ALL_TRADES_LOADED":
      return {
        ...state,
        allTrades: action.allTrades,
      }
    case "USER_ORDERS_LOADED":
      return {
        ...state,
        userOrders: action.userOrders,
      }
    case "USER_TRADES_LOADED":
      return {
        ...state,
        userTrades: action.userTrades,
      }
    case "TOKEN_PAIR_REGISTERED":
      return {
        ...state,
        markets: action.registeredPairs
      }
    case "TOKEN_PAIR_LOADED":
      return {
        ...state,
        markets: action.registeredPairs
      }
    case "PARENT_TOKEN_EXCHANGE_BALANCE_LOADED":
      return {
        ...state,
        balances: [action.balances],
      };
    case "TRADE_TOKEN_EXCHANGE_BALANCE_LOADED":
      return {
        ...state,
        balances: [...state.balances, action.balances],
      };
    case "TRANSFER_REQUEST":
      return {
        ...state,
        transaction: {
          transactionType: "Transfer",
          isPending: true,
          isSuccessful: false,
        },
        transferInProgress: true,
      };
    case "TRANSFER_SUCCESS":
      return {
        ...state,
        transaction: {
          transactionType: "Transfer",
          isPending: false,
          isSuccessful: true,
        },
        transferInProgress: false,
        events: [action.event, ...state.events],
      };
    case "TRANSFER_FAIL":
      return {
        ...state,
        transaction: {
          transactionType: "Transfer",
          isPending: false,
          isSuccessful: false,
          isError: true,
        },
        transferInProgress: false,
      };
    default:
      return state;
  }
};
