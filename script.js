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
  if (nota === null || nota === undefined) {
    return "—";
  }
  if (typeof nota === 'number') {
    return nota.toFixed(1).replace('.', ',');
  }
  const n = normalizarNota(nota);
  return n === null ? "—" : n.toFixed(1).replace('.', ',');
}

// Inicializa a interface e eventos assim que o DOM carrega
document.addEventListener('DOMContentLoaded', () => {
  const formLogin = document.getElementById('form-login');
  const btnAlternarEdicao = document.getElementById('btn-alternar-edicao');
  const btnSalvar = document.getElementById('btn-salvar');

  formLogin.addEventListener('submit', efetuarLogin);
  btnAlternarEdicao.addEventListener('click', alternarModoEdicao);
  btnSalvar.addEventListener('click', salvarAlteracoes);
});

// Realiza o acesso via POST na API
async function efetuarLogin(event) {
  event.preventDefault();
  const inputPin = document.getElementById('input-pin');
  const msgLogin = document.getElementById('msg-login');
  const pinDigitado = inputPin.value.trim();

  if (!pinDigitado) return;

  msgLogin.className = 'mensagem-status';
  msgLogin.innerText = 'Conectando...';

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinDigitado
      })
    });

    if (resposta.status === 401) {
      msgLogin.className = 'mensagem-status erro';
      msgLogin.innerText = 'Turma, chamada ou PIN inválidos.';
      return;
    }

    if (resposta.status === 429) {
      msgLogin.className = 'mensagem-status erro';
      msgLogin.innerText = 'Muitas tentativas. Aguarde um minuto e tente novamente.';
      return;
    }

    if (!resposta.ok) {
      msgLogin.className = 'mensagem-status erro';
      msgLogin.innerText = 'Não foi possível conectar ao servidor. Tente novamente.';
      return;
    }

    const json = await resposta.json();
    pinSessao = pinDigitado; // Mantém PIN na memória da sessão
    inputPin.value = ''; // Limpa o campo do PIN por segurança

    document.getElementById('secao-login').style.display = 'none';
    document.getElementById('conteudo-boletim').style.display = 'block';

    // Processa os dados retornados ou utiliza os locais se não houver dados salvos
    if (json && json.dados && Array.isArray(json.dados.disciplinas) && json.dados.disciplinas.length > 0) {
      listaDisciplinasAtual = json.dados.disciplinas;
    } else {
      listaDisciplinasAtual = JSON.parse(JSON.stringify(dadosDisciplinasLocais));
    }

    renderizarBoletim();
  } catch (erro) {
    msgLogin.className = 'mensagem-status erro';
    msgLogin.innerText = 'Não foi possível conectar ao servidor. Tente novamente.';
  }
}

// Atualiza cards, médias e linhas da tabela no DOM com segurança
function renderizarBoletim() {
  const corpoTabela = document.getElementById('tabela-boletim');
  corpoTabela.innerHTML = '';

  let somaMedias = 0;
  let quantidadeDisciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let bomDesempenhoCount = 0;
  let atencaoCount = 0;

  listaDisciplinasAtual.forEach((item, index) => {
    let n1, n2, n3, faltasArr;

    if (item.faltas && Array.isArray(item.faltas)) {
      faltasArr = item.faltas;
    } else {
      faltasArr = [item.f1 || 0, item.f2 || 0, item.f3 || 0];
    }

    const totalFaltasItem = faltasArr.reduce((acc, f) => acc + Number(f || 0), 0);
    totalFaltasGeral += totalFaltasItem;

    n1 = normalizarNota(item.tri1);
    n2 = normalizarNota(item.tri2);
    n3 = normalizarNota(item.tri3);

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

    const tr = document.createElement('tr');

    if (modoEdicao) {
      // Criação dos elementos em modo de edição
      const tdNome = document.createElement('td');
      tdNome.textContent = item.disciplina;
      tr.appendChild(tdNome);

      const valN1 = item.tri1 === null || item.tri1 === undefined ? "" : item.tri1;
      const valN2 = item.tri2 === null || item.tri2 === undefined ? "" : item.tri2;
      const valN3 = item.tri3 === null || item.tri3 === undefined ? "" : item.tri3;

      tr.appendChild(criarTdInput(`n1-${index}`, valN1));
      tr.appendChild(criarTdInput(`n2-${index}`, valN2));
      tr.appendChild(criarTdInput(`n3-${index}`, valN3));

      const tdMedia = document.createElement('td');
      const strongMedia = document.createElement('strong');
      strongMedia.textContent = mediaFormatada;
      tdMedia.appendChild(strongMedia);
      tr.appendChild(tdMedia);

      tr.appendChild(criarTdInput(`f1-${index}`, faltasArr[0]));
      tr.appendChild(criarTdInput(`f2-${index}`, faltasArr[1]));
      tr.appendChild(criarTdInput(`f3-${index}`, faltasArr[2]));

      const tdSit = document.createElement('td');
      tdSit.className = classeSituacao;
      tdSit.textContent = situacaoTexto;
      tr.appendChild(tdSit);
    } else {
      // Modo de visualização normal
      const tdNome = document.createElement('td');
      tdNome.textContent = item.disciplina;

      const tdN1 = document.createElement('td');
      tdN1.textContent = formatarExibicaoNota(n1);

      const tdN2 = document.createElement('td');
      tdN2.textContent = formatarExibicaoNota(n2);

      const tdN3 = document.createElement('td');
      tdN3.textContent = formatarExibicaoNota(n3);

      const tdMedia = document.createElement('td');
      const strongMedia = document.createElement('strong');
      strongMedia.textContent = mediaFormatada;
      tdMedia.appendChild(strongMedia);

      const tdFaltas = document.createElement('td');
      tdFaltas.textContent = totalFaltasItem;

      const tdSit = document.createElement('td');
      tdSit.className = classeSituacao;
      tdSit.textContent = situacaoTexto;

      tr.appendChild(tdNome);
      tr.appendChild(tdN1);
      tr.appendChild(tdN2);
      tr.appendChild(tdN3);
      tr.appendChild(tdMedia);
      tr.appendChild(tdFaltas);
      tr.appendChild(tdSit);
    }

    corpoTabela.appendChild(tr);
  });

  // Atualização dos cards de resumo
  const mediaGeralGlobal = quantidadeDisciplinasComMedia > 0 
    ? (somaMedias / quantidadeDisciplinasComMedia).toFixed(1).replace('.', ',') 
    : "—";

  document.getElementById('card-media-geral').innerText = mediaGeralGlobal;
  document.getElementById('card-total-faltas').innerText = totalFaltasGeral;
  document.getElementById('card-bom-desempenho').innerText = bomDesempenhoCount;
  document.getElementById('card-atencao').innerText = atencaoCount;

  // Frequência demonstrativa fictícia
  document.getElementById('card-frequencia').innerText = "92% (Frequência adequada)";
}

// Função auxiliar para criar células com inputs
function criarTdInput(id, valor) {
  const td = document.createElement('td');
  const input = document.createElement('input');
  input.type = 'text';
  input.id = id;
  input.value = valor !== null && valor !== undefined ? valor : "";
  td.appendChild(input);
  return td;
}

// Alterna entre o modo de edição e visualização
function alternarModoEdicao() {
  modoEdicao = !modoEdicao;
  const btnAlternar = document.getElementById('btn-alternar-edicao');
  const btnSalvar = document.getElementById('btn-salvar');
  const msgEdicao = document.getElementById('msg-edicao');

  msgEdicao.innerText = '';
  if (modoEdicao) {
    btnAlternar.innerText = 'Cancelar edição';
    btnSalvar.style.display = 'inline-block';
  } else {
    btnAlternar.innerText = 'Alterar dados';
    btnSalvar.style.display = 'none';
  }
  renderizarBoletim();
}

// Salva as alterações validadas na API via PUT
async function salvarAlteracoes() {
  const msgEdicao = document.getElementById('msg-edicao');
  msgEdicao.className = 'mensagem-status';
  msgEdicao.innerText = 'Salvando...';

  let temErro = false;
  const novasDisciplinas = [];

  // Validação dos dados em cada linha
  for (let i = 0; i < listaDisciplinasAtual.length; i++) {
    const elN1 = document.getElementById(`n1-${i}`);
    const elN2 = document.getElementById(`n2-${i}`);
    const elN3 = document.getElementById(`n3-${i}`);
    const elF1 = document.getElementById(`f1-${i}`);
    const elF2 = document.getElementById(`f2-${i}`);
    const elF3 = document.getElementById(`f3-${i}`);

    [elN1, elN2, elN3, elF1, elF2, elF3].forEach(el => el && el.classList.remove('campo-invalido'));

    const resN1 = validarNotaEditada(elN1.value);
    const resN2 = validarNotaEditada(elN2.value);
    const resN3 = validarNotaEditada(elN3.value);

    if (!resN1.valido) { elN1.classList.add('campo-invalido'); temErro = true; }
    if (!resN2.valido) { elN2.classList.add('campo-invalido'); temErro = true; }
    if (!resN3.valido) { elN3.classList.add('campo-invalido'); temErro = true; }

    const resF1 = validarFaltaEditada(elF1.value);
    const resF2 = validarFaltaEditada(elF2.value);
    const resF3 = validarFaltaEditada(elF3.value);

    if (!resF1.valido) { elF1.classList.add('campo-invalido'); temErro = true; }
    if (!resF2.valido) { elF2.classList.add('campo-invalido'); temErro = true; }
    if (!resF3.valido) { elF3.classList.add('campo-invalido'); temErro = true; }

    novasDisciplinas.push({
      disciplina: listaDisciplinasAtual[i].disciplina,
      tri1: resN1.valor,
      tri2: resN2.valor,
      tri3: resN3.valor,
      faltas: [resF1.valor, resF2.valor, resF3.valor]
    });
  }

  if (temErro) {
    msgEdicao.className = 'mensagem-status erro';
    msgEdicao.innerText = 'Existem campos com valores inválidos. Verifique os destaques em vermelho.';
    return;
  }

  try {
    const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pinSessao,
        dados: {
          disciplinas: novasDisciplinas
        }
      })
    });

    if (!resposta.ok) {
      msgEdicao.className = 'mensagem-status erro';
      msgEdicao.innerText = 'Não foi possível salvar os dados. Tente novamente.';
      return;
    }

    listaDisciplinasAtual = novasDisciplinas;
    modoEdicao = false;
    document.getElementById('btn-alternar-edicao').innerText = 'Alterar dados';
    document.getElementById('btn-salvar').style.display = 'none';

    msgEdicao.className = 'mensagem-status sucesso';
    msgEdicao.innerText = 'Dados salvos com sucesso.';

    renderizarBoletim();
  } catch (erro) {
    msgEdicao.className = 'mensagem-status erro';
    msgEdicao.innerText = 'Não foi possível conectar ao servidor para salvar.';
  }
}