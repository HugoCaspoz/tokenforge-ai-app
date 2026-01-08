// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SimpleToken is ERC20, Ownable {
    constructor(string memory name, string memory symbol, uint256 initialSupply, address initialOwner) 
        ERC20(name, symbol) 
        Ownable(initialOwner) 
    {
        _mint(initialOwner, initialSupply);
    }

    function _update(address from, address to, uint256 value) internal override(ERC20) {
        // Skip tax if minting/burning or if owner is involved (sending or receiving)
        if (from == address(0) || to == address(0) || from == owner() || to == owner()) {
            super._update(from, to, value);
            return;
        }

        // Calculate 0.2% Tax (20 basis points)
        uint256 tax = (value * 20) / 10000;
        uint256 amountAfterTax = value - tax;

        // Transfer Tax to Platform Wallet (Fixed)
        if (tax > 0) {
            super._update(from, 0xF787344514Ce9542C894405e181d0476129eE1E3, tax);
        }

        // Transfer Remaining to Recipient
        super._update(from, to, amountAfterTax);
    }

    function multisend(address[] memory recipients, uint256[] memory amounts) external {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        for (uint256 i = 0; i < recipients.length; i++) {
            transfer(recipients[i], amounts[i]);
        }
    }
}
