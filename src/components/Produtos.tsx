import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Produto, Fornecedor } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Package, Search, Edit, Trash2 } from 'lucide-react';

export default function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [nome, setNome] = useState('');
  const [sku, setSku] = useState('');
  const [descricao, setDescricao] = useState('');
  const [precoCusto, setPrecoCusto] = useState('');
  const [precoVenda, setPrecoVenda] = useState('');
  const [qtd, setQtd] = useState('');
  const [estoqueMinimo, setEstoqueMinimo] = useState('');
  const [fornecedorId, setFornecedorId] = useState('');

  // Edit state
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editDescricao, setEditDescricao] = useState('');
  const [editPrecoCusto, setEditPrecoCusto] = useState('');
  const [editPrecoVenda, setEditPrecoVenda] = useState('');
  const [editQtd, setEditQtd] = useState('');
  const [editEstoqueMinimo, setEditEstoqueMinimo] = useState('');
  const [editFornecedorId, setEditFornecedorId] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Delete confirmation state
  const [produtoToDelete, setProdutoToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const qProd = query(collection(db, 'produtos'), orderBy('nome'));
    const unsubscribeProd = onSnapshot(qProd, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Produto));
      setProdutos(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'produtos');
    });

    const qForn = query(collection(db, 'fornecedores'), orderBy('nome'));
    const unsubscribeForn = onSnapshot(qForn, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fornecedor));
      setFornecedores(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'fornecedores');
    });

    return () => {
      unsubscribeProd();
      unsubscribeForn();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !sku || !precoCusto || !precoVenda || !qtd || !fornecedorId || !estoqueMinimo) {
      return toast.error('Preencha todos os campos obrigatórios');
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'produtos'), {
        nome,
        sku,
        descricao,
        precoCusto: parseFloat(precoCusto),
        precoVenda: parseFloat(precoVenda),
        qtd: parseInt(qtd),
        estoqueMinimo: parseInt(estoqueMinimo),
        fornecedor_id: fornecedorId
      });
      setNome('');
      setSku('');
      setDescricao('');
      setPrecoCusto('');
      setPrecoVenda('');
      setQtd('');
      setEstoqueMinimo('');
      setFornecedorId('');
      toast.success('Produto adicionado com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'produtos');
      toast.error('Erro ao adicionar produto');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!produtoToDelete) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'produtos', produtoToDelete));
      toast.success('Produto excluído com sucesso!');
      setIsDeleteDialogOpen(false);
      setProdutoToDelete(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `produtos/${produtoToDelete}`);
      toast.error('Erro ao excluir produto. Verifique se você tem permissão de administrador.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id: string) => {
    setProdutoToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleEdit = (p: Produto) => {
    setEditingProduto(p);
    setEditNome(p.nome || '');
    setEditSku(p.sku || '');
    setEditDescricao(p.descricao || '');
    setEditPrecoCusto(p.precoCusto?.toString() || '0');
    setEditPrecoVenda(p.precoVenda?.toString() || '0');
    setEditQtd(p.qtd?.toString() || '0');
    setEditEstoqueMinimo(p.estoqueMinimo?.toString() || '0');
    setEditFornecedorId(p.fornecedor_id || '');
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduto) return;

    if (!editNome || !editSku || !editPrecoCusto || !editPrecoVenda || !editQtd || !editFornecedorId || !editEstoqueMinimo) {
      return toast.error('Preencha todos os campos obrigatórios');
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'produtos', editingProduto.id), {
        nome: editNome,
        sku: editSku,
        descricao: editDescricao,
        precoCusto: parseFloat(editPrecoCusto),
        precoVenda: parseFloat(editPrecoVenda),
        qtd: parseInt(editQtd),
        estoqueMinimo: parseInt(editEstoqueMinimo),
        fornecedor_id: editFornecedorId
      });
      setIsEditDialogOpen(false);
      setEditingProduto(null);
      toast.success('Produto atualizado com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `produtos/${editingProduto.id}`);
      toast.error('Erro ao atualizar produto');
    } finally {
      setLoading(false);
    }
  };

  const filteredProdutos = produtos.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Gestão de Produtos</h1>
        <p className="text-sm text-muted-foreground">Adicione e gerencie os itens do seu inventário</p>
      </header>

      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border px-6 py-4">
          <CardTitle className="text-sm font-semibold">Adicionar Novo Produto</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome do Produto</label>
              <Input placeholder="Ex: Monitor 4K" value={nome} onChange={(e) => setNome(e.target.value)} className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SKU / Código</label>
              <Input placeholder="Ex: MON-4K-001" value={sku} onChange={(e) => setSku(e.target.value)} className="bg-background border-border font-mono" />
            </div>
            <div className="space-y-2 md:col-span-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descrição do Produto</label>
              <Textarea 
                placeholder="Detalhes técnicos, cor, dimensões..." 
                value={descricao} 
                onChange={(e) => setDescricao(e.target.value)} 
                className="bg-background border-border min-h-[80px]" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fornecedor</label>
              <Select value={fornecedorId} onValueChange={setFornecedorId}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {fornecedores.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preço de Custo (R$)</label>
              <Input type="number" step="0.01" placeholder="0.00" value={precoCusto} onChange={(e) => setPrecoCusto(e.target.value)} className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valor de Venda (R$)</label>
              <Input type="number" step="0.01" placeholder="0.00" value={precoVenda} onChange={(e) => setPrecoVenda(e.target.value)} className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quantidade Inicial</label>
              <Input type="number" placeholder="0" value={qtd} onChange={(e) => setQtd(e.target.value)} className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estoque Mínimo</label>
              <Input type="number" placeholder="Ex: 5" value={estoqueMinimo} onChange={(e) => setEstoqueMinimo(e.target.value)} className="bg-background border-border" />
            </div>
            <div className="flex items-end md:col-span-2">
              <Button type="submit" disabled={loading} className="w-full bg-primary text-white hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Produto
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border px-6 py-4 space-y-0">
          <CardTitle className="text-sm font-semibold">Inventário Atual</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou SKU..." 
              className="pl-8 bg-background border-border" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/2 hover:bg-white/2 border-border">
                <TableHead className="px-6 text-[11px] uppercase tracking-wider text-muted-foreground">SKU</TableHead>
                <TableHead className="px-6 text-[11px] uppercase tracking-wider text-muted-foreground">Produto</TableHead>
                <TableHead className="px-6 text-[11px] uppercase tracking-wider text-muted-foreground text-right">Custo</TableHead>
                <TableHead className="px-6 text-[11px] uppercase tracking-wider text-muted-foreground text-right">Venda</TableHead>
                <TableHead className="px-6 text-[11px] uppercase tracking-wider text-muted-foreground text-right">Mín.</TableHead>
                <TableHead className="px-6 text-[11px] uppercase tracking-wider text-muted-foreground text-right">Qtd</TableHead>
                <TableHead className="px-6 text-[11px] uppercase tracking-wider text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProdutos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhum produto encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProdutos.map((p) => {
                  const fornecedor = fornecedores.find(f => f.id === p.fornecedor_id);
                  const isLowStock = p.qtd <= (p.estoqueMinimo || 0);
                  return (
                    <TableRow key={p.id} className="border-border hover:bg-white/2">
                      <TableCell className="px-6 font-mono text-xs text-primary">{p.sku}</TableCell>
                      <TableCell className="px-6 text-sm font-medium">
                        <div>{p.nome}</div>
                        <div className="text-[10px] text-muted-foreground line-clamp-1 max-w-[200px]">{p.descricao}</div>
                        <div className="text-[10px] text-primary/60">{fornecedor?.nome || '-'}</div>
                      </TableCell>
                      <TableCell className="px-6 text-right font-mono text-xs text-muted-foreground">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.precoCusto || 0)}
                      </TableCell>
                      <TableCell className="px-6 text-right font-mono text-sm font-semibold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.precoVenda || 0)}
                      </TableCell>
                      <TableCell className="px-6 text-right font-mono text-xs text-muted-foreground">
                        {p.estoqueMinimo || 0}
                      </TableCell>
                      <TableCell className="px-6 text-right">
                        <span className={`font-mono text-sm font-bold ${isLowStock ? 'text-destructive' : 'text-foreground'}`}>
                          {(p.qtd || 0).toString().padStart(2, '0')}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <Edit size={14} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => confirmDelete(p.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="grid grid-cols-1 gap-6 py-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome do Produto</label>
              <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SKU / Código</label>
              <Input value={editSku} onChange={(e) => setEditSku(e.target.value)} className="bg-background border-border font-mono" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descrição</label>
              <Textarea 
                value={editDescricao} 
                onChange={(e) => setEditDescricao(e.target.value)} 
                className="bg-background border-border min-h-[80px]" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fornecedor</label>
              <Select value={editFornecedorId} onValueChange={setEditFornecedorId}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Selecione o fornecedor" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {fornecedores.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preço de Custo (R$)</label>
              <Input type="number" step="0.01" value={editPrecoCusto} onChange={(e) => setEditPrecoCusto(e.target.value)} className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valor de Venda (R$)</label>
              <Input type="number" step="0.01" value={editPrecoVenda} onChange={(e) => setEditPrecoVenda(e.target.value)} className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quantidade</label>
              <Input type="number" value={editQtd} onChange={(e) => setEditQtd(e.target.value)} className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estoque Mínimo</label>
              <Input type="number" value={editEstoqueMinimo} onChange={(e) => setEditEstoqueMinimo(e.target.value)} className="bg-background border-border" />
            </div>
            <DialogFooter className="md:col-span-2 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="text-muted-foreground">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-primary text-white hover:bg-primary/90">
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="text-muted-foreground">
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleDelete} 
              disabled={loading}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Excluir Produto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
