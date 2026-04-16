import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';
import { Usuario } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Users } from 'lucide-react';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState<Usuario['cargo']>('Vendedor');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'usuarios'), orderBy('nome'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Usuario));
      setUsuarios(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'usuarios');
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) return toast.error('Nome é obrigatório');
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'usuarios'), { nome, cargo });
      setNome('');
      setCargo('Vendedor');
      toast.success('Usuário cadastrado com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'usuarios');
      toast.error('Erro ao cadastrar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Gestão de Usuários</h1>
        <p className="text-sm text-muted-foreground">Controle quem tem acesso ao sistema e suas permissões</p>
      </header>

      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border px-6 py-4">
          <CardTitle className="text-sm font-semibold">Novo Usuário</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome Completo</label>
              <Input placeholder="Ex: João Silva" value={nome} onChange={(e) => setNome(e.target.value)} className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cargo / Função</label>
              <Select value={cargo} onValueChange={(v: any) => setCargo(v)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="Vendedor">Vendedor</SelectItem>
                  <SelectItem value="Gerente">Gerente</SelectItem>
                  <SelectItem value="Estoquista">Estoquista</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={loading} className="w-full bg-primary text-white hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Usuário
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border px-6 py-4">
          <CardTitle className="text-sm font-semibold">Usuários do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/2 hover:bg-white/2 border-border">
                <TableHead className="px-6 text-[11px] uppercase tracking-wider text-muted-foreground">Nome</TableHead>
                <TableHead className="px-6 text-[11px] uppercase tracking-wider text-muted-foreground">Cargo</TableHead>
                <TableHead className="px-6 text-[11px] uppercase tracking-wider text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    Nenhum usuário cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                usuarios.map((u) => (
                  <TableRow key={u.id} className="border-border hover:bg-white/2">
                    <TableCell className="px-6 text-sm font-medium">{u.nome}</TableCell>
                    <TableCell className="px-6">
                      <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-tight ${
                        u.cargo === 'Gerente' ? 'bg-primary/10 text-primary' : 
                        u.cargo === 'Estoquista' ? 'bg-secondary/10 text-secondary' : 
                        'bg-muted text-muted-foreground'
                      }`}>
                        {u.cargo}
                      </span>
                    </TableCell>
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
