// En: frontend/app/page.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ScrollAnimation } from '@/components/ScrollAnimation';

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2, // Anima los hijos con un pequeño retraso entre ellos
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };

  return (
    <div className="bg-gray-900/50 text-white overflow-x-hidden">
      {/* Hero Section */}
      <main className="relative isolate px-6 pt-14 lg:px-8">
        <motion.div
          className="mx-auto max-w-3xl py-32 sm:py-48 lg:py-56 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 
            className="text-4xl font-bold tracking-tight text-white sm:text-6xl"
            variants={itemVariants}
          >
            Tu Visión, Tu Token, <br /> Potenciado por <span className="text-purple-400">Inteligencia Artificial</span>
          </motion.h1>
          <motion.p 
            className="mt-6 text-lg leading-8 text-gray-300"
            variants={itemVariants}
          >
            Deja de imaginar. Crea, diseña y lanza tu propia criptomoneda en minutos. Sin una sola línea de código.
          </motion.p>
          <motion.div 
            className="mt-10 flex items-center justify-center gap-x-6"
            variants={itemVariants}
          >
            <Link
              href="/create"
              className="rounded-md bg-purple-600 px-5 py-3 text-lg font-semibold text-white shadow-lg hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 transition-transform hover:scale-105"
            >
              Empezar a Crear Gratis
            </Link>
          </motion.div>
        </motion.div>
      </main>

      {/* Features Section con Bento Grid */}
      <ScrollAnimation className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl mx-auto lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-purple-400">La Plataforma Definitiva</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              De la Idea al Lanzamiento, Todo en un Mismo Lugar
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Feature Grande */}
              <div className="lg:col-span-2 rounded-xl bg-white/5 p-8 ring-1 ring-inset ring-white/10">
                <h3 className="text-xl font-bold text-white">🧠 Asistente Creativo con IA</h3>
                <p className="mt-4 text-gray-300">¿Sin ideas? No hay problema. Nuestra IA sugiere nombres, tickers, logos y hasta el propósito de tu token, convirtiendo el bloqueo creativo en un torbellino de posibilidades.</p>
              </div>
              {/* Feature Pequeña */}
              <div className="rounded-xl bg-white/5 p-8 ring-1 ring-inset ring-white/10">
                <h3 className="text-xl font-bold text-white">📄 Contratos Seguros</h3>
                <p className="mt-4 text-gray-300">Generamos código ERC20 estándar, basado en plantillas auditadas.</p>
              </div>
              {/* Feature Pequeña */}
              <div className="rounded-xl bg-white/5 p-8 ring-1 ring-inset ring-white/10">
                <h3 className="text-xl font-bold text-white">🚀 Despliegue en 1 Clic</h3>
                <p className="mt-4 text-gray-300">Lanza en Testnet para probar sin riesgo, o en Mainnet cuando estés listo para el mundo.</p>
              </div>
              {/* Feature Grande */}
              <div className="lg:col-span-2 rounded-xl bg-white/5 p-8 ring-1 ring-inset ring-white/10">
                <h3 className="text-xl font-bold text-white">🎨 Diseño de Identidad Visual</h3>
                <p className="mt-4 text-gray-300">No solo creas un token, creas una marca. La IA de DALL·E 3 genera un logo profesional y único que representa la esencia de tu proyecto.</p>
              </div>
            </div>
          </div>
        </div>
      </ScrollAnimation>
    </div>
  );
}