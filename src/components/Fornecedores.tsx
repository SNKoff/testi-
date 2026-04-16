import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';
import { Fornecedor } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Truck } from 'lucide-react';

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [nome, setNome] = useState('');
  const [contato, setContato] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'fornecedores'), orderBy('nome'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Fornecedor));
      setFornecedores(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'fornecedores');
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return toast.error('Nome é obrigatório');
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'fornecedores'), { nome, contato });
      setNome('');
      setContato('');
      toast.success('Fornecedor cadastrado com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'fornecedores');
      toast.error('Erro ao cadastrar fornecedor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Gestão de Fornecedores</h1>
        <p className="text-sm text-muted-foreground">Cadastre e gerencie seus parceiros comerciais</p>
      </header>

      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border px-6 py-4">
          <CardTitle className="text-sm font-semibold">Novo Fornecedor</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome da Empresa</label>
              <Input placeholder="Ex: Tech Solutions" value={nome} onChange={(e) => setNome(e.target.value)} className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contato / Telefone</label>
              <Input placeholder="Ex: (11) 99999-9999" value={contato} onChange={(e) => setContato(e.target.value)} className="bg-background border-border" />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={loading} className="w-full bg-primary text-white hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Fornecedor
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border px-6 py-4">
          <CardTitle className="text-sm font-semibold">Lista de Fornecedores</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/2 hover:bg-white/2 border-border">
                <TableHead className="px-6 text-[11px] uppercase tracking-wider text-muted-foreground">Nome</TableHead>
                <TableHead className="px-6 text-[11px] uppercase tracking-wider text-muted-foreground">Contato</TableHead>
                <TableHead className="px-6 text-[11px] uppercase tracking-wider text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fornecedores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    Nenhum fornecedor cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                fornecedores.map((f) => (
                  <TableRow key={f.id} className="border-border hover:bg-white/2">
                    <TableCell className="px-6 text-sm font-medium">{f.nome}</TableCell>
                    <TableCell className="px-6 text-sm text-muted-foreground">{f.contato || '-'}</TableCell>
                    <TableCell className="px-6 text-right">
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
