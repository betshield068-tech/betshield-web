"use client";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert("Erro: " + error.message);
    else router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f172a]">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-2xl bg-slate-800 p-8 shadow-2xl border border-slate-700"
      >
        <h1 className="mb-6 text-3xl font-black text-emerald-400 text-center uppercase tracking-tighter">
          BetShield Admin
        </h1>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="E-mail"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-slate-900 p-3 text-white outline-none ring-emerald-500 focus:ring-2"
          />
          <input
            type="password"
            placeholder="Senha"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-slate-900 p-3 text-white outline-none ring-emerald-500 focus:ring-2"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-500 p-3 font-bold text-slate-900 hover:bg-emerald-400 transition"
          >
            ACESSAR PAINEL
          </button>
        </div>
      </form>
    </div>
  );
}
