'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { ConnectWallet } from './ConnectWallet';

export const Header = () => {
  const supabase = createClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // La lógica para mostrar el botón de la billetera no cambia
  const showWalletButton = pathname === '/' || pathname.startsWith('/profile') || pathname.startsWith('/dashboard') || pathname.startsWith('/deploy') || pathname.startsWith('/token') || pathname.startsWith('/manage');

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <motion.nav
        className="flex items-center justify-between p-6 lg:px-8"
        aria-label="Global"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="text-xl font-bold text-white">
              Token<span className="text-purple-400">Crafter</span>
            </span>
          </Link>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-400"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Abrir menú principal</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-x-6">
          {showWalletButton && <ConnectWallet />}

          {user ? (
            <>
              <Link href="/dashboard" className="text-sm font-semibold leading-6 text-gray-300 hover:text-purple-400">
                Dashboard
              </Link>
              {/* ✅ ENLACE AÑADIDO */}
              <Link href="/profile" className="text-sm font-semibold leading-6 text-gray-300 hover:text-purple-400">
                Mi Perfil
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm font-semibold leading-6 text-gray-300 hover:text-purple-400"
              >
                Cerrar Sesión
              </button>
            </>
          ) : (
            <Link href="/login" className="text-sm font-semibold leading-6 text-white bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors">
              Iniciar Sesión <span aria-hidden="true">&rarr;</span>
            </Link>
          )}
        </div>
      </motion.nav>

      {/* Panel del Menú Móvil */}
      {mobileMenuOpen && (
        <div className="lg:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-gray-900 px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-white/10">
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/25">
                <div className="space-y-2 py-6">
                  {/* Aquí irían los navItems si los tuvieras */}
                </div>
                <div className="py-6 space-y-4">
                  {showWalletButton && <ConnectWallet />}
                  {user ? (
                    <>
                      <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-white hover:bg-gray-800">Dashboard</Link>
                      {/* ✅ ENLACE AÑADIDO EN EL MENÚ MÓVIL */}
                      <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-white hover:bg-gray-800">Mi Perfil</Link>
                      <button
                        onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                        className="w-full text-left -mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-white hover:bg-gray-800"
                      >
                        Cerrar Sesión
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-white hover:bg-gray-800"
                    >
                      Iniciar Sesión
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
