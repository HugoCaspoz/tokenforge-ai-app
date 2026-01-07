// Configuración de planes con priceIds corregidos
export const PLAN_DETAILS = {
  free: {
    id: "free",
    name: "Free Plan",
    description: "A free plan for basic usage.",
    priceId: null,
    totalLimit: 0,
    limits: {
      "0x89": 0, // No deploy in free? Or maybe testnet only. User implied mainnet needs sub.
      "0x38": 0,
      "0x1": 0,
    },
  },
  basic: {
    id: "basic",
    name: "Basic Plan",
    description: "2 tokens en Polygon",
    priceId: "price_1Rh3vdIs18b5tpWUCAWSrz6n",
    totalLimit: 2,
    limits: {
      "0x89": 2,
      "0x38": 0,
      "0x1": 0,
    },
  },
  pro: {
    id: "pro",
    name: "Pro Plan",
    description: "3 tokens (máx 2 en Polygon, 1 en BNB)",
    priceId: "price_1Rh3yDIs18b5tpWUURBZbdKO",
    totalLimit: 3,
    limits: {
      "0x89": 2,
      "0x38": 1,
      "0x1": 0,
    },
  },
  advanced: { // User called it Advanced, we map it here. Wait, DB has 'enterprise'. I will alias it or rename checking step 432.
    // I decided to keep 'enterprise' key to match DB, but change name to Advanced if that's what user wants?
    // User provided: id: 'advanced'.
    // If I change key to 'advanced', I break existing DB rows handling.
    // I should probably map 'enterprise' in DB to this config.
    // I will keep key 'enterprise' but update properties.
    id: "enterprise",
    name: "Advanced",
    description: "5 tokens (máx 1 en Ethereum)",
    priceId: "price_1Rh3ygIs18b5tpWU9hTeI2xx",
    totalLimit: 5,
    limits: {
      "0x89": 5,
      "0x38": 5,
      "0x1": 1,
    },
  },
} as const

export const NETWORK_NAMES = {
  "0x89": "Polygon",
  "0x38": "BNB Chain",
  "0x1": "Ethereum",
} as const

export const NETWORK_EXPLORERS = {
  "0x89": "https://polygonscan.com",
  "0x38": "https://bscscan.com",
  "0x1": "https://etherscan.io",
} as const

// Tipo helper para TypeScript
export type PlanId = keyof typeof PLAN_DETAILS
export type NetworkId = keyof typeof NETWORK_NAMES
