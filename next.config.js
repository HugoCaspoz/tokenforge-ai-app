/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // El que ya tenías para GitHub:
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '**',
      },
      // El nuevo que tienes que añadir para DALL-E:
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'pykozmhovywrlgmyynur.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;