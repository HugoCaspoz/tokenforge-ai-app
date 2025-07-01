// En: frontend/app/create/page.tsx

import Wizard from "@/components/Wizard";

export default function CreatePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900 text-white">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          <span className="text-purple-400">Token</span>Crafter
        </h1>
        <p className="mt-4 text-xl text-gray-400">
          Crea tu propia criptomoneda en minutos. Sin escribir código.
        </p>
      </div>
      
      <Wizard />

    </main>
  );
}