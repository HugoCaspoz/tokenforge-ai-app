'use client';

import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';

export default function UserGuide() {
    const { t } = useTranslation();
    const steps = [
        {
            title: t('guide.steps.1.title'),
            description: t('guide.steps.1.description'),
            icon: '⚙️'
        },
        {
            title: t('guide.steps.2.title'),
            description: t('guide.steps.2.description'),
            icon: '🚀'
        },
        {
            title: t('guide.steps.3.title'),
            description: t('guide.steps.3.description'),
            icon: '📊'
        },
        {
            title: t('guide.steps.4.title'),
            description: t('guide.steps.4.description'),
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
                        {t('guide.prerequisites.title')}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center text-2xl flex-shrink-0">
                                🦊
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-1">{t('guide.prerequisites.wallet.title')}</h3>
                                <p className="text-gray-400 text-sm">
                                    {t('guide.prerequisites.wallet.description_1')}
                                    <a href="https://metamask.io/" target="_blank" className="text-purple-400 hover:underline">MetaMask</a>
                                    {t('guide.prerequisites.wallet.description_2')}
                                    <a href="https://rabby.io/" target="_blank" className="text-purple-400 hover:underline">Rabby</a>
                                    {t('guide.prerequisites.wallet.description_3')}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-2xl flex-shrink-0">
                                ⛽
                            </div>
                            <div>
                                <h3 className="font-bold text-white mb-1">{t('guide.prerequisites.gas.title')}</h3>
                                <p className="text-gray-400 text-sm">
                                    {t('guide.prerequisites.gas.description')}
                                    <br />
                                    • <strong>Polygon:</strong> POL
                                    <br />
                                    • <strong>BNB Chain:</strong> BNB ({t('common.comingSoon')})
                                    <br />
                                    • <strong>Ethereum:</strong> ETH ({t('common.comingSoon')})
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
                    <h2 className="text-2xl font-bold text-white mb-6">{t('guide.faq.title')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                        <div className="bg-gray-800/30 p-6 rounded-xl">
                            <h4 className="font-bold text-purple-400 mb-2">{t('guide.faq.safe.question')}</h4>
                            <p className="text-gray-400">{t('guide.faq.safe.answer')}</p>
                        </div>
                        <div className="bg-gray-800/30 p-6 rounded-xl">
                            <h4 className="font-bold text-purple-400 mb-2">{t('guide.faq.cost.question')}</h4>
                            <p className="text-gray-400">{t('guide.faq.cost.answer')}</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
