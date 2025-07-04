// En: app/api/airdrops/route.ts

import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import contractArtifact from '@/lib/contracts/TokenForgeERC20.json';

export async function POST(request: Request) {
  const { contractAddress, chainId, recipients, amountPerRecipient } = await request.json();

  // Aquí iría tu lógica de validación (ej: comprobar si el usuario tiene plan PRO)
  // ...

  // Configuración del proveedor y la billetera del servidor (tu "Gas Tank")
  const rpcUrl = getRpcUrlForChain(chainId); // Necesitarás una función auxiliar para esto
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const serverWallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);

  // Conectamos al contrato del token del usuario
  const tokenContract = new ethers.Contract(contractAddress, contractArtifact.abi, serverWallet);

  try {
    console.log(`Iniciando airdrop para el contrato ${contractAddress}...`);
    for (const recipientAddress of recipients) {
      if (ethers.isAddress(recipientAddress)) {
        // El servidor ejecuta la transacción y paga el gas
        const tx = await tokenContract.transfer(recipientAddress, ethers.parseUnits(amountPerRecipient.toString(), 18));
        await tx.wait(); // Espera a que cada transacción se confirme
        console.log(`Enviados ${amountPerRecipient} tokens a ${recipientAddress}`);
      }
    }
    console.log('Airdrop completado.');
    return NextResponse.json({ success: true, message: 'Airdrop completado con éxito.' });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}