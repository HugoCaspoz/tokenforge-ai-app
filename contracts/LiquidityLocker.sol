// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract LiquidityLocker is ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Lock {
        uint256 id;
        address token;
        address owner;
        uint256 amount;
        uint256 unlockTime;
        bool withdrawn;
    }

    uint256 public nextLockId;
    mapping(uint256 => Lock) public locks;
    mapping(address => uint256[]) public userLocks;

    event Locked(uint256 indexed lockId, address indexed token, address indexed owner, uint256 amount, uint256 unlockTime);
    event Withdrawn(uint256 indexed lockId, address indexed owner, uint256 amount);

    constructor() {}

    function lock(address _token, uint256 _amount, uint256 _unlockTime) external nonReentrant {
        require(_amount > 0, "Amount must be > 0");
        require(_unlockTime > block.timestamp, "Unlock time must be in future");
        require(_token != address(0), "Invalid token");

        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);

        uint256 lockId = nextLockId++;
        locks[lockId] = Lock({
            id: lockId,
            token: _token,
            owner: msg.sender,
            amount: _amount,
            unlockTime: _unlockTime,
            withdrawn: false
        });

        userLocks[msg.sender].push(lockId);

        emit Locked(lockId, _token, msg.sender, _amount, _unlockTime);
    }

    function withdraw(uint256 _lockId) external nonReentrant {
        Lock storage userLock = locks[_lockId];
        require(userLock.owner == msg.sender, "Not owner");
        require(!userLock.withdrawn, "Already withdrawn");
        require(block.timestamp >= userLock.unlockTime, "Not unlocked yet");

        userLock.withdrawn = true;
        IERC20(userLock.token).safeTransfer(msg.sender, userLock.amount);

        emit Withdrawn(_lockId, msg.sender, userLock.amount);
    }

    function getLocksByOwner(address _owner) external view returns (Lock[] memory) {
        uint256[] memory lockIds = userLocks[_owner];
        Lock[] memory result = new Lock[](lockIds.length);
        
        for (uint256 i = 0; i < lockIds.length; i++) {
            result[i] = locks[lockIds[i]];
        }
        return result;
    }
}
