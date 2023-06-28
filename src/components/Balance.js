import { useSelector, useDispatch } from "react-redux";
import {
  loadBalances,
  transferTokens,
  crossChainDeposit,
} from "../store/interactions";
import { useEffect, useState, useRef } from "react";

export const Balance = () => {
  const [isDeposit, setIsDeposit] = useState(true);
  const [token1TransferAmount, setToken1TransferAmount] = useState(0);
  const [token2TransferAmount, setToken2TransferAmount] = useState(0);

  const symbols = useSelector((state) => state.tokens.symbols);
  const provider = useSelector((state) => state.provider.connection);
  const exchange = useSelector((state) => state.exchange.contract);
  const defaultExchange = useSelector(
    (state) => state.exchange.defaultExchangeContract
  );
  const bridge = useSelector((state) => state.exchange.bridgeContract);
  const tokens = useSelector((state) => state.tokens.contracts);
  const defaultTokenContracts = useSelector(
    (state) => state.tokens.defaultContracts
  );
  const account = useSelector((state) => state.provider.account);
  const tokenBalances = useSelector((state) => state.tokens.balances);
  const exchangeBalances = useSelector((state) => state.exchange.balances);
  const defaultChainID = useSelector((state) => state.exchange.defaultChain);
  const chainID = useSelector((state) => state.provider.chainId);
  const transferInProgress = useSelector(
    (state) => state.exchange.transferInProgress
  );

  const depositRef = useRef(null);
  const withdrawRef = useRef(null);

  const dispatch = useDispatch();

  useEffect(() => {
    const fetchData = async () => {
      if (defaultExchange && account && tokens) {
        await loadBalances(
          defaultExchange,
          tokens,
          defaultTokenContracts,
          dispatch,
          account
        );
      }
    };
    fetchData();
  }, [
    defaultExchange,
    tokens,
    defaultTokenContracts,
    account,
    transferInProgress,
  ]);

  function depositHandler(e, token) {
    e.preventDefault();
    if (defaultChainID === chainID) {
      if (token.address === tokens[0].address) {
        transferTokens(
          provider,
          exchange,
          "deposit",
          token,
          token1TransferAmount,
          dispatch
        );
      } else if (token.address === tokens[1].address) {
        transferTokens(
          provider,
          exchange,
          "deposit",
          token,
          token2TransferAmount,
          dispatch
        );
      }
    } else {
      if (token.address === tokens[0].address) {
        crossChainDeposit(
          provider,
          bridge,
          "deposit",
          token1TransferAmount,
          dispatch,
          defaultChainID,
          account,
          symbols[0],
          token
        );
      } else if (token.address === tokens[1].address) {
        crossChainDeposit(
          provider,
          bridge,
          "deposit",
          token2TransferAmount,
          dispatch,
          defaultChainID,
          account,
          symbols[1],
          token
        );
      }
    }
  }

  function withdrawHandler(e, token) {
    e.preventDefault();

    if (token.address === tokens[0].address) {
      transferTokens(
        provider,
        exchange,
        "withdraw",
        token,
        token1TransferAmount,
        dispatch
      );
    } else if (token.address === tokens[1].address)
      transferTokens(
        provider,
        exchange,
        "withdraw",
        token,
        token2TransferAmount,
        dispatch
      );
  }

  function activeTabHandler(e) {
    console.log(exchangeBalances);
    if (e.target.className !== depositRef.current.className) {
      depositRef.current.className = "tab";
      setIsDeposit(false);
    } else {
      withdrawRef.current.className = "tab";
      setIsDeposit(true);
    }
    e.target.className = "tab tab--active";
  }

  return (
    <div className="component exchange__transfers">
      <div className="component__header flex-between">
        <h2>Balance</h2>
        <div className="tabs">
          <button
            ref={depositRef}
            className="tab tab--active"
            onClick={activeTabHandler}
          >
            Deposit
          </button>
          <button ref={withdrawRef} className="tab" onClick={activeTabHandler}>
            Withdraw
          </button>
        </div>
      </div>

      <div className="exchange__transfers--form">
        <div className="flex-between">
          <p>
            <small>Token</small>
            <br /> {symbols && symbols[0]}{" "}
          </p>
          <p>
            <small>Wallet</small>
            <br />{" "}
            {tokenBalances &&
              tokenBalances[0] &&
              tokenBalances[0].substring(0, 10)}{" "}
          </p>
          <p>
            <small>Exchange</small>
            <br />{" "}
            {exchangeBalances &&
              exchangeBalances[0] &&
              exchangeBalances[0].substring(0, 10)}{" "}
          </p>
        </div>

        <form
          onSubmit={
            isDeposit
              ? (e) => depositHandler(e, tokens[0])
              : (e) => withdrawHandler(e, tokens[0])
          }
        >
          <label htmlFor="token0">{symbols && symbols[0]} Amount</label>
          <input
            type="text"
            id="token0"
            placeholder={token1TransferAmount}
            onChange={(e) => setToken1TransferAmount(e.target.value)}
          />

          <button className="button" type="submit">
            <span>{isDeposit ? "Deposit" : "Withdraw"}</span>
          </button>
        </form>
      </div>

      <hr />

      <div className="exchange__transfers--form">
        <div className="flex-between">
          <p>
            <small>Token</small>
            <br /> {symbols && symbols[1]}{" "}
          </p>
          <p>
            <small>Wallet</small>
            <br />{" "}
            {tokenBalances &&
              tokenBalances[1] &&
              tokenBalances[1].substring(0, 10)}{" "}
          </p>
          <p>
            <small>Exchange</small>
            <br />{" "}
            {exchangeBalances &&
              exchangeBalances[1] &&
              exchangeBalances[1].substring(0, 10)}{" "}
          </p>
        </div>

        <form
          onSubmit={
            isDeposit
              ? (e) => depositHandler(e, tokens[1])
              : (e) => withdrawHandler(e, tokens[1])
          }
        >
          <label htmlFor="token1">{symbols && symbols[1]} Amount</label>
          <input
            type="text"
            id="token1"
            placeholder={token2TransferAmount}
            onChange={(e) => setToken2TransferAmount(e.target.value)}
          />

          <button className="button" type="submit">
            <span>{isDeposit ? "Deposit" : "Withdraw"}</span>
          </button>
        </form>
      </div>

      <hr />
    </div>
  );
};
