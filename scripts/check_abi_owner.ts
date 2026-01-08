const URL = 'https://unpkg.com/@openzeppelin/contracts@4.8.0/build/contracts/ERC20PresetFixedSupply.json';

async function main() {
    const res = await fetch(URL);
    const json = await res.json();

    const hasOwner = json.abi.some((item: any) => item.name === 'owner' && item.type === 'function');
    console.log(`Has owner(): ${hasOwner}`);

    const hasRole = json.abi.some((item: any) => item.name === 'hasRole' && item.type === 'function');
    console.log(`Has hasRole(): ${hasRole}`);
}

main();
