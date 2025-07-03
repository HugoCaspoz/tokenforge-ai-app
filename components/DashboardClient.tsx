// En: frontend/components/DashboardClient.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';

// 1. Añade los nuevos campos a la interfaz del Proyecto.
interface Project {
  id: number;
  name: string;
  ticker: string;
  logo_url: string | null;
  is_paid: boolean;
  contract_address: string | null;
  chain_id: string | null;
}

interface DashboardClientProps {
  projects: Project[];
  paymentSuccess: boolean;
}

// 2. Un objeto para ayudarnos a construir los enlaces al explorador de bloques.
const explorers = {
  '0x89': 'https://polygonscan.com', // Polygon
  '0x38': 'https://bscscan.com',     // BNB Chain
  '0x1':  'https://etherscan.io',    // Ethereum
};

export function DashboardClient({ projects, paymentSuccess }: DashboardClientProps) {
  return (
    <div className="min-h-screen bg-gray-900 text-white pt-32">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {paymentSuccess && (
          <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg relative mb-8" role="alert">
            <strong className="font-bold">¡Pago completado!</strong>
            <span className="block sm:inline"> Tu proyecto ha sido activado.</span>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Mis Proyectos</h1>
          <Link href="/create" className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition-transform hover:scale-105">
            + Crear Nuevo Token
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {projects && projects.length > 0 ? (
            projects.map((project) => (
              <div key={project.id} className={`bg-gray-800 rounded-lg p-4 flex flex-col ring-1 ${project.contract_address ? 'ring-blue-500' : project.is_paid ? 'ring-green-500' : 'ring-white/10'}`}>
                
                <div className="relative w-full text-center">
                  {/* Etiqueta de estado visual */}
                  {project.contract_address ? (
                      <span className="absolute -top-6 -right-6 text-xs bg-blue-500 text-white font-bold px-2 py-1 rounded-full z-10">DESPLEGADO</span>
                  ) : project.is_paid && (
                      <span className="absolute -top-6 -right-6 text-xs bg-green-500 text-white font-bold px-2 py-1 rounded-full z-10">PAGADO</span>
                  )}
                  {/* ... (código del logo) ... */}
                </div>

                <div className="text-center flex-grow">
                  <h2 className="text-lg font-bold">{project.name}</h2>
                  <p className="text-sm text-gray-400 bg-gray-700 px-2 py-1 rounded-full mt-1 inline-block">${project.ticker.toUpperCase()}</p>
                </div>
                
                <div className="mt-4 w-full">
                  {/* ✅ 3. Lógica de 3 ESTADOS para los botones */}
                  {project.contract_address && project.chain_id ? (
                    // ESTADO: YA DESPLEGADO
                    <a 
                      href={`${explorers[project.chain_id as keyof typeof explorers]}/address/${project.contract_address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 rounded-md transition-colors"
                    >
                      Ver en Explorador
                    </a>
                  ) : project.is_paid ? (
                    // ESTADO: PAGADO, LISTO PARA DESPLEGAR
                    <Link href={`/deploy/${project.id}`} className="block w-full text-center bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 rounded-md transition-colors">
                      Desplegar en Mainnet
                    </Link>
                  ) : (
                    // ESTADO: NO PAGADO
                    <Link href={`/deploy/${project.id}`} className="w-full block text-center bg-green-600 hover:bg-green-500 text-white font-semibold py-2 rounded-md transition-colors">
                      Activar y Desplegar
                    </Link>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-gray-800 rounded-lg">
              <h2 className="text-xl font-semibold">No tienes proyectos todavía</h2>
              <p className="text-gray-400 mt-2">¡Empieza a crear tu primer token ahora!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}