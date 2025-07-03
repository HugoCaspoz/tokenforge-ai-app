// En: frontend/app/deploy/mainnet/route.ts

import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import contractArtifact from '@/lib/contracts/TokenForgeERC20.json';

const supportedNetworks = {
  '0x89': { rpcUrl: 'https://polygon-rpc.com/' },
  '0x38': { rpcUrl: 'https://bsc-dataseed.binance.org/' },
};

export async function POST(request: Request) {
  /**
   * 1. Leemos los datos del body de la petición.
   * Ahora incluimos `ownerAddress`, que nos envía el cliente.
   */
  const { projectId, chainId, ownerAddress } = await request.json();

  /**
   * 2. Validamos que todos los datos necesarios estén presentes y sean correctos.
   */
  if (!projectId || !chainId || !ownerAddress) {
    return NextResponse.json({ error: 'Faltan datos: projectId, chainId, o ownerAddress' }, { status: 400 });
  }

  // Validamos que la dirección del dueño sea una dirección de billetera válida.
  if (!ethers.isAddress(ownerAddress)) {
    return NextResponse.json({ error: 'La dirección del dueño (ownerAddress) proporcionada no es válida.' }, { status: 400 });
  }

  const networkConfig = supportedNetworks[chainId as keyof typeof supportedNetworks];
  if (!networkConfig) {
    return NextResponse.json({ error: 'Red no soportada' }, { status: 400 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (projectError || !project || !project.is_paid) {
      return NextResponse.json({ error: 'Proyecto no encontrado o no pagado' }, { status: 403 });
    }

    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    const deployerWallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);
    const factory = new ethers.ContractFactory(contractArtifact.abi, contractArtifact.bytecode, deployerWallet);
    
    console.log(`Desplegando ${project.name} en ${chainId} para el dueño: ${ownerAddress}`);

    /**
     * 3. Usamos la `ownerAddress` validada del cliente.
     * Se elimina por completo la lógica de `|| user.id`.
     */
    const contract = await factory.deploy(
      ownerAddress,
      project.name,
      project.ticker,
      project.supply || 1000000
    );

    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    console.log(`Contrato desplegado en: ${contractAddress}`);

    await supabase
      .from('projects')
      .update({ contract_address: contractAddress, chain_id: chainId })
      .eq('id', projectId);

    return NextResponse.json({ contractAddress });

  } catch (err) {
    console.error('Error en el despliegue del servidor:', err);
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: `Error en el despliegue: ${errorMessage}` }, { status: 500 });
  }
}