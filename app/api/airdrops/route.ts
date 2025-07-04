// En: app/api/airdrops/route.ts

import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import contractArtifact from '@/lib/contracts/TokenForgeERC20.json';

/**
 * ✅ CORRECCIÓN: Se añade la función auxiliar que faltaba.
 * Esta función obtiene la URL del RPC desde las variables de entorno
 * basándose en el ID de la cadena (chainId).
 */
function getRpcUrlForChain(chainId: string): string {
  const rpcUrls: { [key: string]: string | undefined } = {
    '0x89': process.env.POLYGON_RPC_URL,      // Polygon Mainnet
    '0x38': process.env.BNB_RPC_URL,          // BNB Smart Chain
    '0x1':  process.env.ETHEREUM_RPC_URL,      // Ethereum Mainnet
  };

  const rpcUrl = rpcUrls[chainId];

  if (!rpcUrl) {
    throw new Error(`RPC URL no configurada o red no soportada para el chainId: ${chainId}`);
  }

  return rpcUrl;
}

export async function POST(request: Request) {
  try {
    const { contractAddress, chainId, recipients, amountPerRecipient } = await request.json();

    // Aquí iría tu lógica de validación (ej: comprobar si el usuario tiene plan PRO)
    // ...

    // Configuración del proveedor y la billetera del servidor (tu "Gas Tank")
    const rpcUrl = getRpcUrlForChain(chainId); // Ahora esta función existe
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const serverWallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);

    const tokenContract = new ethers.Contract(contractAddress, contractArtifact.abi, serverWallet);

    console.log(`Iniciando airdrop para el contrato ${contractAddress}...`);
    for (const recipientAddress of recipients) {
      if (ethers.isAddress(recipientAddress)) {
        const amountInWei = ethers.parseUnits(amountPerRecipient.toString(), 18);
        const tx = await tokenContract.transfer(recipientAddress, amountInWei);
        await tx.wait(); // Espera a que cada transacción se confirme
        console.log(`Enviados ${amountPerRecipient} tokens a ${recipientAddress}`);
      }
    }
    console.log('Airdrop completado.');
    return NextResponse.json({ success: true, message: 'Airdrop completado con éxito.' });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    console.error("Error en el Airdrop:", errorMessage);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}