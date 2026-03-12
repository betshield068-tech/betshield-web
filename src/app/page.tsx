import { ShieldCheck } from "lucide-react"; // Se não tiver lucide-react, use texto ou SVGs
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6">
      <main className="flex flex-col items-center text-center gap-8 max-w-2xl">
        {/* LOGO BETSHIELD */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            <ShieldCheck size={40} className="text-slate-950" />
          </div>
          <h1 className="text-5xl font-black tracking-tighter italic">
            BET<span className="text-emerald-500">SHIELD</span>
          </h1>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-200">
            Engine de Automação iGaming
          </h2>
          <p className="text-slate-400 leading-relaxed text-lg">
            Monitoramento em tempo real via WebSockets para plataforma Betfast.
            Análise de padrões de 5x/6x e gestão de banca automatizada.
          </p>
        </div>

        {/* BOTÕES DE ACESSO */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-4">
          <Link
            href="/login"
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-10 text-slate-950 font-black hover:bg-emerald-400 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20"
          >
            ACESSAR PAINEL
          </Link>

          <div className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/50 px-10 text-slate-300 font-bold">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            BOT STATUS: ONLINE
          </div>
        </div>

        <footer className="mt-20 text-slate-600 text-sm font-mono uppercase tracking-widest">
          Secure Core v5.0 | encrypted data stream
        </footer>
      </main>
    </div>
  );
}
