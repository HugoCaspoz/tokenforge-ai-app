// Configuración de planes con priceIds corregidos
export const PLAN_DETAILS = {
  free: {
    id: "free",
    name: "Free Plan",
    description: "A free plan for basic usage.",
    priceId: null,
    limits: {
      "0x89": 1,
      "0x38": 1,
      "0x1": 1,
    },
  },
  basic: {
    id: "basic",
    name: "Basic Plan",
    description: "Our basic plan for small projects.",
    priceId: "price_1Rh3vdIs18b5tpWUCAWSrz6n",
    limits: {
      "0x89": 10,
      "0x38": 10,
      "0x1": 10,
    },
  },
  pro: {
    id: "pro",
    name: "Pro Plan",
    description: "The best for professional projects.",
    priceId: "price_1Rh3yDIs18b5tpWUURBZbdKO",
    limits: {
      "0x89": 50,
      "0x38": 50,
      "0x1": 50,
    },
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise Plan",
    description: "For large companies or unlimited projects.",
    priceId: "price_1Rh3ygIs18b5tpWU9hTeI2xx",
    limits: {
      "0x89": -1, // -1 para ilimitado
      "0x38": -1,
      "0x1": -1,
    },
  },
} as const

export const NETWORK_NAMES = {
  "0x89": "Polygon",
  "0x38": "BNB Chain",
  "0x1": "Ethereum",
} as const

// Tipo helper para TypeScript
export type PlanId = keyof typeof PLAN_DETAILS
export type NetworkId = keyof typeof NETWORK_NAMES
