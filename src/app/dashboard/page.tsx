"use client";

import { createBrowserClient } from "@supabase/ssr";
import {
  Activity,
  Coins,
  History,
  Pause,
  Play,
  ShieldAlert,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// 1. Tipagem
interface GlobalConfig {
  cd_configuracao: number;
  sn_kill_switch_global: boolean;
  vl_stop_win: number; // Agora editável
}

interface GameControl {
  tp_jogo: string;
  sn_ativo: boolean;
  vl_aposta_base: number;
  nr_sequencia_alvo: number;
}

interface BettingHistory {
  cd_aposta: string;
  tp_jogo: string;
  ds_resultado_mesa: string;
  ds_lado_aposta: string;
  vl_aposta: number;
  tp_status: "WIN" | "LOSS" | "TIE" | "PENDENTE";
  vl_lucro_perda: number;
  ts_criacao: string;
}

export default function AdminDashboard() {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ),
  );

  const [globalConfig, setGlobalConfig] = useState<GlobalConfig | null>(null);
  const [games, setGames] = useState<GameControl[]>([]);
  const [history, setHistory] = useState<BettingHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [configRes, gamesRes, historyRes] = await Promise.all([
        supabase
          .from("CONFIGURACOES_BOT")
          .select("*")
          .eq("cd_configuracao", 1)
          .single(),
        supabase.from("CONTROLE_JOGOS").select("*").order("tp_jogo"),
        supabase
          .from("HISTORICO_APOSTAS")
          .select("*")
          .order("ts_criacao", { ascending: false })
          .limit(10),
      ]);

      if (configRes.error) throw configRes.error;
      setGlobalConfig(configRes.data);
      setGames(gamesRes.data || []);
      setHistory(historyRes.data || []);
    } catch (error) {
      console.error("Erro de sincronização:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel("db-changes")
      .on(
        "postgres_changes" as any,
        { event: "*", table: "CONTROLE_JOGOS" },
        fetchData,
      )
      .on(
        "postgres_changes" as any,
        { event: "*", table: "CONFIGURACOES_BOT" },
        fetchData,
      )
      .on(
        "postgres_changes" as any,
        { event: "INSERT", table: "HISTORICO_APOSTAS" },
        fetchData,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, supabase]);

  // --- FUNÇÕES DE ATUALIZAÇÃO ---

  async function updateGlobalField(field: keyof GlobalConfig, value: any) {
    try {
      const { error } = await supabase
        .from("CONFIGURACOES_BOT")
        .update({ [field]: value })
        .eq("cd_configuracao", 1);
      if (error) throw error;
      setGlobalConfig((prev) => (prev ? { ...prev, [field]: value } : null));
    } catch (error) {
      fetchData();
    }
  }

  async function updateGameField(
    tp_jogo: string,
    field: keyof GameControl,
    value: any,
  ) {
    try {
      const { error } = await supabase
        .from("CONTROLE_JOGOS")
        .update({ [field]: value })
        .eq("tp_jogo", tp_jogo);
      if (error) throw error;
      setGames((prev) =>
        prev.map((g) => (g.tp_jogo === tp_jogo ? { ...g, [field]: value } : g)),
      );
    } catch (error) {
      fetchData();
    }
  }

  async function toggleMasterKill() {
    if (!globalConfig) return;
    const newState = !globalConfig.sn_kill_switch_global;
    await updateGlobalField("sn_kill_switch_global", newState);
    if (newState) {
      await supabase
        .from("CONTROLE_JOGOS")
        .update({ sn_ativo: false })
        .not("tp_jogo", "is", null);
    }
  }

  async function toggleAllGames(status: boolean) {
    if (globalConfig?.sn_kill_switch_global && status) return;
    try {
      await supabase
        .from("CONTROLE_JOGOS")
        .update({ sn_ativo: status })
        .not("tp_jogo", "is", null);
      fetchData();
    } catch (error) {
      fetchData();
    }
  }

  if (isLoading || !globalConfig) {
    return (
      <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center text-emerald-500 font-black italic animate-pulse tracking-widest">
        SHIELD CORE CONNECTING...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-slate-200 p-4 md:p-8 font-sans">
      {/* HEADER / KILL SWITCH */}
      <div
        className={`mb-6 p-6 rounded-3xl border transition-all duration-500 flex flex-col md:flex-row justify-between items-center gap-6 ${
          globalConfig.sn_kill_switch_global
            ? "bg-red-500/10 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]"
            : "bg-slate-900/50 border-slate-800"
        }`}
      >
        <div className="flex items-center gap-5">
          <div
            className={`p-4 rounded-2xl ${globalConfig.sn_kill_switch_global ? "bg-red-500 text-white animate-bounce" : "bg-slate-800 text-slate-400"}`}
          >
            <ShieldAlert size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase">
              Master Kill Switch
            </h1>
            <p className="text-sm opacity-50 font-bold">
              Protocolo de Emergência Global
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          {/* META DE LUCRO EDITÁVEL */}
          <div className="flex flex-col text-right bg-slate-950/50 p-3 px-6 rounded-2xl border border-slate-800 focus-within:border-emerald-500 transition-all">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">
              Meta de Lucro (Stop Win)
            </span>
            <div className="flex items-center justify-end gap-2">
              <span className="text-emerald-500 font-bold">R$</span>
              <input
                type="number"
                defaultValue={globalConfig.vl_stop_win}
                onBlur={(e) =>
                  updateGlobalField("vl_stop_win", Number(e.target.value))
                }
                className="bg-transparent text-right font-black text-white text-xl outline-none w-24"
              />
            </div>
          </div>

          <button
            onClick={toggleMasterKill}
            className={`px-10 py-5 rounded-2xl font-black transition-all active:scale-95 ${
              globalConfig.sn_kill_switch_global
                ? "bg-slate-200 text-red-600"
                : "bg-red-600 text-white shadow-xl shadow-red-600/20"
            }`}
          >
            {globalConfig.sn_kill_switch_global
              ? "RESTAURAR SISTEMA"
              : "🛑 PARADA TOTAL"}
          </button>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-2">
          <Activity size={16} /> Módulos Ativos
        </h2>

        <div className="flex gap-2 bg-slate-900/40 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => toggleAllGames(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
          >
            <Play size={14} /> Play All
          </button>
          <button
            onClick={() => toggleAllGames(false)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
          >
            <Pause size={14} /> Pause All
          </button>
        </div>
      </div>

      {/* GRID DE JOGOS EDITÁVEIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {games.map((game) => (
          <div
            key={game.tp_jogo}
            className={`relative overflow-hidden border transition-all duration-300 p-6 rounded-[2rem] ${
              game.sn_ativo && !globalConfig.sn_kill_switch_global
                ? "bg-slate-900/80 border-emerald-500/50 shadow-2xl shadow-emerald-500/5"
                : "bg-slate-900/40 border-slate-800 opacity-60 grayscale-[0.5]"
            }`}
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-xl font-black text-white italic tracking-tight capitalize">
                  {game.tp_jogo.replace(/_/g, " ")}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase mt-2 inline-block ${
                    game.sn_ativo && !globalConfig.sn_kill_switch_global
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {game.sn_ativo && !globalConfig.sn_kill_switch_global
                    ? "Streaming"
                    : "Standby"}
                </span>
              </div>

              <button
                onClick={() =>
                  updateGameField(game.tp_jogo, "sn_ativo", !game.sn_ativo)
                }
                disabled={globalConfig.sn_kill_switch_global}
                className={`p-3 rounded-xl transition-all ${
                  game.sn_ativo && !globalConfig.sn_kill_switch_global
                    ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                    : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                }`}
              >
                {game.sn_ativo ? <Pause size={20} /> : <Play size={20} />}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* EDITAR APOSTA BASE */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 focus-within:border-emerald-500/50 flex flex-col transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <Coins size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Base R$
                  </span>
                </div>
                <input
                  type="number"
                  step="0.50"
                  defaultValue={game.vl_aposta_base}
                  onBlur={(e) =>
                    updateGameField(
                      game.tp_jogo,
                      "vl_aposta_base",
                      Number(e.target.value),
                    )
                  }
                  className="bg-transparent font-black text-emerald-400 text-xl outline-none w-full"
                />
              </div>

              {/* EDITAR GATILHO SEQUÊNCIA */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 focus-within:border-blue-500/50 flex flex-col transition-all">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={14} className="text-blue-500" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Gatilho X
                  </span>
                </div>
                <input
                  type="number"
                  defaultValue={game.nr_sequencia_alvo}
                  onBlur={(e) =>
                    updateGameField(
                      game.tp_jogo,
                      "nr_sequencia_alvo",
                      Number(e.target.value),
                    )
                  }
                  className="bg-transparent font-black text-white text-xl outline-none w-full"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* HISTÓRICO */}
      <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
        <History size={16} /> Monitor de Sinais (Realtime)
      </h2>

      <div className="bg-slate-900/50 border border-slate-800 rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/20 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <th className="p-5">Timestamp</th>
                <th className="p-5 text-center">Lado</th>
                <th className="p-5">Investido</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-right">PnL Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {history.map((item) => (
                <tr
                  key={item.cd_aposta}
                  className="hover:bg-slate-800/30 transition-colors group"
                >
                  <td className="p-5 text-sm text-slate-400 italic font-medium">
                    {new Date(item.ts_criacao).toLocaleTimeString()}
                  </td>
                  <td className="p-5 text-center">
                    <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg uppercase tracking-tighter">
                      {item.ds_lado_aposta}
                    </span>
                  </td>
                  <td className="p-5 text-sm font-bold text-slate-300 font-mono">
                    R$ {Number(item.vl_aposta).toFixed(2)}
                  </td>
                  <td className="p-5">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-1 rounded ${item.tp_status === "WIN" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}
                    >
                      {item.tp_status}
                    </span>
                  </td>
                  <td
                    className={`p-5 text-right font-black font-mono text-base ${Number(item.vl_lucro_perda) >= 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {Number(item.vl_lucro_perda) >= 0 ? (
                        <TrendingUp size={14} />
                      ) : (
                        <TrendingDown size={14} />
                      )}
                      {Number(item.vl_lucro_perda) >= 0 ? "+" : ""}
                      {Number(item.vl_lucro_perda).toFixed(2)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
