import { use } from "chai";
import logo from "../assets/logo.png";
import eth from "../assets/eth.svg";
import { useSelector, useDispatch } from "react-redux";
import Blockies from "react-blockies";
import { loadAccount } from "../store/interactions";
import config from "../config.json";

export const Navbar = () => {
  const account = useSelector((state) => state.provider.account);
  const balance = useSelector((state) => state.provider.balance);
  const provider = useSelector((state) => state.provider.connection);
  const chainID = useSelector((state) => state.provider.chainId);

  const dispatch = useDispatch();

  const connectHandler = async () => {
    await loadAccount(provider, dispatch);
  };

  const networkHandler = async (event) => {
    console.log(chainID.toString(16));
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: event.target.value }],
    });
  };

  return (
    <div className="exchange__header grid">
      <div className="exchange__header--brand flex">
        <img src={logo} className="logo" alt="logo"></img>
        <h1>CrossChainLiquiX</h1>
      </div>

      <div className="exchange__header--networks flex">
        <img src={eth} className="ETH" alt="ETH Logo"></img>
        {chainID && (
          <select
            name="networks"
            id="networks"
            value={config[chainID] ? `0x${chainID.toString(16)}` : "0"}
            onChange={networkHandler}
          >
            <option value="0">Select Network</option>
            <option value="0x7A69">Localhost</option>
            <option value="0x5">Goerili</option>
            <option value="0x9C8">Polygon - Axelar</option>
            <option value="0x9C4">Moonbeam - Axelar</option>
          </select>
        )}
      </div>

      <div className="exchange__header--account flex">
        <p>Balance: {balance && Number(balance).toFixed(4)}</p>
        {account ? (
          <a
            href={
              config[chainID]
                ? `${config[chainID].explorerURL}/${account}`
                : `#`
            }
            target="_blank"
          >
            {account.slice(0, 6) +
              "..." +
              account.slice(account.length - 5, account.length)}
            <Blockies
              seed={account}
              size={10}
              scale={3}
              className="identicon"
            />
          </a>
        ) : (
          <button className="button" onClick={connectHandler}>
            Connect
          </button>
        )}
      </div>
    </div>
  );
};
