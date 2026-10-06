// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {IAny2EVMMessageReceiver} from "@chainlink/contracts-ccip/contracts/interfaces/IAny2EVMMessageReceiver.sol";

contract MockToken is ERC20 {
    constructor() ERC20("Test USDC", "USDC") {}
    function decimals() public pure override returns (uint8) { return 6; }
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

/// @dev Local simulation only. The real CCIP DON/OnRamp/OffRamp are not simulated here.
contract MockRouter {
    uint256 public constant FEE = 0.001 ether;
    bool public failSend;
    uint256 public sendCount;
    event Sent(bytes32 indexed messageId, uint64 destination, address receiver, address token, uint256 amount);

    function setFailSend(bool fail) external { failSend = fail; }
    function isChainSupported(uint64) external pure returns (bool) { return true; }
    function getFee(uint64, Client.EVM2AnyMessage memory) external pure returns (uint256) { return FEE; }
    function ccipSend(uint64 destination, Client.EVM2AnyMessage memory message) external payable returns (bytes32 id) {
        require(!failSend, "Send failed");
        require(msg.value >= FEE, "Insufficient fee");
        require(message.feeToken == address(0), "Native fee only");
        Client.EVMTokenAmount memory token = message.tokenAmounts[0];
        require(IERC20(token.token).transferFrom(msg.sender, address(this), token.amount), "Transfer failed");
        id = keccak256(abi.encode(msg.sender, ++sendCount));
        emit Sent(id, destination, abi.decode(message.receiver, (address)), token.token, token.amount);
    }
    function deliver(address receiver, Client.Any2EVMMessage calldata message) external {
        for (uint256 i; i < message.destTokenAmounts.length; ++i) {
            Client.EVMTokenAmount calldata token = message.destTokenAmounts[i];
            require(IERC20(token.token).transfer(receiver, token.amount), "Transfer failed");
        }
        IAny2EVMMessageReceiver(receiver).ccipReceive(message);
    }
}
