
export const TOKEN_ABI = [
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "symbol",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "initialSupply",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "initialOwner",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "allowance",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "needed",
                "type": "uint256"
            }
        ],
        "name": "ERC20InsufficientAllowance",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "balance",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "needed",
                "type": "uint256"
            }
        ],
        "name": "ERC20InsufficientBalance",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "approver",
                "type": "address"
            }
        ],
        "name": "ERC20InvalidApprover",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "receiver",
                "type": "address"
            }
        ],
        "name": "ERC20InvalidReceiver",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "sender",
                "type": "address"
            }
        ],
        "name": "ERC20InvalidSender",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            }
        ],
        "name": "ERC20InvalidSpender",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "OwnableInvalidOwner",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "OwnableUnauthorizedAccount",
        "type": "error"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
] as const;

export const TOKEN_BYTECODE = "0x608060405234801561000f575f5ffd5b50604051611aef380380611aef8339818101604052810190610031919061062a565b808484816003908161004391906108de565b50806004908161005391906108de565b5050505f73ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16036100c6575f6040517f1e4fbdf70000000000000000000000000000000000000000000000000000000081526004016100bd91906109bc565b60405180910390fd5b6100d5816100ef60201b60201c565b506100e681836101b260201b60201c565b50505050610a92565b5f60055f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1690508160055f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610222575f6040517fec442f0500000000000000000000000000000000000000000000000000000000815260040161021991906109bc565b60405180910390fd5b6102335f838361023760201b60201c565b5050565b5f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1603610287578060025f82825461027b9190610a02565b92505081905550610355565b5f5f5f8573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f2054905081811015610310578381836040517fe450d38c00000000000000000000000000000000000000000000000000000000815260040161030793929190610a44565b60405180910390fd5b8181035f5f8673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f2081905550505b5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff160361039c578060025f82825403925050819055506103e6565b805f5f8473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f82825401925050819055505b8173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040516104439190610a79565b60405180910390a3505050565b5f604051905090565b5f5ffd5b5f5ffd5b5f5ffd5b5f5ffd5b5f601f19601f8301169050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b6104af82610469565b810181811067ffffffffffffffff821117156104ce576104cd610479565b5b80604052505050565b5f6104e0610450565b90506104ec82826104a6565b919050565b5f67ffffffffffffffff82111561050b5761050a610479565b5b61051482610469565b9050602081019050919050565b8281835e5f83830152505050565b5f61054161053c846104f1565b6104d7565b90508281526020810184848401111561055d5761055c610465565b5b610568848285610521565b509392505050565b5f82601f83011261058457610583610461565b5b815161059484826020860161052f565b91505092915050565b5f819050919050565b6105af8161059d565b81146105b9575f5ffd5b50565b5f815190506105ca816105a6565b92915050565b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f6105f9826105d0565b9050919050565b610609816105ef565b8114610613575f5ffd5b50565b5f8151905061062481610600565b92915050565b5f5f5f5f6080858703121561064257610641610459565b5b5f85015167ffffffffffffffff81111561065f5761065e61045d565b5b61066b87828801610570565b945050602085015167ffffffffffffffff81111561068c5761068b61045d565b5b61069887828801610570565b93505060406106a9878288016105bc565b92505060606106ba87828801610616565b91505092959194509250565b5f81519050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f600282049050600182168061071457607f821691505b602082108103610727576107266106d0565b5b50919050565b5f819050815f5260205f209050919050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f600883026107897fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8261074e565b610793868361074e565b95508019841693508086168417925050509392505050565b5f819050919050565b5f6107ce6107c96107c48461059d565b6107ab565b61059d565b9050919050565b5f819050919050565b6107e7836107b4565b6107fb6107f3826107d5565b84845461075a565b825550505050565b5f5f905090565b610812610803565b61081d8184846107de565b505050565b5f5b82811015610843576108385f82840161080a565b600181019050610824565b505050565b601f8211156108965782821115610895576108628161072d565b61086b8361073f565b6108748561073f565b6020861015610881575f90505b80830161089082840382610822565b505050505b5b505050565b5f82821c905092915050565b5f6108b65f198460080261089b565b1980831691505092915050565b5f6108ce83836108a7565b9150826002028217905092915050565b6108e7826106c6565b67ffffffffffffffff811115610900576108ff610479565b5b61090a82546106fd565b610915828285610848565b5f60209050601f831160018114610946575f8415610934578287015190505b61093e85826108c3565b8655506109a5565b601f1984166109548661072d565b5f5b8281101561097b57848901518255600182019150602085019450602081019050610956565b868310156109985784890151610994601f8916826108a7565b8355505b6001600288020188555050505b505050505050565b6109b6816105ef565b82525050565b5f6020820190506109cf5f8301846109ad565b92915050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f610a0c8261059d565b9150610a178361059d565b9250828201905080821115610a2f57610a2e6109d5565b5b92915050565b610a3e8161059d565b82525050565b5f606082019050610a575f8301866109ad565b610a646020830185610a35565b610a716040830184610a35565b949350505050565b5f602082019050610a8c5f830184610a35565b92915050565b61105080610a9f5f395ff3fe608060405234801561000f575f5ffd5b50600436106100b2575f3560e01c8063715018a61161006f578063715018a6146101a05780638da5cb5b146101aa57806395d89b41146101c8578063a9059cbb146101e6578063dd62ed3e14610216578063f2fde38b14610246576100b2565b806306fdde03146100b6578063095ea7b3146100d457806318160ddd1461010457806323b872dd14610122578063313ce5671461015257806370a0823114610170575b5f5ffd5b6100be610262565b6040516100cb9190610cc9565b60405180910390f35b6100ee60048036038101906100e99190610d7a565b6102f2565b6040516100fb9190610dd2565b60405180910390f35b61010c610314565b6040516101199190610dfa565b60405180910390f35b61013c60048036038101906101379190610e13565b61031d565b6040516101499190610dd2565b60405180910390f35b61015a61034b565b6040516101679190610e7e565b60405180910390f35b61018a60048036038101906101859190610e97565b610353565b6040516101979190610dfa565b60405180910390f35b6101a8610398565b005b6101b26103ab565b6040516101bf9190610ed1565b60405180910390f35b6101d06103d3565b6040516101dd9190610cc9565b60405180910390f35b61020060048036038101906101fb9190610d7a565b610463565b60405161020d9190610dd2565b60405180910390f35b610230600480360381019061022b9190610eea565b610485565b60405161023d9190610dfa565b60405180910390f35b610260600480360381019061025b9190610e97565b610507565b005b60606003805461027190610f55565b80601f016020809104026020016040519081016040528092919081815260200182805461029d90610f55565b80156102e85780601f106102bf576101008083540402835291602001916102e8565b820191905f5260205f20905b8154815290600101906020018083116102cb57829003601f168201915b5050505050905090565b5f5f6102fc61058b565b9050610309818585610592565b600191505092915050565b5f600254905090565b5f5f61032761058b565b90506103348582856105a4565b61033f858585610637565b60019150509392505050565b5f6012905090565b5f5f5f8373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f20549050919050565b6103a0610727565b6103a95f6107ae565b565b5f60055f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff16905090565b6060600480546103e290610f55565b80601f016020809104026020016040519081016040528092919081815260200182805461040e90610f55565b80156104595780601f1061043057610100808354040283529160200191610459565b820191905f5260205f20905b81548152906001019060200180831161043c57829003601f168201915b5050505050905090565b5f5f61046d61058b565b905061047a818585610637565b600191505092915050565b5f60015f8473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f8373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f2054905092915050565b61050f610727565b5f73ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff160361057f575f6040517f1e4fbdf70000000000000000000000000000000000000000000000000000000081526004016105769190610ed1565b60405180910390fd5b610588816107ae565b50565b5f33905090565b61059f8383836001610871565b505050565b5f6105af8484610485565b90507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8110156106315781811015610622578281836040517ffb8f41b200000000000000000000000000000000000000000000000000000000815260040161061993929190610f85565b60405180910390fd5b61063084848484035f610871565b5b50505050565b5f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16036106a7575f6040517f96c6fd1e00000000000000000000000000000000000000000000000000000000815260040161069e9190610ed1565b60405180910390fd5b5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610717575f6040517fec442f0500000000000000000000000000000000000000000000000000000000815260040161070e9190610ed1565b60405180910390fd5b610722838383610a40565b505050565b61072f61058b565b73ffffffffffffffffffffffffffffffffffffffff1661074d6103ab565b73ffffffffffffffffffffffffffffffffffffffff16146107ac5761077061058b565b6040517f118cdaa70000000000000000000000000000000000000000000000000000000081526004016107a39190610ed1565b60405180910390fd5b565b5f60055f9054906101000a900473ffffffffffffffffffffffffffffffffffffffff1690508160055f6101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055508173ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff167f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e060405160405180910390a35050565b5f73ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff16036108e1575f6040517fe602df050000000000000000000000000000000000000000000000000000000081526004016108d89190610ed1565b60405180910390fd5b5f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1603610951575f6040517f94280d620000000000000000000000000000000000000000000000000000000081526004016109489190610ed1565b60405180910390fd5b8160015f8673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f8573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f20819055508015610a3a578273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92584604051610a319190610dfa565b60405180910390a35b50505050565b5f73ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1603610a90578060025f828254610a849190610fe7565b92505081905550610b5e565b5f5f5f8573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f2054905081811015610b19578381836040517fe450d38c000000000000000000000000000000000000000000000000000000008152600401610b1093929190610f85565b60405180910390fd5b8181035f5f8673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f2081905550505b5f73ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff1603610ba5578060025f8282540392505081905550610bef565b805f5f8473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f82825401925050819055505b8173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef83604051610c4c9190610dfa565b60405180910390a3505050565b5f81519050919050565b5f82825260208201905092915050565b8281835e5f83830152505050565b5f601f19601f8301169050919050565b5f610c9b82610c59565b610ca58185610c63565b9350610cb5818560208601610c73565b610cbe81610c81565b840191505092915050565b5f6020820190508181035f830152610ce18184610c91565b905092915050565b5f5ffd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f610d1682610ced565b9050919050565b610d2681610d0c565b8114610d30575f5ffd5b50565b5f81359050610d4181610d1d565b92915050565b5f819050919050565b610d5981610d47565b8114610d63575f5ffd5b50565b5f81359050610d7481610d50565b92915050565b5f5f60408385031215610d9057610d8f610ce9565b5b5f610d9d85828601610d33565b9250506020610dae85828601610d66565b9150509250929050565b5f8115159050919050565b610dcc81610db8565b82525050565b5f602082019050610de55f830184610dc3565b92915050565b610df481610d47565b82525050565b5f602082019050610e0d5f830184610deb565b92915050565b5f5f5f60608486031215610e2a57610e29610ce9565b5b5f610e3786828701610d33565b9350506020610e4886828701610d33565b9250506040610e5986828701610d66565b9150509250925092565b5f60ff82169050919050565b610e7881610e63565b82525050565b5f602082019050610e915f830184610e6f565b92915050565b5f60208284031215610eac57610eab610ce9565b5b5f610eb984828501610d33565b91505092915050565b610ecb81610d0c565b82525050565b5f602082019050610ee45f830184610ec2565b92915050565b5f5f60408385031215610f0057610eff610ce9565b5b5f610f0d85828601610d33565b9250506020610f1e85828601610d33565b9150509250929050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f6002820490506001821680610f6c57607f821691505b602082108103610f7f57610f7e610f28565b5b50919050565b5f606082019050610f985f830186610ec2565b610fa56020830185610deb565b610fb26040830184610deb565b949350505050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f610ff182610d47565b9150610ffc83610d47565b925082820190508082111561101457611013610fba565b5b9291505056fea26469706673582212208d053f94a996e37aabc92a311b17b82db736f6f5e0bd4f634d6696be9d00e4a264736f6c63430008210033";
