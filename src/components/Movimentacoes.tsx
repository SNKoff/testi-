import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, query, orderBy, limit, doc, updateDoc, increment } from 'firebase/firestore';
import { Produto, Usuario, Movimentacao } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeftRight, ArrowDownRight, ArrowUpRight, History } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Movimentacoes() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [historico, setHistorico] = useState<Movimentacao[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [tipo, setTipo] = useState<Movimentacao['tipo']>('Venda');
  const [produtoId, setProdutoId] = useState('');
  const [usuarioId, setUsuarioId] = useState('');
  const [qtd, setQtd] = useState('');

  useEffect(() => {
    const qProd = query(collection(db, 'produtos'), orderBy('nome'));
    const unsubscribeProd = onSnapshot(qProd, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Produto));
      setProdutos(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'produtos');
    });

    const qUser = query(collection(db, 'usuarios'), orderBy('nome'));
    const unsubscribeUser = onSnapshot(qUser, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Usuario));
      setUsuarios(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'usuarios');
    });

    const qHist = query(collection(db, 'movimentacoes'), orderBy('data', 'desc'), limit(20));
    const unsubscribeHist = onSnapshot(qHist, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movimentacao));
      setHistorico(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'movimentacoes');
    });

    return () => {
      unsubscribeProd();
      unsubscribeUser();
      unsubscribeHist();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produtoId || !usuarioId || !qtd) {
      return toast.error('Preencha todos os campos');
    }

    const qtdNum = parseInt(qtd);
    const produto = produtos.find(p => p.id === produtoId);
    
    if (!produto) return;

    // Check stock for sales/losses
    if ((tipo === 'Venda' || tipo === 'Baixa (Perda/Quebra)') && produto.qtd < qtdNum) {
      return toast.error('Estoque insuficiente para esta operação');
    }

    setLoading(true);
    try {
      // 1. Create movement record
      await addDoc(collection(db, 'movimentacoes'), {
        tipo,
        produto_id: produtoId,
        usuario_id: usuarioId,
        qtd: qtdNum,
        data: new Date().toISOString()
      });

      // 2. Update product stock
      const stockChange = tipo === 'Entrada' ? qtdNum : -qtdNum;
      await updateDoc(doc(db, 'produtos', produtoId), {
        qtd: increment(stockChange)
      });

      setQtd('');
      toast.success('Movimentação registrada com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'movimentacoes');
      toast.error('Erro ao registrar movimentação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Movimentações de Estoque</h1>
        <p className="text-sm text-muted-foreground">Registre entradas e saídas de produtos</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card className="border-border bg-card">
          <CardHeader className="border-b border-border px-6 py-4">
            <CardTitle className="text-sm font-semibold">Registrar Nova Operação</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo de Operação</label>
                <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="Venda">Venda</SelectItem>
                    <SelectItem value="Entrada">Entrada de Estoque</SelectItem>
                    <SelectItem value="Baixa (Perda/Quebra)">Baixa (Perda/Quebra)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Produto</label>
                <Select value={produtoId} onValueChange={setProdutoId}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {produtos.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome} (Estoque: {p.qtd})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Funcionário Responsável</label>
                <Select value={usuarioId} onValueChange={setUsuarioId}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {usuarios.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quantidade</label>
                <Input type="number" min="1" value={qtd} onChange={(e) => setQtd(e.target.value)} className="bg-background border-border" />
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-primary text-white hover:bg-primary/90">
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Confirmar Operação
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="flex flex-col border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border px-6 py-4 space-y-0">
            <CardTitle className="text-sm font-semibold">Histórico Recente</CardTitle>
            <History className="h-4 w-4 text-muted-foreground opacity-50" />
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-white/2 hover:bg-white/2 border-border">
                    <TableHead className="px-6 text-[11px] uppercase tracking-wider text-muted-foreground">Data</TableHead>
                    <TableHead className="px-6 text-[11px] uppercase tracking-wider text-muted-foreground">Tipo</TableHead>
                    <TableHead className="px-6 text-[11px] uppercase tracking-wider text-muted-foreground">Produto</TableHead>
                    <TableHead className="px-6 text-[11px] uppercase tracking-wider text-muted-foreground text-right">Qtd</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historico.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        Nenhuma movimentação registrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    historico.map((m) => {
                      const produto = produtos.find(p => p.id === m.produto_id);
                      return (
                        <TableRow key={m.id} className="border-border hover:bg-white/2">
                          <TableCell className="px-6 text-[11px] text-muted-foreground">
                            {format(new Date(m.data), 'dd/MM HH:mm', { locale: ptBR })}
                          </TableCell>
                          <TableCell className="px-6">
                            <div className="flex items-center gap-1">
                              {m.tipo === 'Entrada' ? (
                                <ArrowUpRight className="h-3 w-3 text-success" />
                              ) : (
                                <ArrowDownRight className="h-3 w-3 text-destructive" />
                              )}
                              <span className="text-[11px] font-semibold uppercase tracking-tight">{m.tipo}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 max-w-[120px] truncate text-xs font-medium">
                            {produto?.nome || 'Produto Removido'}
                          </TableCell>
                          <TableCell className="px-6 text-right font-mono text-xs font-bold">
                            {m.qtd.toString().padStart(2, '0')}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
