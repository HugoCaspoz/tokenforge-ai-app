import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import contractArtifact from '@/lib/contracts/TokenForgeERC20.json';
import { createClient } from '@/utils/supabase/server';

// Función auxiliar para obtener la URL del RPC correcta
function getRpcUrlForChain(chainId: string): string {
  const rpcUrls: { [key: string]: string | undefined } = {
    '0x89': process.env.POLYGON_RPC_URL,      // Polygon Mainnet
    '0x38': process.env.BNB_RPC_URL,          // BNB Smart Chain
    '0x1':  process.env.ETHEREUM_RPC_URL,      // Ethereum Mainnet
  };
  const rpcUrl = rpcUrls[chainId];
  if (!rpcUrl) {
    throw new Error(`Red no soportada para el chainId: ${chainId}`);
  }
  return rpcUrl;
}

export async function POST(request: Request) {
  try {
    const { contractAddress, chainId, recipients, amountPerRecipient } = await request.json();

    // Validación de seguridad: Comprobar que el usuario tiene un plan activo
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }
    // Aquí podrías añadir una lógica más compleja para comprobar su plan desde la tabla 'profiles'

    // Configuración de la billetera del servidor que pagará el gas
    const rpcUrl = getRpcUrlForChain(chainId);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const serverWallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);

    const tokenContract = new ethers.Contract(contractAddress, contractArtifact.abi, serverWallet);

    console.log(`Iniciando airdrop para el contrato ${contractAddress}...`);
    for (const recipientAddress of recipients) {
      if (ethers.isAddress(recipientAddress)) {
        // Convertimos la cantidad a la unidad correcta (ej: 18 decimales)
        const amountInWei = ethers.parseUnits(amountPerRecipient.toString(), 18);
        const tx = await tokenContract.transfer(recipientAddress, amountInWei);
        await tx.wait(1); // Espera a que la transacción se confirme
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
