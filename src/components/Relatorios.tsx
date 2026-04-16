import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Produto } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, TrendingUp, Wallet, PieChart } from 'lucide-react';

export default function Relatorios() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [selectedProdutoId, setSelectedProdutoId] = useState<string>('');
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'produtos'), orderBy('nome'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Produto));
      setProdutos(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'produtos');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedProdutoId) {
      const prod = produtos.find(p => p.id === selectedProdutoId);
      setSelectedProduto(prod || null);
    } else {
      setSelectedProduto(null);
    }
  }, [selectedProdutoId, produtos]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const investment = selectedProduto ? (selectedProduto.precoCusto || 0) * (selectedProduto.qtd || 0) : 0;
  const profitPerUnit = selectedProduto ? (selectedProduto.precoVenda || 0) - (selectedProduto.precoCusto || 0) : 0;
  const totalPotentialProfit = selectedProduto ? profitPerUnit * (selectedProduto.qtd || 0) : 0;
  const margin = selectedProduto && (selectedProduto.precoCusto || 0) > 0 
    ? (profitPerUnit / selectedProduto.precoCusto) * 100 
    : 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Análise de Lucro e Investimento</h1>
        <p className="text-sm text-muted-foreground">Selecione um produto para ver o detalhamento financeiro</p>
      </header>

      <Card className="border-border bg-card">
        <CardHeader className="px-6 py-4">
          <CardTitle className="text-sm font-semibold">Seleção de Produto</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="max-w-md">
            <Select value={selectedProdutoId} onValueChange={setSelectedProdutoId}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Escolha um produto para analisar" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {produtos.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.nome} ({p.sku})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedProduto ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Investment Card */}
          <Card className="border-border bg-card overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-4 border-b border-border bg-white/2 px-6 py-4 space-y-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Wallet size={20} />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Investimento Total</CardTitle>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Capital imobilizado em estoque</p>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Custo Unitário:</span>
                <span className="font-mono text-sm">{formatCurrency(selectedProduto.precoCusto || 0)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Qtd em Estoque:</span>
                <span className="font-mono text-sm">{selectedProduto.qtd || 0} un.</span>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-semibold">Total Investido:</span>
                  <span className="font-mono text-2xl font-bold text-primary">{formatCurrency(investment)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profit Card */}
          <Card className="border-border bg-card overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-4 border-b border-border bg-white/2 px-6 py-4 space-y-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <TrendingUp size={20} />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Projeção de Lucro</CardTitle>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Retorno esperado sobre as vendas</p>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Lucro por Unidade:</span>
                <span className="font-mono text-sm text-emerald-500">+{formatCurrency(profitPerUnit)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Margem de Lucro:</span>
                <span className="font-mono text-sm text-emerald-500">{margin.toFixed(2)}%</span>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-semibold">Lucro Potencial Total:</span>
                  <span className="font-mono text-2xl font-bold text-emerald-500">{formatCurrency(totalPotentialProfit)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Stats */}
          <Card className="md:col-span-2 border-border bg-card">
            <CardHeader className="border-b border-border px-6 py-4">
              <CardTitle className="text-sm font-semibold">Resumo de Venda</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Preço de Venda</p>
                  <p className="font-mono text-xl font-bold">{formatCurrency(selectedProduto.precoVenda || 0)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Faturamento Previsto</p>
                  <p className="font-mono text-xl font-bold">{formatCurrency((selectedProduto.precoVenda || 0) * (selectedProduto.qtd || 0))}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Eficiência de Capital</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-white/5 overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${Math.min(margin, 100)}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs">{margin.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white/2">
          <PieChart className="mb-4 h-12 w-12 text-muted-foreground opacity-20" />
          <p className="text-sm text-muted-foreground">Nenhum produto selecionado para análise.</p>
        </div>
      )}
    </div>
  );
}
