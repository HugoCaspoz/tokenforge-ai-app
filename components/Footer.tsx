import Link from 'next/link';

export const Footer = () => {
    return (
        <footer className="bg-gray-900 border-t border-gray-800">
            <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
                {/* <div className="flex justify-center space-x-6 md:order-2">
                    <Link href="https://twitter.com" target="_blank" className="text-gray-400 hover:text-gray-300">
                        <span className="sr-only">Twitter</span>
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                        </svg>
                    </Link>
                    <Link href="https://telegram.org" target="_blank" className="text-gray-400 hover:text-gray-300">
                        <span className="sr-only">Telegram</span>
                        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z" clipRule="evenodd" />
                        </svg>
                    </Link>
                </div> */}
                <div className="mt-8 md:order-1 md:mt-0">
                    <div className="flex justify-center space-x-6 md:justify-start mb-4">
                        <Link href="/" className="text-sm leading-6 text-gray-400 hover:text-white">Inicio</Link>
                        <Link href="/explore" className="text-sm leading-6 text-gray-400 hover:text-white">Explorar</Link>
                        <Link href="/guide" className="text-sm leading-6 text-gray-400 hover:text-white">Guía de Uso</Link>
                    </div>
                    <p className="text-center text-xs leading-5 text-gray-500 md:text-left">
                        &copy; {new Date().getFullYear()} TokenCrafter. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </footer>
    );
};
