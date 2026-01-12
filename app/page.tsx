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
          className="mx-auto max-w-3xl py-20 sm:py-48 lg:py-56 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            className="text-4xl font-bold tracking-tight text-white sm:text-6xl"
            variants={itemVariants}
          >
            Lanza tu token rapidamente, <br /> configura airdrops y gestiona tu liquidez <span className="text-purple-400">desde un solo lugar.</span>
          </motion.h1>
          <motion.p
            className="mt-6 text-lg leading-8 text-gray-300"
            variants={itemVariants}
          >

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
            <h2 className="text-base font-semibold leading-7 text-purple-400">Simple y Rápido</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Cómo funciona
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center p-6 bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/50 transition-colors">
                <div className="mb-4 text-4xl">⚙️</div>
                <h3 className="text-xl font-bold text-white mb-2">1. Configura</h3>
                <p className="text-gray-300">Define nombre y funciones.</p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center p-6 bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/50 transition-colors">
                <div className="mb-4 text-4xl">🚀</div>
                <h3 className="text-xl font-bold text-white mb-2">2. Despliega</h3>
                <p className="text-gray-300">Lanza a la red con un clic.</p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center p-6 bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/50 transition-colors">
                <div className="mb-4 text-4xl">📊</div>
                <h3 className="text-xl font-bold text-white mb-2">3. Gestiona</h3>
                <p className="text-gray-300">Envía drops y controla tus holders.</p>
              </div>
            </div>
          </div>

          {/* Networks Section */}
          <div className="mt-24 border-t border-white/10 pt-16">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <h2 className="text-center text-lg font-semibold leading-8 text-white mb-10">
                Disponible en las mejores redes
              </h2>
              <div className="mx-auto grid max-w-lg grid-cols-3 items-center gap-x-8 gap-y-10 sm:max-w-xl sm:gap-x-10 lg:mx-0 lg:max-w-none">

                {/* Polygon */}
                <div className="flex flex-col items-center gap-2">
                  <svg className="h-12 w-12 text-[#8247E5]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z" fill="#8247E5" opacity="0.2" /><path d="M16.586 11.838l-4.596 7.641-4.596-7.641 4.596-7.636 4.596 7.636zM12 19.479l4.596-7.641H7.404L12 19.479zm0-15.282L7.404 11.838h9.192L12 4.197z" fill="#FFF" /></svg>
                  <span className="text-sm font-medium text-gray-400">Polygon</span>
                </div>

                {/* BNB */}
                <div className="flex flex-col items-center gap-2 opacity-60">
                  <svg className="h-12 w-12 text-[#F0B90B]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z" fill="#F0B90B" opacity="0.2" /><path d="M12 16.5l3-3-3-3-3 3 3 3zm0-9l-3 3 3 3 3-3-3-3zm-6 4.5l3 3-3 3-3-3 3-3zm12 0l3 3-3 3-3-3 3-3z" fill="#FFF" /></svg>
                  <span className="text-sm font-medium text-gray-500">BNB (Próximamente)</span>
                </div>

                {/* Ethereum */}
                <div className="flex flex-col items-center gap-2 opacity-60">
                  <svg className="h-12 w-12 text-[#627EEA]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z" fill="#627EEA" opacity="0.2" /><path d="M12 4.5l-6 10 6 3.5 6-3.5-6-10zm0 15l-6-3.5 6 8.5 6-8.5-6 3.5z" fill="#FFF" /></svg>
                  <span className="text-sm font-medium text-gray-500">Ethereum (Próximamente)</span>
                </div>

              </div>
            </div>
          </div>
        </div>
      </ScrollAnimation>
    </div>
  );
}