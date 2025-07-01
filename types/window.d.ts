// En: frontend/types/window.d.ts
// En: frontend/types/window.d.ts
import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}

export {};

declare global {
  interface Window {
    ethereum?: any;
  }
}