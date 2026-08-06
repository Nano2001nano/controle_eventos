"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Custo {
  id: number;
  descricao: string;
  valor: string | number;
}

export interface EventoData {
  nome: string;
  data: string;
  
  // Equipe / RH
  promotores: string | number;
  valorPromotor: string | number;
  coordenadores: string | number;
  valorCoordenador: string | number;
  apoios: string | number;
  valorApoio: string | number;
  
  // Financeiro
  valorNota?: string | number; // 10% da nota fiscal
  valorServico: string | number; // Total Cobrado
  statusNf: string;
  
  // Custos / Gastos Extras
  custos: Custo[];
  
  // Observações
  observacoes?: string;
  
  // Calculados
  totalCustos?: number;
  lucroEstimado?: number;
}

interface EventoFormProps {
  initialData?: EventoData;
  onSubmit: (formData: EventoData) => Promise<void>;
  isSubmitting?: boolean;
}

export function EventoForm({ initialData, onSubmit, isSubmitting = false }: EventoFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<EventoData>({
    nome: "",
    data: "",
    promotores: "",
    valorPromotor: "",
    coordenadores: "",
    valorCoordenador: "",
    apoios: "",
    valorApoio: "",
    valorNota: "",
    valorServico: "",
    statusNf: "Pendente",
    custos: [{ id: Date.now(), descricao: "", valor: "" }],
    observacoes: ""
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.nome || "",
        data: initialData.data || "",
        promotores: initialData.promotores || "",
        valorPromotor: initialData.valorPromotor || "",
        coordenadores: initialData.coordenadores || "",
        valorCoordenador: initialData.valorCoordenador || "",
        apoios: initialData.apoios || "",
        valorApoio: initialData.valorApoio || "",
        valorNota: initialData.valorNota || "",
        valorServico: initialData.valorServico || "",
        statusNf: initialData.statusNf || "Pendente",
        custos: initialData.custos && initialData.custos.length > 0 
          ? initialData.custos 
          : [{ id: Date.now(), descricao: "", valor: "" }],
        observacoes: initialData.observacoes || ""
      });
    }
  }, [initialData]);

  const parseCurrency = (value: string | number) => {
    if (!value) return 0;
    const parsed = parseFloat(value.toString().replace(/[^0-9,.-]+/g, "").replace(",", "."));
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Recalcula a taxa da nota (10%) e o total cobrado ao alterar a equipe
  const handleRhChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      const qtdPromotores = Number(updated.promotores || 0);
      const valPromotor = parseCurrency(updated.valorPromotor);

      const qtdCoordenadores = Number(updated.coordenadores || 0);
      const valCoordenador = parseCurrency(updated.valorCoordenador);

      const qtdApoios = Number(updated.apoios || 0);
      const valApoio = parseCurrency(updated.valorApoio);

      const totalEquipe = (qtdPromotores * valPromotor) + (qtdCoordenadores * valCoordenador) + (qtdApoios * valApoio);
      const taxaNota = totalEquipe * 0.10;
      const totalComNota = totalEquipe + taxaNota;

      return {
        ...updated,
        valorNota: taxaNota > 0 ? taxaNota.toFixed(2) : prev.valorNota,
        valorServico: totalComNota > 0 ? totalComNota.toFixed(2) : prev.valorServico
      };
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNfStatus = (status: string) => {
    setFormData({ ...formData, statusNf: status });
  };

  const handleCostChange = (id: number, field: keyof Custo, value: string) => {
    setFormData(prev => ({
      ...prev,
      custos: prev.custos.map(c => c.id === id ? { ...c, [field]: value } : c)
    }));
  };

  const addCost = () => {
    setFormData(prev => ({
      ...prev,
      custos: [...prev.custos, { id: Date.now(), descricao: "", valor: "" }]
    }));
  };

  const removeCost = (id: number) => {
    setFormData(prev => ({
      ...prev,
      custos: prev.custos.filter(c => c.id !== id)
    }));
  };

  // Cálculos de Totais e Lucro Líquido Real
  const qtdPromotores = Number(formData.promotores || 0);
  const valPromotor = parseCurrency(formData.valorPromotor);
  const qtdCoordenadores = Number(formData.coordenadores || 0);
  const valCoordenador = parseCurrency(formData.valorCoordenador);
  const qtdApoios = Number(formData.apoios || 0);
  const valApoio = parseCurrency(formData.valorApoio);

  const totalEquipe = (qtdPromotores * valPromotor) + (qtdCoordenadores * valCoordenador) + (qtdApoios * valApoio);
  const totalCustos = formData.custos.reduce((acc, custo) => acc + parseCurrency(custo.valor), 0);
  const totalReceita = parseCurrency(formData.valorServico);

  // Lucro Líquido Real = Receita Total - Cachê Equipe - Gastos Extras
  const lucroEstimado = totalReceita - totalEquipe - totalCustos;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, totalCustos, lucroEstimado });
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center font-sans bg-[#000000] min-h-screen py-8 px-4 sm:px-6 text-[#fcefe0]">
      <main className="flex w-full max-w-3xl flex-col px-6 py-8 md:p-10 bg-[#023270]/20 sm:rounded-2xl sm:border sm:border-[#023270] shadow-xl">
        
        <div className="flex items-center justify-between mb-10">
          <button onClick={() => router.back()} type="button" className="text-[#fcefe0]/70 hover:text-[#fcefe0] transition-colors text-sm font-medium">
            ← Voltar
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-[#fcefe0]">{initialData?.nome ? "Editar Evento" : "Novo Evento"}</h1>
          <div className="w-16"></div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-10">
          
          {/* Dados Básicos */}
          <section className="flex flex-col gap-5">
            <h2 className="text-[#fcefe0] text-sm md:text-base font-semibold flex items-center gap-2 border-b border-[#023270] pb-2">📋 Dados Básicos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs md:text-sm text-[#fcefe0]/70">Nome do Evento *</label>
                <input type="text" name="nome" value={formData.nome} onChange={handleChange} className="bg-[#023270]/30 border border-[#023270] rounded-xl px-4 py-3 text-sm text-[#fcefe0] focus:outline-none focus:border-[#fcefe0] transition-colors w-full placeholder-[#fcefe0]/40" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs md:text-sm text-[#fcefe0]/70">Data do Evento *</label>
                <input type="date" name="data" value={formData.data} onChange={handleChange} className="bg-[#023270]/30 border border-[#023270] rounded-xl px-4 py-3 text-sm text-[#fcefe0] focus:outline-none focus:border-[#fcefe0] transition-colors [color-scheme:dark] w-full" required />
              </div>
            </div>
          </section>

          {/* Recursos Humanos */}
          <section className="flex flex-col gap-5">
            <h2 className="text-[#fcefe0] text-sm md:text-base font-semibold flex items-center gap-2 border-b border-[#023270] pb-2">👥 Recursos Humanos</h2>
            
            <div className="flex flex-col gap-4">
              {/* Promotores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#023270]/20 p-4 rounded-xl border border-[#023270]/50">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs md:text-sm text-[#fcefe0]/70">Nº de Promotores *</label>
                  <input type="number" name="promotores" value={formData.promotores} onChange={handleRhChange} placeholder="0" className="bg-[#023270]/30 border border-[#023270] rounded-xl px-4 py-3 text-sm text-[#fcefe0] focus:outline-none focus:border-[#fcefe0] transition-colors w-full" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs md:text-sm text-[#fcefe0]/70">Valor Promotor (R$) *</label>
                  <input type="text" name="valorPromotor" value={formData.valorPromotor} onChange={handleRhChange} placeholder="0,00" className="bg-[#023270]/30 border border-[#023270] rounded-xl px-4 py-3 text-sm text-[#fcefe0] focus:outline-none focus:border-[#fcefe0] transition-colors w-full" required />
                </div>
              </div>

              {/* Coordenadores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#023270]/20 p-4 rounded-xl border border-[#023270]/50">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs md:text-sm text-[#fcefe0]/70">Nº de Coordenadores</label>
                  <input type="number" name="coordenadores" value={formData.coordenadores} onChange={handleRhChange} placeholder="0" className="bg-[#023270]/30 border border-[#023270] rounded-xl px-4 py-3 text-sm text-[#fcefe0] focus:outline-none focus:border-[#fcefe0] transition-colors w-full" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs md:text-sm text-[#fcefe0]/70">Valor Coordenador (R$)</label>
                  <input type="text" name="valorCoordenador" value={formData.valorCoordenador} onChange={handleRhChange} placeholder="0,00" className="bg-[#023270]/30 border border-[#023270] rounded-xl px-4 py-3 text-sm text-[#fcefe0] focus:outline-none focus:border-[#fcefe0] transition-colors w-full" />
                </div>
              </div>

              {/* Apoios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#023270]/20 p-4 rounded-xl border border-[#023270]/50">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs md:text-sm text-[#fcefe0]/70">Nº de Apoios</label>
                  <input type="number" name="apoios" value={formData.apoios} onChange={handleRhChange} placeholder="0" className="bg-[#023270]/30 border border-[#023270] rounded-xl px-4 py-3 text-sm text-[#fcefe0] focus:outline-none focus:border-[#fcefe0] transition-colors w-full" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs md:text-sm text-[#fcefe0]/70">Valor Apoio (R$)</label>
                  <input type="text" name="valorApoio" value={formData.valorApoio} onChange={handleRhChange} placeholder="0,00" className="bg-[#023270]/30 border border-[#023270] rounded-xl px-4 py-3 text-sm text-[#fcefe0] focus:outline-none focus:border-[#fcefe0] transition-colors w-full" />
                </div>
              </div>
            </div>
          </section>

          {/* Gastos Extras */}
          <section className="flex flex-col gap-5 bg-[#023270]/30 p-5 rounded-2xl border border-[#023270]">
            <h2 className="text-[#fcefe0] text-sm md:text-base font-semibold flex items-center gap-2">🧾 Gastos Extras / Custos da Operação</h2>
            <div className="flex flex-col gap-3">
              {formData.custos.map((custo, index) => (
                <div key={custo.id || index} className="flex gap-3 items-center">
                  <input type="text" value={custo.descricao} onChange={(e) => handleCostChange(custo.id, "descricao", e.target.value)} placeholder={`Item / Custo ${index + 1}`} className="bg-[#023270]/40 border border-[#023270] rounded-xl px-4 py-3 text-sm text-[#fcefe0] placeholder-[#fcefe0]/40 w-full focus:outline-none focus:border-[#fcefe0]" />
                  <input type="text" value={custo.valor} onChange={(e) => handleCostChange(custo.id, "valor", e.target.value)} placeholder="0" className="bg-[#023270]/40 border border-[#023270] rounded-xl px-4 py-3 text-sm text-[#fcefe0] placeholder-[#fcefe0]/40 w-24 md:w-32 focus:outline-none focus:border-[#fcefe0]" />
                  <button type="button" onClick={() => removeCost(custo.id)} className="text-red-500 hover:text-red-400 px-2 text-xl font-bold">×</button>
                </div>
              ))}
              <button type="button" onClick={addCost} className="mt-2 w-full py-3 rounded-xl text-sm font-medium border border-dashed border-[#023270] text-[#fcefe0]/70 hover:text-[#fcefe0] hover:border-[#fcefe0] transition-all">+ Adicionar gasto extra</button>
            </div>
          </section>

          {/* Financeiro */}
          <section className="flex flex-col gap-5">
            <h2 className="text-[#fcefe0] text-sm md:text-base font-semibold flex items-center gap-2 border-b border-[#023270] pb-2">💰 Financeiro</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs md:text-sm text-[#fcefe0]/70">Valor da NF (10%)</label>
                <input type="text" name="valorNota" value={formData.valorNota} onChange={handleChange} placeholder="0,00" className="bg-[#023270]/30 border border-[#023270] rounded-xl px-4 py-3 text-sm text-[#fcefe0] focus:outline-none focus:border-[#fcefe0] transition-colors w-full" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs md:text-sm text-[#fcefe0]/70">Total Serviços Cobrados *</label>
                <input type="text" name="valorServico" value={formData.valorServico} onChange={handleChange} placeholder="0,00" className="bg-[#023270]/30 border border-[#023270] rounded-xl px-4 py-3 text-sm text-[#fcefe0] focus:outline-none focus:border-[#fcefe0] transition-colors w-full" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs md:text-sm text-[#fcefe0]/70">Status da Nota Fiscal</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleNfStatus("Emitida")} className={`flex-1 py-3 rounded-xl text-xs font-medium border transition-all ${formData.statusNf === "Emitida" ? "border-[#22c55e] text-[#22c55e] bg-[#22c55e]/10" : "border-[#023270] text-[#fcefe0]/70 bg-[#023270]/30"}`}>✓ Emitida</button>
                  <button type="button" onClick={() => handleNfStatus("Pendente")} className={`flex-1 py-3 rounded-xl text-xs font-medium border transition-all ${formData.statusNf === "Pendente" ? "border-[#fcefe0] text-[#fcefe0] bg-[#023270]" : "border-[#023270] text-[#fcefe0]/70 bg-[#023270]/30"}`}>⏳ Pendente</button>
                </div>
              </div>
            </div>
          </section>

          {/* Observações */}
          <section className="flex flex-col gap-3">
            <h2 className="text-[#fcefe0] text-sm md:text-base font-semibold flex items-center gap-2 border-b border-[#023270] pb-2">📝 Observações</h2>
            <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} rows={3} placeholder="Digite aqui observações adicionais sobre o evento..." className="bg-[#023270]/30 border border-[#023270] rounded-xl p-4 text-sm text-[#fcefe0] focus:outline-none focus:border-[#fcefe0] transition-colors w-full resize-none placeholder-[#fcefe0]/40" />
          </section>

          {/* Resumo Financeiro */}
          <div className="bg-[#023270]/40 rounded-2xl p-6 border border-[#023270] flex justify-between items-center mt-2 shadow-lg">
            <div className="flex flex-col">
              <span className="text-xs text-[#fcefe0]/70 mb-1">Lucro líquido estimado</span>
              <span className={`text-xl md:text-2xl font-bold ${lucroEstimado >= 0 ? 'text-[#22c55e]' : 'text-red-500'}`}>{formatCurrency(lucroEstimado)}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-[#fcefe0]/70 mb-1">Total gastos extras</span>
              <span className="text-lg md:text-xl font-bold text-[#fcefe0]">{formatCurrency(totalCustos)}</span>
            </div>
          </div>

          <div className="mt-2">
            <button type="submit" disabled={isSubmitting} className={`w-full text-[#000000] font-bold py-4 rounded-xl transition-all ${isSubmitting ? "bg-gray-600 cursor-not-allowed text-white" : "bg-[#fcefe0] hover:bg-white"}`}>
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}