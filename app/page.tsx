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
    <div className="bg-gray-900 text-white overflow-x-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[100px]" />
      </div>

      {/* Hero Section */}
      <main className="relative isolate px-6 pt-14 lg:px-8">
        <motion.div
          className="mx-auto max-w-4xl py-20 sm:py-32 lg:py-40 text-center relative z-10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="mb-8 flex justify-center"
            variants={itemVariants}
          >
            <span className="px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium">
              🚀 La forma más fácil de lanzar tu token
            </span>
          </motion.div>

          <motion.h1
            className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl mb-6 leading-tight"
            variants={itemVariants}
          >
            Lanza, Gestiona y Crece <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              en minutos.
            </span>
          </motion.h1>

          <motion.p
            className="mt-6 text-lg leading-8 text-gray-300 max-w-2xl mx-auto"
            variants={itemVariants}
          >
            Crea tu token ERC-20, configura airdrops, bloquea liquidez y gestiona tu comunidad desde un panel de control profesional. Sin tocar código.
          </motion.p>

          <motion.div
            className="mt-10 flex items-center justify-center gap-x-6"
            variants={itemVariants}
          >
            <Link
              href="/create"
              className="rounded-full bg-purple-600 px-8 py-4 text-lg font-bold text-white shadow-[0_0_30px_rgba(147,51,234,0.3)] hover:shadow-[0_0_50px_rgba(147,51,234,0.5)] hover:bg-purple-500 transition-all hover:scale-105"
            >
              Empezar Gratis
            </Link>
            <Link href="/explore" className="text-sm font-semibold leading-6 text-white hover:text-purple-300 transition-colors">
              Explorar Proyectos <span aria-hidden="true">→</span>
            </Link>
          </motion.div>
        </motion.div>
      </main>

      {/* Features Section con Bento Grid */}
      <ScrollAnimation className="py-16 sm:py-24 relative z-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl mx-auto lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-purple-400">Workflow Simplificado</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              De la idea al mercado en 3 pasos
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-2xl sm:mt-16 lg:mt-20 lg:max-w-none">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center p-8 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 hover:border-purple-500/50 transition-all hover:bg-gray-800 hover:shadow-xl hover:shadow-purple-500/5 group">
                <div className="mb-6 w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">⚙️</div>
                <h3 className="text-xl font-bold text-white mb-3">1. Configura</h3>
                <p className="text-gray-400 leading-relaxed">Define el nombre, ticker, supply y las tokenomics de tu proyecto en segundos.</p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center p-8 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 hover:border-purple-500/50 transition-all hover:bg-gray-800 hover:shadow-xl hover:shadow-purple-500/5 group">
                <div className="mb-6 w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">🚀</div>
                <h3 className="text-xl font-bold text-white mb-3">2. Despliega</h3>
                <p className="text-gray-400 leading-relaxed">Lanza tu contrato inteligente verificado a la blockchain con un solo clic.</p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center p-8 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 hover:border-purple-500/50 transition-all hover:bg-gray-800 hover:shadow-xl hover:shadow-purple-500/5 group">
                <div className="mb-6 w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">📊</div>
                <h3 className="text-xl font-bold text-white mb-3">3. Gestiona</h3>
                <p className="text-gray-400 leading-relaxed">Administra tu token, bloquea liquidez, renuncia a la propiedad y haz crecer tu comunidad.</p>
              </div>
            </div>
          </div>

          {/* Networks Section */}
          <div className="mt-24 border-t border-white/5 pt-16">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <h2 className="text-center text-lg font-semibold leading-8 text-gray-400 mb-12">
                Compatible con las redes más potentes
              </h2>
              <div className="mx-auto grid max-w-lg grid-cols-1 sm:grid-cols-3 items-center gap-x-8 gap-y-12 sm:max-w-xl sm:gap-x-10 lg:mx-0 lg:max-w-none">

                {/* Polygon */}
                <div className="flex flex-col items-center gap-4 group">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                    <svg className="h-10 w-10 text-[#8247E5]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16.586 11.838l-4.596 7.641-4.596-7.641 4.596-7.636 4.596 7.636zM12 19.479l4.596-7.641H7.404L12 19.479zm0-15.282L7.404 11.838h9.192L12 4.197z" />
                    </svg>
                  </div>
                  <span className="text-base font-bold text-white">Polygon</span>
                </div>

                {/* BNB */}
                <div className="flex flex-col items-center gap-4 group relative">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100">
                    <svg className="h-10 w-10 text-[#F0B90B]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z" fill="#F0B90B" opacity="0.2" />
                      <path d="M12 16.5l3-3-3-3-3 3 3 3zm0-9l-3 3 3 3 3-3-3-3zm-6 4.5l3 3-3 3-3-3 3-3zm12 0l3 3-3 3-3-3 3-3z" fill="#FFF" />
                    </svg>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold text-gray-500 group-hover:text-white transition-colors">BNB Chain</span>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded mt-1">Próximamente</span>
                  </div>
                </div>

                {/* Ethereum */}
                <div className="flex flex-col items-center gap-4 group relative">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100">
                    <svg className="h-10 w-10 text-[#627EEA]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
                    </svg>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold text-gray-500 group-hover:text-white transition-colors">Ethereum</span>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded mt-1">Próximamente</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </ScrollAnimation>
    </div>
  );
}