export interface Fornecedor {
  id: string;
  nome: string;
  contato: string;
}

export interface Usuario {
  id: string;
  nome: string;
  cargo: 'Vendedor' | 'Gerente' | 'Estoquista';
}

export interface Produto {
  id: string;
  nome: string;
  sku: string;
  descricao: string;
  precoCusto: number;
  precoVenda: number;
  qtd: number;
  fornecedor_id: string;
  estoqueMinimo: number;
}

export interface Movimentacao {
  id: string;
  tipo: 'Venda' | 'Baixa (Perda/Quebra)' | 'Entrada';
  produto_id: string;
  usuario_id: string;
  qtd: number;
  data: string;
}

// Learning App Schema
export interface AppUser {
  id: string;
  nome: string;
  email: string;
  nivel: string;
  cenariosCompletados: string[];
}

export interface Session {
  id: string;
  userId: string;
  cenario: string;
  data: string;
  duracao: number;
  transcricao: string;
  errosEncontrados: string[];
  nota: number;
}

export interface Progress {
  id: string;
  userId: string;
  cenario: string;
  tentativas: number;
  melhorNota: number;
  vocabularioAprendido: string[];
}
