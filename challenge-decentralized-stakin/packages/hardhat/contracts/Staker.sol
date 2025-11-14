// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ExampleExternalContract} from "./ExampleExternalContract.sol";

/// @title Staker
/// @notice Collects individual ETH stakes and forwards the pooled balance to an
/// external contract when the staking threshold is met by the deadline.
/// @dev This contract mirrors the requirements from the SpeedRunEthereum
/// challenge "Decentralized Staking".
contract Staker {
    /// @notice Emitted every time a user stakes additional ether.
    /// @param staker Address of the user that provided the stake.
    /// @param amount Amount of ether that was sent with the transaction.
    event Stake(address indexed staker, uint256 amount);

    /// @notice External contract that receives the pooled funds when the
    /// threshold is met.
    ExampleExternalContract public immutable exampleExternalContract;

    /// @notice Individual balances for each participating address.
    mapping(address => uint256) public balances;

    /// @notice Minimum amount of ETH that needs to be staked before the
    /// deadline for the staking to succeed.
    uint256 public constant threshold = 1 ether;

    /// @notice Deadline (unix timestamp) after which staking succeeds or fails.
    uint256 public immutable deadline;

    /// @notice Flag that becomes `true` when staking failed and withdrawals are
    /// open for participants.
    bool public openForWithdraw;

    /// @notice Creates the Staker contract and sets the ExampleExternalContract
    /// target. The deadline is fixed at deployment time to be 30 seconds in the
    /// future.
    /// @param exampleExternalContractAddress Address of the external contract
    /// that exposes the `complete()` function.
    constructor(address exampleExternalContractAddress) {
        require(exampleExternalContractAddress != address(0), "invalid external contract");
        exampleExternalContract = ExampleExternalContract(exampleExternalContractAddress);
        deadline = block.timestamp + 30 seconds;
    }

    /// @notice Reverts when the staking process has already been completed.
    modifier stakingActive() {
        require(!exampleExternalContract.completed(), "staking already completed");
        _;
    }

    /// @notice Allows a user to stake ETH while the staking window is open.
    /// @dev Ether received through the `receive()` fallback uses the same logic.
    function stake() public payable stakingActive {
        require(block.timestamp < deadline, "staking period has ended");
        require(msg.value > 0, "stake must be greater than zero");

        balances[msg.sender] += msg.value;

        emit Stake(msg.sender, msg.value);
    }

    /// @notice Time remaining before the staking deadline (in seconds).
    /// @return Seconds left until the deadline. Returns zero once the deadline
    /// has been reached.
    function timeLeft() public view returns (uint256) {
        if (block.timestamp >= deadline) {
            return 0;
        }
        return deadline - block.timestamp;
    }

    /// @notice Executes the staking outcome after the deadline. If the
    /// threshold has been reached, all funds are forwarded to the external
    /// contract and the staking is marked as complete. Otherwise withdrawals are
    /// opened.
    function execute() external stakingActive {
        require(block.timestamp >= deadline, "deadline not reached");

        uint256 contractBalance = address(this).balance;
        if (contractBalance >= threshold) {
            exampleExternalContract.complete{value: contractBalance}();
        } else {
            openForWithdraw = true;
        }
    }

    /// @notice Allows a staker to withdraw their contribution if the threshold
    /// was not met by the deadline and withdrawals have been opened via
    /// {execute}.
    function withdraw() external {
        require(openForWithdraw, "withdrawals not available");

        uint256 balance = balances[msg.sender];
        require(balance > 0, "no stake to withdraw");

        balances[msg.sender] = 0;
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "withdraw failed");
    }

    /// @notice Accepts plain ETH transfers and counts them as stakes.
    receive() external payable {
        stake();
    }
}
