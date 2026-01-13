import { ethers } from 'ethers';

const TX_HASH = "0xb702c83f7d46ba58a3f9b53a1d73c96402177035cdb541dd7248a0f518ed6cb0";
const ADDRESS = "0xF787344514Ce9542C894405e181d0476129eE1E3";

async function checkTx() {
    const rpc = "https://polygon-rpc.com";
    console.log(`Checking ${rpc}...`);
    try {
        const provider = new ethers.JsonRpcProvider(rpc);

        console.log("Fetching account nonce...");
        const accountNonce = await provider.getTransactionCount(ADDRESS);
        console.log(`Current Account Nonce: ${accountNonce}`);

        const tx = await provider.getTransaction(TX_HASH);
        if (tx) {
            console.log(`✅ FOUND TX`);
            console.log(`  nonce: ${tx.nonce}`);
            console.log(`  gasPrice: ${ethers.formatUnits(tx.gasPrice || 0n, 'gwei')} Gwei`);
            console.log(`  maxFeePerGas: ${ethers.formatUnits(tx.maxFeePerGas || 0n, 'gwei')} Gwei`);

            const receipt = await provider.getTransactionReceipt(TX_HASH);
            if (receipt) {
                console.log(`  ✅ MINED in block ${receipt.blockNumber}`);
            } else {
                console.log("  ⏳ PENDING (No receipt yet)");
                if (tx.nonce > accountNonce) {
                    console.log(`  ⚠️ BLOCKED: Waiting for nonces ${accountNonce} to ${tx.nonce - 1}`);
                } else if (tx.nonce < accountNonce) {
                    console.log(`  ⚠️ WEIRD: Tx nonce ${tx.nonce} < Account nonce ${accountNonce}. Should be mined or replaced.`);
                } else {
                    console.log(`  🟢 NEXT IN LINE: Tx nonce ${tx.nonce} == Account nonce. Should mine ANY SECOND.`);
                }
            }
        } else {
            console.log("  ❌ TX NOT FOUND in mempool");
        }
    } catch (e) {
        console.log(`  ⚠️ Error: ${e.message}`);
    }
}
checkTx();
