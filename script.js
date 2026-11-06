// Dados fictícios padronizados das disciplinas do 9º Ano
const dadosDisciplinas = [
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

// Função obrigatória para padronizar e validar qualquer nota no formato de 0 a 10
function normalizarNota(valor) {
  // Se for nulo, indefinido ou texto vazio, a nota ainda não foi lançada
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Se for texto, troca vírgula por ponto decimal para poder converter em número
  if (typeof valor === 'string') {
    valor = valor.replace(',', '.');
  }

  const numero = parseFloat(valor);

  // Se não for um número válido, retorna nulo
  if (isNaN(numero)) {
    return null;
  }

  // Se estiver entre 0 e 10, já está no padrão correto
  if (numero >= 0 && numero <= 10) {
    return numero;
  }

  // Se for maior que 10 e menor/igual a 100, divide por 10 (ex: 85 vira 8.5)
  if (numero > 10 && numero <= 100) {
    return numero / 10;
  }

  // Valores fora dessas regras são considerados inválidos
  return null;
}

// Função para formatar a nota para exibição na tabela (ex: 8.5 vira "8,5")
function formatarExibicaoNota(nota) {
  if (nota === null) {
    return "—";
  }
  return nota.toFixed(1).replace('.', ',');
}

// Função principal que processa os dados e desenha o boletim na tela
function carregarBoletim() {
  const corpoTabela = document.getElementById('tabela-boletim');
  corpoTabela.innerHTML = '';

  let somaMedias = 0;
  let quantidadeDisciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let bomDesempenhoCount = 0;
  let atencaoCount = 0;

  // Passa por cada disciplina da lista
  dadosDisciplinas.forEach(item => {
    // Normaliza as notas dos três trimestres
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    // Calcula a soma das faltas
    const totalFaltasItem = item.faltas.reduce((acc, f) => acc + f, 0);
    totalFaltasGeral += totalFaltasItem;

    // Filtra apenas as notas válidas disponíveis para calcular a média
    const notasValidas = [n1, n2, n3].filter(n => n !== null);

    let mediaFormatada = "—";
    let situacaoTexto = "Nota ainda não disponível";
    let classeSituacao = "situacao-indisponivel";

    if (notasValidas.length > 0) {
      const somaNotas = notasValidas.reduce((acc, n) => acc + n, 0);
      const mediaCalculada = somaNotas / notasValidas.length;
      
      mediaFormatada = formatarExibicaoNota(mediaCalculada);
      somaMedias += mediaCalculada;
      quantidadeDisciplinasComMedia++;

      // Define a situação com base na média mínima de 6.0
      if (mediaCalculada >= 6.0) {
        situacaoTexto = "Bom desempenho";
        classeSituacao = "situacao-bom";
        bomDesempenhoCount++;
      } else {
        situacaoTexto = "Atenção";
        classeSituacao = "situacao-atencao";
        atencaoCount++;
      }
    }

    // Cria a linha HTML da tabela para a disciplina
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.disciplina}</td>
      <td>${formatarExibicaoNota(n1)}</td>
      <td>${formatarExibicaoNota(n2)}</td>
      <td>${formatarExibicaoNota(n3)}</td>
      <td><strong>${mediaFormatada}</strong></td>
      <td>${totalFaltasItem}</td>
      <td class="${classeSituacao}">${situacaoTexto}</td>
    `;

    corpoTabela.appendChild(tr);
  });

  // Atualiza os cards de resumo no topo
  const mediaGeralGlobal = quantidadeDisciplinasComMedia > 0 
    ? (somaMedias / quantidadeDisciplinasComMedia).toFixed(1).replace('.', ',') 
    : "—";

  document.getElementById('card-media-geral').innerText = mediaGeralGlobal;
  document.getElementById('card-total-faltas').innerText = totalFaltasGeral;
  document.getElementById('card-bom-desempenho').innerText = bomDesempenhoCount;
  document.getElementById('card-atencao').innerText = atencaoCount;

  // NOTA: A frequência abaixo é APENAS FICTÍCIA/DEMONSTRATIVA nesta etapa.
  // Ela não é calculada a partir das faltas e será tratada de outra forma no futuro.
  document.getElementById('card-frequencia').innerText = "92% (Frequência adequada)";
}

// Executa a função assim que a página é carregada
document.addEventListener('DOMContentLoaded', carregarBoletim);