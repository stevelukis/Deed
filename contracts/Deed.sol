// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract Deed {
    address public lawyer;
    address payable public beneficiary;
    uint256 public earliest;

    constructor(address _lawyer, address payable _beneficiary, uint256 fromNow) payable {
        lawyer = _lawyer;
        beneficiary = _beneficiary;
        earliest = block.timestamp + fromNow;
    }

    function withdraw() public {
        require(msg.sender == lawyer, "Only the lawyer can invoke the withdrawal");
        require(block.timestamp >= earliest, "It is too early to withdraw");
        beneficiary.transfer(address(this).balance);
    }

}
