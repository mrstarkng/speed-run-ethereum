// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/// @title ExampleExternalContract
/// @notice Minimal receiver contract used by the Decentralized Staker challenge.
/// It exposes a `complete` function that marks the contract as completed and
/// accepts the ether forwarded by the {Staker} contract on success.
contract ExampleExternalContract {
    /// @notice Flag toggled when the contract has received the stake.
    bool public completed;

    /// @notice Called by the {Staker} contract once the staking threshold is met.
    /// @dev The function is payable because the entire staking balance is
    /// forwarded alongside the call.
    function complete() external payable {
        completed = true;
    }
}
