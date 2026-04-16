import React, { useState, useEffect } from 'react';
import { auth, signInWithGoogle, logout, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, limit, getDocFromServer, doc } from 'firebase/firestore';
import { Toaster, toast } from 'sonner';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Truck, 
  ArrowLeftRight, 
  LogOut, 
  LogIn,
  Package2,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

// Components (to be implemented)
import Dashboard from './components/Dashboard';
import Produtos from './components/Produtos';
import Fornecedores from './components/Fornecedores';
import Usuarios from './components/Usuarios';
import Movimentacoes from './components/Movimentacoes';
import Relatorios from './components/Relatorios';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Test connection as per critical directive
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
          toast.error("Erro de conexão com o Firebase. Verifique sua configuração.");
        }
      }
    };
    testConnection();

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Erro detalhado de login:", error);
      toast.error(`Falha ao entrar: ${error.message || 'Erro desconhecido'}`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="font-mono text-sm tracking-widest text-muted-foreground uppercase">Carregando Estoque Pro...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-4 font-sans">
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
            <Package2 size={32} />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tighter text-primary uppercase">Estoque Pro</h1>
            <p className="text-sm font-medium text-muted-foreground">SISTEMA AVANÇADO DE GESTÃO DE ESTOQUE</p>
          </div>
        </div>

        <Card className="w-full max-w-md border-border bg-card shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-semibold">Bem-vindo de volta</CardTitle>
            <p className="text-sm text-muted-foreground">Acesse sua conta para gerenciar o inventário</p>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 pt-6">
            <Button 
              onClick={handleLogin} 
              className="h-12 w-full bg-primary text-white hover:bg-primary/90 transition-all"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Entrar com Google
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Segurança Garantida</span>
              </div>
            </div>
            <p className="text-center text-xs leading-relaxed text-muted-foreground opacity-60">
              Ao entrar, você concorda com os termos de uso e políticas de privacidade da plataforma.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground font-sans">
      <Toaster position="top-right" theme="dark" />
      
      {/* Sidebar */}
      <aside className="hidden w-[240px] flex-col border-r border-border bg-sidebar md:flex">
        <div className="flex h-20 items-center gap-3 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white">
            <Package2 size={20} />
          </div>
          <span className="text-lg font-bold tracking-tight text-primary uppercase">Estoque Pro</span>
        </div>
        
        <ScrollArea className="flex-1 px-4 py-4">
          <nav className="space-y-1">
            <NavItem 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')}
              icon={<LayoutDashboard size={18} />}
              label="Dashboard"
            />
            <NavItem 
              active={activeTab === 'produtos'} 
              onClick={() => setActiveTab('produtos')}
              icon={<Package size={18} />}
              label="Produtos"
            />
            <NavItem 
              active={activeTab === 'movimentacoes'} 
              onClick={() => setActiveTab('movimentacoes')}
              icon={<ArrowLeftRight size={18} />}
              label="Movimentações"
            />
            <NavItem 
              active={activeTab === 'relatorios'} 
              onClick={() => setActiveTab('relatorios')}
              icon={<TrendingUp size={18} />}
              label="Lucros"
            />
            <NavItem 
              active={activeTab === 'fornecedores'} 
              onClick={() => setActiveTab('fornecedores')}
              icon={<Truck size={18} />}
              label="Fornecedores"
            />
            <NavItem 
              active={activeTab === 'usuarios'} 
              onClick={() => setActiveTab('usuarios')}
              icon={<Users size={18} />}
              label="Usuários"
            />
          </nav>
        </ScrollArea>
        
        <div className="mt-auto border-t border-border p-4">
          <div className="flex flex-col gap-1 rounded-lg bg-white/5 p-4">
            <p className="truncate text-sm font-semibold text-foreground">{user.displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={logout}
              className="mt-2 h-8 w-full justify-start px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden bg-background p-8">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-white">
              <Package2 size={14} />
            </div>
            <span className="text-lg font-bold tracking-tight text-primary uppercase">Estoque Pro</span>
          </div>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut size={20} />
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl space-y-8">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'produtos' && <Produtos />}
            {activeTab === 'fornecedores' && <Fornecedores />}
            {activeTab === 'usuarios' && <Usuarios />}
            {activeTab === 'movimentacoes' && <Movimentacoes />}
            {activeTab === 'relatorios' && <Relatorios />}
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex h-16 items-center justify-around border-t border-zinc-200 bg-white px-2 md:hidden">
          <MobileNavItem 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            icon={<LayoutDashboard size={20} />}
          />
          <MobileNavItem 
            active={activeTab === 'produtos'} 
            onClick={() => setActiveTab('produtos')}
            icon={<Package size={20} />}
          />
          <MobileNavItem 
            active={activeTab === 'movimentacoes'} 
            onClick={() => setActiveTab('movimentacoes')}
            icon={<ArrowLeftRight size={20} />}
          />
          <MobileNavItem 
            active={activeTab === 'relatorios'} 
            onClick={() => setActiveTab('relatorios')}
            icon={<TrendingUp size={20} />}
          />
          <MobileNavItem 
            active={activeTab === 'fornecedores'} 
            onClick={() => setActiveTab('fornecedores')}
            icon={<Truck size={20} />}
          />
          <MobileNavItem 
            active={activeTab === 'usuarios'} 
            onClick={() => setActiveTab('usuarios')}
            icon={<Users size={20} />}
          />
        </nav>
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
        active 
          ? 'bg-secondary text-white shadow-sm' 
          : 'text-muted-foreground hover:bg-border hover:text-foreground'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function MobileNavItem({ active, onClick, icon }: { active: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors ${
        active ? 'text-zinc-900' : 'text-zinc-400'
      }`}
    >
      {icon}
    </button>
  );
}
