//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.1;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import { TokenBridge } from "./Bridge.sol";

contract Exchange is Ownable {
    using Counters for Counters.Counter;
    TokenBridge bridgeContract;

    constructor(address _feeAccount, uint _feePercent)
    {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }
    
    struct Market
    {
        address _parentToken;
        address _tradeToken;
    }

    struct Order
    {
        uint _orderId;
        address _trader;
        Trade side;
        address _parentToken;
        address _tradeToken;
        uint _amount;
        uint _filled;
        uint _price;
        uint _timestamp;
    }

    enum Trade
    {
        BUY,
        SELL
    }

    address public feeAccount;
    uint public feePercent;
    mapping(address => mapping(address => uint)) public userBalances;
    mapping(string => mapping(uint => Order[])) public orderBook;
    mapping(string => Market) public marketsTraded;
    mapping(address => mapping(address => uint)) public pendingOrders;
    Counters.Counter public ordersCounter;
    Counters.Counter public tradesCounter;

    event RegisterMarketEve(
        address _parentToken,
        address _tradeToken,
        string _parentTokenSymbol,
        string _tradeTokenSymbol,
        string _marketName
    );

    event DepositEve(
        address _tokenAddress, 
        address _userAddress, 
        uint _amount
    );

    event WithdrawEve(
        address _tokenAddress, 
        address _receiverAddress, 
        uint _amount
    );

    event OrderEve(
        string indexed _marketName,
        uint indexed _orderId,
        address indexed _trader,
        Trade _side,
        uint _amount,
        uint _price,
        uint _timestamp
    );

    event TradeEve(
        string indexed _marketName,
        uint indexed _orderId,
        address indexed _trader,
        uint _tradeId,
        uint _tradeAmount,
        uint _feeAmount,
        uint _timestamp
    );

    /*event CancelEve(
        string indexed _marketName,
        uint indexed _orderId,
        address indexed _trader,
        uint _timestamp
    );*/


//NEED TO VERIFY THIS CHECK
    modifier isMarketActive(string memory _market) 
    {
        Market memory info = marketsTraded[_market];
        Market memory defaultInfo = Market(address(0), address(0));
        require(keccak256(abi.encode(info)) != keccak256(abi.encode(defaultInfo)), "Invalid Market Specified.");
        _;
    }

    modifier isBalanceInvolvedInTransaction(address _owner, address _token, uint _amount)
    {
        require((userBalances[_token][_owner] >= _amount) && ((userBalances[_token][_owner] - pendingOrders[_token][_owner]) >= _amount),"Cannot process this transaction due to pending orders.");
        _;
    }

    function initialiseBridgeContract(address _bridgeContract)
    public 
    onlyOwner
    {
        bridgeContract = TokenBridge(_bridgeContract);
    }

    function RegisterMarket(address _parentToken, address _tradeToken, string memory _parentTokenSymbol, string memory _tradeTokenSymbol) 
    onlyOwner
    public
    {
        bool success;
        bytes memory data;
       (success, data) = address(IERC20(_parentToken)).staticcall(abi.encodeWithSignature("symbol()"));
       if(success) 
       {
        _parentTokenSymbol = abi.decode(data, (string));
       }
       (success, data) = address(IERC20(_tradeToken)).staticcall(abi.encodeWithSignature("symbol()"));
       if(success) 
       {
        _tradeTokenSymbol = abi.decode(data, (string));
       }

        string memory marketName = string(abi.encodePacked(_parentTokenSymbol, _tradeTokenSymbol));
        marketsTraded[marketName] = Market(_parentToken, _tradeToken);

        emit RegisterMarketEve(_parentToken, _tradeToken, _parentTokenSymbol, _tradeTokenSymbol, marketName);
    }

    function isMarketEnabled(string memory _market)
    isMarketActive(_market)
    public
    view
    returns(bool)
    {
        return true;
    }

    function depositToken(address _token, uint _amount) 
    public
    {
        require(IERC20(_token).balanceOf(msg.sender) >= _amount, "Insufficient balance.");
        require(IERC20(_token).allowance(msg.sender,(address(this))) >= _amount, "Insufficient allowance.");

        IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        userBalances[_token][msg.sender] += _amount;
        emit DepositEve(_token, msg.sender, _amount);
    }

    /**
     * Make sure to call this function only from the bridge contract.
     * Initialise the bridge contract address in a function which can be called only by the owner.
     */
    function depositTokenCrossChain(address _token, uint _amount, address _msgSender)
    public
    {
        userBalances[_token][_msgSender] += _amount;
        emit DepositEve(_token, _msgSender, _amount);
    }

    function withdrawTokens(address _token, uint _amount)
    isBalanceInvolvedInTransaction(msg.sender, _token, _amount)
    public
    {
        require(userBalances[_token][msg.sender] >= _amount, "Insufficient balance.");

        userBalances[_token][msg.sender] -= _amount;
        IERC20(_token).transfer(msg.sender, _amount);
        emit WithdrawEve(_token, msg.sender, _amount);
    }

    function withdrawTokenCrossChain(address _token, uint _amount, address _receiver)
    public
    {
        IERC20(_token).transfer(_receiver, _amount);
        emit WithdrawEve(_token, _receiver, _amount);
    }

    function withdrawTokenCrossChainHelper(string memory _destinationChain, string memory _destinationAddress, address _token, string memory _symbol, uint _amount)
    isBalanceInvolvedInTransaction(msg.sender, _token, _amount)
    public
    {
        require(userBalances[_token][msg.sender] >= _amount, "Insufficient balance.");

        userBalances[_token][msg.sender] -= _amount;
        userBalances[_token][address(bridgeContract)] += _amount;
        bridgeContract.withdrawCrossChain(_destinationChain, _destinationAddress, msg.sender, _symbol, _amount);
    }

    function restrictTradeAction(address _owner, address _token, uint _amount)
    internal
    view
    returns(bool)
    {
        if((userBalances[_token][_owner] < _amount) || (userBalances[_token][_owner] - pendingOrders[_token][_owner]) < _amount)
        {
            return true;
        }
        return false;
    }

    function balanceOf(address _token, address _user) 
    public
    view 
    returns(uint)
    {
        return userBalances[_token][_user];
    }

    function getOrderBookLength(Trade _side, string memory _market)
    public
    view
    returns(uint)
    {
        return orderBook[_market][uint(_side)].length;
    }

    function limitOrder(uint _amount, uint _price, uint _tradeSide, string memory _market, bool isCrossChain, address _tradeInit) 
    isMarketActive(_market)
    public
    {
        _tradeInit = isCrossChain ? _tradeInit : msg.sender;
        Market memory currentMarket = marketsTraded[_market];
        if(Trade(_tradeSide) == Trade.SELL)
        {
            require(!restrictTradeAction(_tradeInit, currentMarket._parentToken, _amount), "Cannot process this transaction due to pending orders.");
            pendingOrders[currentMarket._parentToken][_tradeInit] += _amount;
        }
        else if(Trade(_tradeSide) == Trade.BUY)
        {
            require(!restrictTradeAction(_tradeInit, currentMarket._tradeToken, _amount), "Cannot process this transaction due to pending orders.");
            pendingOrders[currentMarket._tradeToken][_tradeInit] += ((_amount * _price)/(10 ** 18)); 
        }

        Order[] storage orders = orderBook[_market][_tradeSide];
        ordersCounter.increment();
        orders.push(Order(
            ordersCounter.current(),
            _tradeInit,
            Trade(_tradeSide),
            currentMarket._parentToken,
            currentMarket._tradeToken,
            _amount,
            0,
            _price,
            block.timestamp
        ));
        sortTheArrayOrders(_market, Trade(_tradeSide));
        emit OrderEve(
        _market,
        ordersCounter.current(),
        _tradeInit,
        Trade(_tradeSide),
        _amount,
        _price,
        block.timestamp
        );
    }

    function marketOrder(uint _amount, uint _price, uint _tradeSide, string memory _market, bool isCrossChain, address _tradeInit) 
    isMarketActive(_market)
    public
    {
         _tradeInit = isCrossChain ? _tradeInit : msg.sender;
        Market memory currentMarket = marketsTraded[_market];
        if(Trade(_tradeSide) == Trade.SELL)
        {
            require(userBalances[currentMarket._parentToken][_tradeInit] >= _amount, "Insufficient balance.");
        }
        else if(Trade(_tradeSide) == Trade.BUY)
        {
            uint currentMarketPrice = getMarketPrice(_market, Trade.SELL);
            require(userBalances[currentMarket._tradeToken][_tradeInit] >= (currentMarketPrice <= 0 ? _amount :((currentMarketPrice * _amount)/(10 ** 18))), "Insufficient balance.");
        }

        Order[] storage orders = orderBook[_market][uint(Trade(_tradeSide) == Trade.SELL ? Trade.BUY : Trade.SELL)];
        uint i = 0;
        uint remaining = _amount;
        uint feeAmount;
        uint originalOrdersLength = orders.length;

        while(i < orders.length && remaining > 0)
        {
            tradesCounter.increment();
            uint available = orders[i]._amount - orders[i]._filled;
            uint matched = (remaining > available) ? available : remaining;
            feeAmount = ((((matched * orders[i]._price)/(10 ** 18)) * feePercent)/(10 ** 20));
            if(Trade(_tradeSide) == Trade.SELL)
            {
                require(!restrictTradeAction(_tradeInit, currentMarket._parentToken, matched) && (originalOrdersLength == orders.length), "Cannot process this transaction due to pending orders.");
                if(restrictTradeAction(_tradeInit, currentMarket._parentToken, matched))
                {
                    break;
                }

                pendingOrders[currentMarket._tradeToken][orders[i]._trader] -= ((matched * orders[i]._price)/(10 ** 18));

                userBalances[currentMarket._parentToken][_tradeInit] -= matched;
                userBalances[currentMarket._tradeToken][_tradeInit] += (((matched * orders[i]._price)/(10 ** 18)) - feeAmount);
                userBalances[currentMarket._tradeToken][feeAccount] += feeAmount;

                userBalances[currentMarket._parentToken][orders[i]._trader] += matched;
                userBalances[currentMarket._tradeToken][orders[i]._trader] -= ((matched * orders[i]._price)/(10 ** 18));
            }
            else if(Trade(_tradeSide) == Trade.BUY)
            {
                require(!restrictTradeAction(_tradeInit, currentMarket._tradeToken, ((matched * orders[i]._price)/(10 ** 18))) && (originalOrdersLength == orders.length), "Cannot process this transaction due to pending orders.");
                if(restrictTradeAction(_tradeInit, currentMarket._tradeToken, (matched * orders[i]._price)/(10 ** 18)))
                {
                    break;
                }

                pendingOrders[currentMarket._parentToken][orders[i]._trader] -= matched;

                userBalances[currentMarket._parentToken][_tradeInit] += (matched - feeAmount);
                userBalances[currentMarket._parentToken][feeAccount] += feeAmount;
                userBalances[currentMarket._tradeToken][_tradeInit] -= ((matched * orders[i]._price)/(10 ** 18));

                userBalances[currentMarket._parentToken][orders[i]._trader] -= matched;
                userBalances[currentMarket._tradeToken][orders[i]._trader] += ((matched * orders[i]._price)/(10 ** 18));
            }
            remaining = remaining - matched;
            orders[i]._filled += matched;
            tradesCounter.increment();
            emit TradeEve(
                _market,
                ordersCounter.current(),
                orders[i]._trader,
                tradesCounter.current(),
                matched,
                matched,
                block.timestamp
            );
            i++;
        }
        i = 0;
        while(i < orders.length && orders[i]._filled == orders[i]._amount)
        {
            for(uint j = i; j < orders.length - 1; j++)
            {
                orders[j] = orders[j+1];
            }
            orders.pop();
        }
        if(remaining > 0)
        {
            limitOrder(remaining, _price, _tradeSide, _market, false, _tradeInit);
        }
    }

    function getMarketPrice(string memory _market, Trade _side)
    internal
    view
    returns(uint)
    {
        if(getOrderBookLength(_side, _market) > 0)
        {
            return orderBook[_market][uint(_side)][0]._price;
        }
        return 0;
    }

    function sortTheArrayOrders(string memory _market, Trade _side) 
    internal
    {
        Order[] storage orders = orderBook[_market][uint(_side)];
        if(_side == Trade.SELL)
        {
            quickSort(orders, int(0), int(orders.length - 1), false);
        }
        else if(_side == Trade.BUY)
        {
            quickSort(orders, int(0), int(orders.length - 1), true);
        }
        
    }

    function quickSort(Order[] storage _arr, int _left, int _right, bool _isBuy) 
    internal
    {
        int i = _left;
        int j = _right;
        if (i == j) return;
        uint pivot = _arr[uint(_left + (_right - _left) / 2)]._price;
        while (i <= j) 
        {
            if (_isBuy) 
            {
                while (_arr[uint(i)]._price > pivot) i++;
                while (pivot > _arr[uint(j)]._price) j--;
            } 
            else 
            {
                while (_arr[uint(i)]._price < pivot) i++;
                while (pivot < _arr[uint(j)]._price) j--;
            }
            if (i <= j) 
            {
                Order memory val = _arr[uint(i)];
                _arr[uint(i)] = _arr[uint(j)];
                _arr[uint(j)] = val;
                i++;
                j--;
            }
        }
        if (_left < j)
        {
            quickSort(_arr, _left, j, _isBuy);
        }
        if (i < _right)
        {
            quickSort(_arr, i, _right, _isBuy);
        }
    }

    function cancelOrder(uint _orderId, Trade _side, string memory _market)
    public
    returns(bool)
    {
        require(_orderId <= ordersCounter.current(), "Invalid Order.");
        Order[] storage orders = orderBook[_market][uint(_side)];
        uint i = 0;
        uint initialOrderBooklength = orders.length;
        while(i < orders.length)
        {
            if(orders[i]._orderId == _orderId)
            {
                require(orders[i]._filled == 0 && orders[i]._trader == msg.sender, "Not authorized to cancel this order.");
                if(i != orders.length - 1)
                {
                    for(uint j = i; j < orders.length - 1; j++)
                    {
                        orders[j] = orders[j+1];
                    }
                }
                orders.pop();
                //emit CancelEve(_market, _orderId, msg.sender, block.timestamp);
                break;
            }
            i++;
        }
        return initialOrderBooklength == orders.length+1;
    }
}