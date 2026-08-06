"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, deleteDoc, doc, orderBy, query } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

interface Evento {
  id: string;
  nome: string;
  data: string;
  statusNf: string;
  lucroEstimado: number;
  totalCustos?: number;
  custos?: { descricao: string; valor: number }[];
}

export default function VisualizarEventos() {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para o envio de e-mail
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  const fetchEventos = async () => {
    try {
      const q = query(collection(db, "eventos"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const listaEventos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Evento[];
      
      setEventos(listaEventos);
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventos();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este evento?")) {
      try {
        await deleteDoc(doc(db, "eventos", id));
        setEventos(eventos.filter(evento => evento.id !== id));
      } catch (error) {
        console.error("Erro ao deletar evento:", error);
        alert("Erro ao excluir o evento.");
      }
    }
  };

  // Função para enviar o relatório por e-mail via API Route (Resend)
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !selectedEvento) return;

    setSendingEmail(true);

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput,
          evento: selectedEvento,
        }),
      });

      if (res.ok) {
        alert("Relatório enviado com sucesso!");
        setSelectedEvento(null);
        setEmailInput("");
      } else {
        alert("Falha ao enviar o e-mail.");
      }
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      alert("Erro ao processar envio de e-mail.");
    } finally {
      setSendingEmail(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="flex flex-col flex-1 items-center font-sans bg-[#000000] min-h-screen py-8 px-4 sm:px-6 text-[#fcefe0]">
      <main className="flex w-full max-w-4xl flex-col px-6 py-8 md:p-10 bg-[#023270]/20 text-[#fcefe0] sm:rounded-2xl sm:border sm:border-[#023270] shadow-xl">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#023270]">
          <button 
            onClick={() => router.push("/")}
            className="text-[#fcefe0]/70 hover:text-[#fcefe0] transition-colors text-sm font-medium"
          >
            ← Início
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-[#fcefe0]">Meus Eventos</h1>
          <button 
            onClick={() => router.push("/formEvento")}
            className="text-sm bg-[#fcefe0] hover:bg-white text-[#000000] px-4 py-2 rounded-lg font-bold transition-colors shadow"
          >
            + Novo
          </button>
        </div>

        {/* Lista de Eventos */}
        {loading ? (
          <div className="flex justify-center py-10 text-[#fcefe0]/70">Carregando eventos...</div>
        ) : eventos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-[#fcefe0]/70 text-center gap-4">
            <p>Nenhum evento encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {eventos.map((evento) => (
              <div key={evento.id} className="bg-[#023270]/40 border border-[#023270] rounded-2xl p-5 flex flex-col gap-4 hover:border-[#fcefe0]/40 transition-all shadow-lg">
                
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-col">
                    <h2 className="font-bold text-lg leading-tight mb-1 text-[#fcefe0]">{evento.nome}</h2>
                    <span className="text-xs text-[#fcefe0]/70 flex items-center gap-1">
                      📅 {formatDate(evento.data)}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                    evento.statusNf === "Emitida" ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30" : "bg-[#023270] text-[#fcefe0] border border-[#fcefe0]/30"
                  }`}>
                    {evento.statusNf}
                  </span>
                </div>

                <div className="bg-[#000000]/40 rounded-xl p-3 border border-[#023270] flex justify-between items-center mt-2">
                  <span className="text-sm text-[#fcefe0]/70">Lucro Estimado</span>
                  <span className={`font-bold ${evento.lucroEstimado >= 0 ? 'text-[#22c55e]' : 'text-red-500'}`}>
                    {formatCurrency(evento.lucroEstimado)}
                  </span>
                </div>

                {/* Ações */}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <button 
                    onClick={() => router.push(`/formEvento/${evento.id}`)}
                    className="py-2 bg-[#023270] hover:bg-[#023270]/80 text-[#fcefe0] rounded-lg text-xs font-medium transition-colors border border-[#fcefe0]/20 flex items-center justify-center gap-1"
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    onClick={() => setSelectedEvento(evento)}
                    className="py-2 bg-[#fcefe0]/10 hover:bg-[#fcefe0]/20 text-[#fcefe0] rounded-lg text-xs font-medium transition-colors border border-[#fcefe0]/20 flex items-center justify-center gap-1"
                  >
                    ✉️ E-mail
                  </button>
                  <button 
                    onClick={() => handleDelete(evento.id)}
                    className="py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition-colors border border-red-500/20 flex items-center justify-center gap-1"
                  >
                    🗑️ Excluir
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </main>

      {/* Modal para inserção do e-mail */}
      {selectedEvento && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#023270] border border-[#fcefe0]/30 rounded-2xl p-6 w-full max-w-md text-[#fcefe0] shadow-2xl">
            <h3 className="text-lg font-bold mb-2">Enviar Relatório por E-mail</h3>
            <p className="text-xs text-[#fcefe0]/80 mb-4">
              Informe o e-mail de destino para o evento <strong>{selectedEvento.nome}</strong>.
            </p>

            <form onSubmit={handleSendEmail} className="flex flex-col gap-4">
              <input
                type="email"
                required
                placeholder="exemplo@email.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#000000]/60 border border-[#fcefe0]/20 rounded-lg text-[#fcefe0] placeholder-[#fcefe0]/40 focus:outline-none focus:border-[#fcefe0]"
              />

              <div className="flex gap-3 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEvento(null);
                    setEmailInput("");
                  }}
                  className="px-4 py-2 bg-transparent hover:bg-black/20 text-[#fcefe0]/80 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="px-4 py-2 bg-[#fcefe0] hover:bg-white text-[#000000] rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {sendingEmail ? "Enviando..." : "Enviar agora"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}