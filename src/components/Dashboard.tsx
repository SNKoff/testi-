import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { Produto, Movimentacao } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Package, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);

  useEffect(() => {
    const unsubscribeProd = onSnapshot(collection(db, 'produtos'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Produto));
      setProdutos(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'produtos');
    });

    const qMov = query(collection(db, 'movimentacoes'), orderBy('data', 'desc'), limit(50));
    const unsubscribeMov = onSnapshot(qMov, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movimentacao));
      setMovimentacoes(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'movimentacoes');
    });

    return () => {
      unsubscribeProd();
      unsubscribeMov();
    };
  }, []);

  const totalItens = produtos.reduce((acc, p) => acc + (p.qtd || 0), 0);
  const valorTotal = produtos.reduce((acc, p) => acc + ((p.precoVenda || 0) * (p.qtd || 0)), 0);
  const itensCriticos = produtos.filter(p => (p.qtd || 0) <= (p.estoqueMinimo || 0));
  
  const vendasRecentes = movimentacoes.filter(m => m.tipo === 'Venda').length;

  // Chart data: Stock by product
  const chartData = produtos.slice(0, 10).map(p => ({
    name: p.nome.length > 10 ? p.nome.substring(0, 10) + '...' : p.nome,
    qtd: p.qtd
  }));

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Visão Geral do Inventário</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total em Estoque" 
          value={totalItens.toString()} 
          description="Quantidade total em estoque"
        />
        <StatCard 
          title="Valor Total" 
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(valorTotal)} 
          description="Valor total dos produtos"
        />
        <StatCard 
          title="Alertas Críticos" 
          value={itensCriticos.length.toString().padStart(2, '0')} 
          description="Produtos abaixo do estoque mínimo"
          trend={itensCriticos.length > 0 ? 'warning' : 'neutral'}
        />
        <StatCard 
          title="Saídas (Hoje)" 
          value={vendasRecentes.toString()} 
          description="Últimas 50 movimentações"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Critical Items Table */}
        <Card className="flex flex-col border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border px-6 py-4 space-y-0">
            <CardTitle className="text-sm font-semibold">Produtos em Estoque Crítico</CardTitle>
            <button className="text-xs font-medium text-primary hover:underline">Ver todos</button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-white/2 hover:bg-white/2 border-border">
                  <TableHead className="px-6 text-[11px] uppercase tracking-wider text-muted-foreground">SKU</TableHead>
                  <TableHead className="px-6 text-[11px] uppercase tracking-wider text-muted-foreground">Produto</TableHead>
                  <TableHead className="px-6 text-[11px] uppercase tracking-wider text-muted-foreground text-right">Qtd.</TableHead>
                  <TableHead className="px-6 text-[11px] uppercase tracking-wider text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itensCriticos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      Nenhum item com estoque baixo.
                    </TableCell>
                  </TableRow>
                ) : (
                  itensCriticos.map((p) => (
                    <TableRow key={p.id} className="border-border hover:bg-white/2">
                      <TableCell className="px-6 font-mono text-xs text-primary">{p.sku}</TableCell>
                      <TableCell className="px-6 text-sm font-medium">{p.nome}</TableCell>
                      <TableCell className="px-6 text-right font-mono text-sm">{(p.qtd || 0).toString().padStart(2, '0')}</TableCell>
                      <TableCell className="px-6">
                        <Badge variant="destructive" className="rounded-sm bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold uppercase text-destructive border-none">
                          Crítico
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="flex flex-col border-border bg-card">
          <CardHeader className="border-b border-border px-6 py-4">
            <CardTitle className="text-sm font-semibold">Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="flex flex-col">
                {movimentacoes.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">Nenhuma atividade recente.</div>
                ) : (
                  movimentacoes.map((m, i) => (
                    <div key={m.id} className={`flex flex-col gap-1 border-border p-5 ${i !== movimentacoes.length - 1 ? 'border-b' : ''}`}>
                      <p className="text-xs font-semibold">{m.tipo} #{m.id.substring(0, 4)}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.tipo === 'Entrada' ? '+' : '-'}{m.qtd} unidades de {produtos.find(p => p.id === m.produto_id)?.nome || 'Produto'}
                      </p>
                      <p className="text-[11px] text-muted-foreground opacity-50">
                        há {Math.floor((new Date().getTime() - new Date(m.data).getTime()) / 60000)} minutos
                      </p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, description, trend = 'neutral' }: { title: string; value: string; description: string; trend?: 'neutral' | 'warning' }) {
  return (
    <Card className="border-border bg-card p-6">
      <p className="mb-2 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className={`font-mono text-3xl font-bold tracking-tight ${trend === 'warning' ? 'text-destructive' : 'text-foreground'}`}>
        {value}
      </div>
    </Card>
  );
}
