// lib/plans.ts

/**
 * @description Define los detalles, límites y descripciones de cada plan de suscripción.
 * Es la fuente única de verdad para la lógica de negocio en toda la aplicación.
 * Los chain_id corresponden a:
 * '0x89': Polygon Mainnet
 * '0x38': BNB Smart Chain Mainnet
 * '0x1':  Ethereum Mainnet
 */
export const PLAN_DETAILS = {
  // Plan para usuarios sin suscripción activa
  free: { 
    id: 'free',
    name: 'Free',
    description: 'Despliegues ilimitados en redes de prueba (Testnet).',
    limits: { 
      '0x89': 0,
      '0x38': 0,
      '0x1': 0,
    } 
  },
  // --- Planes de Pago ---
  basic: {
    id: 'basic',
    name: 'Basic',
    description: 'Ideal para empezar en Polygon.',
    limits: {
      '0x89': 2, // 2 en Polygon
      '0x38': 0,
      '0x1': 0,
    } 
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Para proyectos que se expanden a BNB Chain.',
    limits: {
      '0x89': 2, // Máx 2 en Polygon
      '0x38': 1, // Máx 1 en BNB
      '0x1': 0,
    } 
  },
  advanced: {
    id: 'advanced',
    name: 'Advanced',
    description: 'Acceso a todas las redes, incluyendo Ethereum.',
    limits: {
      '0x89': 3, // 3 en Polygon
      '0x38': 1, // 1 en BNB
      '0x1': 1, // 1 en Ethereum (Total: 5 tokens)
    } 
  },
};

/**
 * @description Mapea los IDs de cadena (chain_id) a nombres legibles para la UI.
 */
export const NETWORK_NAMES: { [key: string]: string } = {
  '0x89': 'Polygon',
  '0x38': 'BNB Chain',
  '0x1':  'Ethereum',
};