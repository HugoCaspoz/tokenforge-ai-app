// En: frontend/components/Header.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import Image from 'next/image';

const navItems = [{ name: 'Características', href: '/#features' }];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Obtenemos la sesión al cargar el componente
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getSession();

    // Nos quedamos escuchando cambios en la autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
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
        {/* ... (código del menú de hamburguesa que no cambia) ... */}
        <div className="hidden lg:flex lg:gap-x-12">
          {navItems.map((item) => (
            <a key={item.name} href={item.href} className="text-sm font-semibold leading-6 text-gray-300 hover:text-purple-400">
              {item.name}
            </a>
          ))}
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end items-center gap-x-4">
          {user ? (
            <>
              <span className="text-sm text-gray-300">Hola, {user.user_metadata?.name || user.email}</span>
              <Image 
                src={user.user_metadata?.avatar_url ?? ''} 
                alt="User avatar" 
                width={32} 
                height={32} 
                className="rounded-full"
              />
              <button onClick={handleSignOut} className="text-sm font-semibold leading-6 text-gray-300 hover:text-purple-400">
                Salir
              </button>
            </>
          ) : (
            <Link href="/login" className="text-sm font-semibold leading-6 text-white bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors">
              Iniciar Sesión <span aria-hidden="true">&rarr;</span>
            </Link>
          )}
        </div>
      </motion.nav>
      {/* ... (el resto del JSX del menú móvil) ... */}
    </header>
  );
};