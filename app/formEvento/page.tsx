"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { EventoForm, EventoData } from "../components/eventoForm";

export default function NovoEventoPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCriar = async (formData: EventoData) => {
    setIsSubmitting(true);
    try {
      const custosLimpos = (formData.custos || []).map((c) => ({
        id: Number(c.id || Date.now()),
        descricao: String(c.descricao || ""),
        valor: String(c.valor || "0"),
      }));

      const eventoData = {
        nome: String(formData.nome || ""),
        data: String(formData.data || ""),
        promotores: Number(formData.promotores || 0),
        valorPromotor: String(formData.valorPromotor || "0"),
        coordenadores: Number(formData.coordenadores || 0),
        valorCoordenador: String(formData.valorCoordenador || "0"),
        apoios: Number(formData.apoios || 0),
        valorApoio: String(formData.valorApoio || "0"),
        valorServico: String(formData.valorServico || "0"),
        valorServicoNum: parseFloat((formData.valorServico || "0").toString().replace(/[^0-9,.-]+/g, "").replace(",", ".")) || 0,
        statusNf: String(formData.statusNf || "Pendente"),
        custos: custosLimpos,
        observacoes: String(formData.observacoes || ""),
        totalCustos: Number(formData.totalCustos || 0),
        lucroEstimado: Number(formData.lucroEstimado || 0),
        createdAt: serverTimestamp(),
      };

      console.log("Enviando direto para o Firebase...", eventoData);

      // Chamada direta para o Firebase capturar o erro real
      const docRef = await addDoc(collection(db, "eventos"), eventoData);

      console.log("Sucesso! ID:", docRef.id);
      alert("Evento cadastrado com sucesso!");
      router.push("/visualizar-eventos");
    } catch (error: any) {
      console.error("ERRO REAL DO FIREBASE:", error);
      alert(
        `Erro retornado pelo Firebase:\n\nCódigo: ${error?.code || "sem-codigo"}\nMensagem: ${error?.message || String(error)}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return <EventoForm onSubmit={handleCriar} isSubmitting={isSubmitting} />;
}