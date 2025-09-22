// En: plans.ts

export const PLAN_DETAILS = {
  free: {
    id: 'free',
    name: 'Free Plan',
    description: 'A free plan for basic usage.',
    priceId: null, // ✅ Se agregó para que el tipo coincida
    limits: {
      '0x89': 1,
      '0x38': 1,
      '0x1': 1,
    },
  },
  basic: {
    id: 'basic',
    name: 'Basic Plan',
    description: 'Our basic plan for small projects.',
    priceId: 'price_1Rh3vdIs18b5tpWUCAWSrz6n', // ⚠️ Reemplaza con tu ID real de Stripe
    limits: {
      '0x89': 10,
      '0x38': 10,
      '0x1': 10,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro Plan',
    description: 'The best for professional projects.',
    priceId: 'price_1Rh3yDIs18b5tpWUURBZbdKO', // ⚠️ Reemplaza con tu ID real de Stripe
    limits: {
      '0x89': 50,
      '0x38': 50,
      '0x1': 50,
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium Plan',
    description: 'For large companies or unlimited projects.',
    priceId: 'price_1Rh3ygIs18b5tpWU9hTeI2xx', // ⚠️ Reemplaza con tu ID real de Stripe
    limits: {
      '0x89': -1, // -1 para ilimitado
      '0x38': -1,
      '0x1': -1,
    },
  },
};