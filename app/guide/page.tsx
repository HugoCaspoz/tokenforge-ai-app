'use client';

import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';

export default function UserGuide() {
    const { t } = useTranslation();
    const steps = [
        {
            title: '1. Configuración',
            description: 'Define la identidad de tu token. Elige un nombre memorable, un símbolo (ticker) único y establece el suministro total. También puedes configurar una imagen personalizada.',
            icon: '⚙️'
        },
        {
            title: '2. Despliegue',
            description: 'Una vez configurado, conecta tu wallet y despliega el contrato inteligente en la blockchain de tu elección (Polygon, BNB Chain, Ethereum). El proceso es automático y seguro.',
            icon: '🚀'
        },
        {
            title: '3. Gestión',
            description: 'Accede a tu panel de control para gestionar tu token. Aquí podrás bloquear liquidez para dar confianza a los inversores, renunciar a la propiedad del contrato y ver estadísticas en tiempo real.',
            icon: '📊'
        },
        {
            title: '4. Crecimiento',
            description: 'Utiliza las herramientas de marketing integradas. Descarga el logo de tu token, comparte tu proyecto en redes sociales y aparece en nuestra página de "Explorar" para ganar visibilidad.',
            icon: '📈'
        }
    ];

    return (
        <div className="bg-gray-900 min-h-screen text-white py-24 px-6 sm:py-32 lg:px-8">
            <div className="mx-auto max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl mb-6">
                        {t('guide.title')}
                    </h1>
                    <p className="text-lg leading-8 text-gray-300">
                        {t('guide.subtitle')}
                    </p>
                </motion.div>

                {/* Prerequisites Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mb-16 bg-purple-500/10 border border-purple-500/20 rounded-2xl p-8"
                >
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="text-3xl">🎒</span> Antes de empezar
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-2xl flex-shrink-0">
                                🦊
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-1">Billetera Web3</h3>
                                <p className="text-gray-400 text-sm">
                                    Necesitas una billetera como <a href="https://metamask.io/" target="_blank" className="text-purple-400 hover:underline">MetaMask</a> o <a href="https://rabby.io/" target="_blank" className="text-purple-400 hover:underline">Rabby</a> instalada en tu navegador para interactuar con la blockchain.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-2xl flex-shrink-0">
                                ⛽
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-1">Tokens para Gas</h3>
                                <p className="text-gray-400 text-sm">
                                    Debes tener saldo en la moneda nativa de la red para pagar las comisiones (Gas):
                                    <br />
                                    • <strong>Polygon:</strong> POL
                                    <br />
                                    • <strong>BNB Chain:</strong> BNB (Próximamente)
                                    <br />
                                    • <strong>Ethereum:</strong> ETH (Próximamente)
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 gap-12">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.title}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="flex flex-col md:flex-row gap-6 bg-gray-800/50 p-8 rounded-2xl border border-gray-700/50 hover:border-purple-500/30 transition-colors"
                        >
                            <div className="flex-shrink-0">
                                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-3xl">
                                    {step.icon}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                                <p className="text-gray-400 leading-relaxed text-lg">
                                    {step.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="mt-20 text-center"
                >
                    <h2 className="text-2xl font-bold text-white mb-6">¿Preguntas Frecuentes?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                        <div className="bg-gray-800/30 p-6 rounded-xl">
                            <h4 className="font-bold text-purple-400 mb-2">¿Es seguro?</h4>
                            <p className="text-gray-400">Sí, nuestros contratos están auditados y verificados automáticamente en la blockchain.</p>
                        </div>
                        <div className="bg-gray-800/30 p-6 rounded-xl">
                            <h4 className="font-bold text-purple-400 mb-2">¿Cuánto cuesta?</h4>
                            <p className="text-gray-400">El despliegue tiene un coste mínimo de gas de la red, más una pequeña tarifa de servicio de la plataforma.</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
