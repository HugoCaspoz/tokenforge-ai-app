import { JsonRpcProvider, Contract } from 'ethers';

const RPC = 'https://polygon-rpc.com';
const TOKEN_ADDR = '0x958D5B877bFfbc44A4c76CB55FD0e0864Dc7aC8f';
const USER_ADDR_EXPECTED = '0xF787344514Ce9542C894405e181d0476129eE1E3';

const ABI = ["function owner() view returns (address)"];

(async () => {
    try {
        const provider = new JsonRpcProvider(RPC);
        const contract = new Contract(TOKEN_ADDR, ABI, provider);

        const owner = await contract.owner();
        console.log(`Contract Owner: ${owner}`);
        console.log(`User Address:   ${USER_ADDR_EXPECTED}`);

        if (owner.toLowerCase() === USER_ADDR_EXPECTED.toLowerCase()) {
            console.log("MATCH! User IS Owner. Tax should be 0.");
        } else {
            console.log("MISMATCH! User is NOT Owner. Tax applies -> Liquidity Fails.");
        }
    } catch (e) {
        console.error(e);
    }
})();
