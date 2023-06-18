//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AxelarExecutable } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/executable/AxelarExecutable.sol';
import { IAxelarGateway } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGateway.sol';
import { IERC20 } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IERC20.sol';
import { IAxelarGasService } from '@axelar-network/axelar-gmp-sdk-solidity/contracts/interfaces/IAxelarGasService.sol';
import { Exchange } from './Exchange.sol';

interface IBatch {
    function batchAll(
        address[] calldata to,
        uint256[] calldata value,
        bytes[] calldata callData,
        uint64[] calldata gasLimit
    ) external;
}

contract TokenBridge is AxelarExecutable {
    IAxelarGasService public immutable gasService;
    Exchange public exc;
    IBatch public batcher = IBatch(0x0000000000000000000000000000000000000808);

    constructor(address gateway_, address gasReceiver_, Exchange addr) AxelarExecutable(gateway_) {
        gasService = IAxelarGasService(gasReceiver_);
        exc = Exchange(addr);
    }

function depositCrossChain(
        string memory destinationChain,
        string memory destinationAddress,
        address messageSender,
        string memory symbol,
        uint256 amount
    ) external payable {
        address tokenAddress = gateway.tokenAddresses(symbol);
        /* Before executing this, tokens has to be approved to be used by the current contract, so run approve function in the front end */
        //IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);
        IERC20(tokenAddress).approve(address(gateway), amount);
        bytes memory payload = abi.encode(messageSender, keccak256(abi.encodePacked("deposit")));
        if (msg.value > 0) {
            gasService.payNativeGasForContractCallWithToken{ value: msg.value }(
                address(this),
                destinationChain,
                destinationAddress,
                payload,
                symbol,
                amount,
                msg.sender
            );
        }
        gateway.callContractWithToken(destinationChain, destinationAddress, payload, symbol, amount);
    }

    function withdrawCrossChain(
        string memory destinationChain,
        string memory destinationAddress,
        address messageSender,
        string memory symbol,
        uint256 amount
    ) external payable {
        address tokenAddress = gateway.tokenAddresses(symbol);
        /* Before executing this, tokens has to be moved to the current contract from the exchange contract */
        IERC20(tokenAddress).approve(address(gateway), amount);
        bytes memory payload = abi.encode(messageSender, keccak256(abi.encodePacked("withdraw")));
        if (msg.value > 0) {
            gasService.payNativeGasForContractCallWithToken{ value: msg.value }(
                address(this),
                destinationChain,
                destinationAddress,
                payload,
                symbol,
                amount,
                msg.sender
            );
        }
        gateway.callContractWithToken(destinationChain, destinationAddress, payload, symbol, amount);
    }
//tradeType: 1 => MARKET ||| 0 => LIMIT
    function crossChainTrade(
        string calldata destinationChain,
        string calldata destinationAddress,
        uint _amount, 
        uint _price, 
        uint _side, 
        string memory _market,
        uint _tradeType,
        address msgSender
    ) external payable {
        bytes memory payload = abi.encode(_amount, _price, _side, _market, _tradeType, msgSender);
        if (msg.value > 0) {
            gasService.payNativeGasForContractCall{ value: msg.value }(
                address(this),
                destinationChain,
                destinationAddress,
                payload,
                msg.sender
            );
        }
        gateway.callContract(destinationChain, destinationAddress, payload);
    }

    function _executeWithToken(
        string calldata,
        string calldata,
        bytes calldata payload,
        string calldata tokenSymbol,
        uint256 amount
    ) internal override {
        (address recipient, bytes32 operation) = abi.decode(payload, (address, bytes32));

        address tokenAddress = gateway.tokenAddresses(tokenSymbol);

        if(operation == keccak256(abi.encodePacked("deposit")))
        {
            exc.depositTokenCrossChain(tokenAddress, amount, recipient);
        }
        else if(operation == keccak256(abi.encodePacked("withdraw")))
        {
            exc.withdrawTokenCrossChain(tokenAddress, amount, recipient);
        }
    }

    function _execute(
        string calldata sourceChain_,
        string calldata sourceAddress_,
        bytes calldata payload_
    ) internal override {
        (uint _amount, uint _price, uint _side, string memory _market, uint _tradeType, address msgSender) = abi.decode(payload_, (uint, uint, uint, string, uint, address));
        if(_tradeType == 0)
        {
            exc.limitOrder(_amount, _price, _side, _market, true, msgSender);
        }
        else{
            exc.marketOrder(_amount, _price, _side, _market, true, msgSender);
        }
    }

    function approveAndTransfer(address token, uint256 amount) external {
    bytes memory approveData = abi.encodeWithSelector(
        IERC20(token).approve.selector, 
        address(this), 
        amount
    );

    bytes memory transferData = abi.encodeWithSelector(
        IERC20(token).transfer.selector,
        address(this),
        amount
    );

    address[] memory addresses = new address[](2);
    addresses[0] = token;  
    addresses[1] = token; 

    uint256[] memory values = new uint256[](2);
    values[0] = 0;  
    values[1] = 0;

    bytes[] memory data = new bytes[](2);
    data[0] = approveData;
    data[1] = transferData;

   batcher.batchAll(addresses, values, data, new uint64[](0));
}
}