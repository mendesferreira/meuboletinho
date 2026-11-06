// Configuração fixa do estudante (não alterar)
const CONFIG_ALUNO = {
  turma: "9B",
  numeroChamada: 42,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// Variável para guardar o PIN apenas na memória durante a sessão
let pinSessao = "";

// Variável para controlar o modo de edição
let modoEdicao = false;

// Dados fictícios locais padronizados (usados se a API não retornar dados salvos)
const dadosDisciplinasLocais = [
  { disciplina: "Língua Portuguesa", tri1: 78, tri2: "8,2", tri3: 8.6, faltas: [2, 2, 1] },
  { disciplina: "Matemática", tri1: 55, tri2: "5,4", tri3: null, faltas: [3, 2, 2] },
  { disciplina: "Ciências", tri1: 84, tri2: 7.9, tri3: "8,3", faltas: [1, 1, 1] },
  { disciplina: "História", tri1: "7,1", tri2: 82, tri3: null, faltas: [1, 2, 1] },
  { disciplina: "Geografia", tri1: 69, tri2: "7,5", tri3: 7.8, faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 88, tri2: 8.4, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Arte", tri1: "9,2", tri2: 87, tri3: 9.0, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 96, tri2: "9,3", tri3: null, faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 91, tri2: 8.9, tri3: "9,4", faltas: [1, 1, 0] },
  { disciplina: "Educação Financeira", tri1: 76, tri2: "7,2", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Rec. Aprend. Matemática", tri1: 58, tri2: "5,9", tri3: 6.2, faltas: [2, 2, 1] },
  { disciplina: "Leitura Rec. Aprend. Lingua Portuguesa", tri1: 72, tri2: "7,6", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 49, tri2: 5.5, tri3: "5,8", faltas: [2, 2, 2] },
  { disciplina: "Literatura Arte e Movimento", tri1: "8,0", tri2: 84, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Práticas Experimentais", tri1: 64, tri2: "6,6", tri3: 7.0, faltas: [1, 1, 1] }
];

// Array de trabalho atual com as disciplinas do boletim
let listaDisciplinasAtual = [];

// Função para normalizar notas dos dados antigos (antiga normalização preservada)
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }
  if (typeof valor === 'string') {
    valor = valor.replace(',', '.');
  }
  const numero = parseFloat(valor);
  if (isNaN(numero)) {
    return null;
  }
  if (numero >= 0 && numero <= 10) {
    return numero;
  }
  if (numero > 10 && numero <= 100) {
    return numero / 10;
  }
  return null;
}

// Validação rigorosa para notas digitadas no editor (aceita 0 a 10, ponto/vírgula ou vazio)
function validarNotaEditada(valorStr) {
  if (valorStr === null || valorStr === undefined || valorStr.trim() === "") {
    return { valido: true, valor: null };
  }
  const limpo = valorStr.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(limpo)) {
    return { valido: false, valor: null };
  }
  const num = parseFloat(limpo);
  if (num >= 0 && num <= 10) {
    return { valido: true, valor: num };
  }
  return { valido: false, valor: null };
}

// Validação de faltas (aceita inteiros >= 0)
function validarFaltaEditada(valorStr) {
  if (valorStr === null || valorStr === undefined || valorStr.trim() === "") {
    return { valido: false, valor: null };
  }
  const limpo = valorStr.trim();
  if (!/^\d+$/.test(limpo)) {
    return { valido: false, valor: null };
  }
  const num = parseInt(limpo, 10);
  if (num >= 0) {
    return { valido: true, valor: num };
  }
  return { valido: false, valor: null };
}

// Formatação visual da nota para a tabela
function formatarExibicaoNota(nota) {
  if (nota === null ||
    