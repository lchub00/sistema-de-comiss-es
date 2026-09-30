// Lista inicial de funcionários pré-cadastrados
const FUNCIONARIOS_PADRAO = ['Lucas', 'Rodrigo', 'Kleber', 'Jota', 'Maicon'];

let AppData = {
  servicos: [],
  folgas: [],
  logo: ''
};

// Carregar Dados ao Abrir
function carregarDadosLocal() {
  const local = localStorage.getItem('gestaoComissoesGlobal');
  if (local) {
    AppData = JSON.parse(local);
  }
}

function salvarLocal() {
  localStorage.setItem('gestaoComissoesGlobal', JSON.stringify(AppData));
}

// Cálculo exato da comissão sem perdas de centavos (arredondamento financeiro)
function calcularComissaoExata(valorServico) {
  return Math.round(valorServico * 0.05 * 100) / 100;
}

// Sincronização Automática Entre Abas Abertas
window.addEventListener('storage', function(e) {
  if (e.key === 'gestaoComissoesGlobal') {
    carregarDadosLocal();
    exibirLogo();
    
    if (typeof atualizarMenuFuncionarios === 'function') {
      atualizarMenuFuncionarios();
      exibirComissoesFuncionario();
    }
    if (typeof renderizarFolgas === 'function') {
      renderizarFolgas();
    }
  }
});

// Manipulação da Logo (Carrega img/chaveirologo.png por padrão)
function carregarLogo(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      AppData.logo = e.target.result;
      exibirLogo();
      salvarLocal();
    };
    reader.readAsDataURL(file);
  }
}

function exibirLogo() {
  const logoImg = document.getElementById('logoImg');
  const logoText = document.getElementById('logoText');
  
  if (logoImg) {
    // Se houver uma logo guardada no localStorage utiliza essa, caso contrário carrega de img/chaveirologo.png
    logoImg.src = AppData.logo ? AppData.logo : 'img/chaveirologo.png';
    logoImg.style.display = 'block';
    
    if (logoText) {
      logoText.style.display = 'none';
    }
  }
}

// Pré-visualização do Cálculo da Comissão (5%)
function calcularPreviewComissao() {
  let valorInput = document.getElementById('valor').value.replace(',', '.');
  const valor = parseFloat(valorInput) || 0;
  const comissao = calcularComissaoExata(valor);
  document.getElementById('previewComissao').innerText = formatarMoeda(comissao);
}

// Adicionar Serviço (Obrigando todos os campos)
function adicionarServico() {
  carregarDadosLocal();

  const data = document.getElementById('dataServico').value;
  const funcionario = document.getElementById('funcionario').value.trim();
  const descricao = document.getElementById('descricao').value.trim();
  let valorInput = document.getElementById('valor').value.replace(',', '.');
  const valor = parseFloat(valorInput);

  if (!data || !funcionario || !descricao || isNaN(valor) || valor <= 0) {
    alert('TODAS as informações são obrigatórias! Preencha a data, o funcionário, a descrição e um valor válido.');
    return;
  }

  const comissao = calcularComissaoExata(valor);

  AppData.servicos.push({
    id: Date.now(),
    data: data,
    funcionario: funcionario,
    descricao: descricao,
    valor: valor,
    comissao: comissao
  });

  salvarLocal();

  const alerta = document.getElementById('mensagemAlerta');
  if (alerta) {
    alerta.innerText = `Comissão de ${funcionario} salva com sucesso!`;
    alerta.style.display = 'block';

    setTimeout(() => {
      alerta.style.display = 'none';
    }, 4000);
  }

  document.getElementById('descricao').value = '';
  document.getElementById('valor').value = '';
  document.getElementById('previewComissao').innerText = 'R$ 0,00';
}

// Atualizar Seletor de Funcionários na Aba de Funcionários
function atualizarMenuFuncionarios() {
  const seletor = document.getElementById('seletorFuncionario');
  if (!seletor) return;

  const valorSelecionado = seletor.value;
  seletor.innerHTML = '<option value="">-- Selecione um Funcionário --</option>';

  const funcionariosDosServicos = AppData.servicos.map(s => s.funcionario);
  const todosFuncionarios = [...new Set([...FUNCIONARIOS_PADRAO, ...funcionariosDosServicos])];

  todosFuncionarios.forEach(nome => {
    const option = document.createElement('option');
    option.value = nome;
    option.innerText = nome;
    seletor.appendChild(option);
  });

  seletor.value = valorSelecionado;
}

// Exibir Comissões Filtradas do Funcionário Selecionado (Insensível a Maiúsculas/Minúsculas)
function exibirComissoesFuncionario() {
  const nomeFuncionario = document.getElementById('seletorFuncionario').value.trim();
  const cardResultado = document.getElementById('cardResultado');
  const tbody = document.getElementById('tabelaServicosFuncionario');

  if (!nomeFuncionario) {
    if (cardResultado) cardResultado.style.display = 'none';
    return;
  }

  if (cardResultado) cardResultado.style.display = 'block';
  document.getElementById('tituloFuncionario').innerText = `Comissões de ${nomeFuncionario}`;
  tbody.innerHTML = '';

  const servicosFiltrados = AppData.servicos.filter(s => 
    s.funcionario.trim().toLowerCase() === nomeFuncionario.toLowerCase()
  );

  let totalComissao = 0;

  if (servicosFiltrados.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748b;">Nenhuma comissão registrada para este funcionário.</td></tr>';
  } else {
    servicosFiltrados.forEach(s => {
      totalComissao += s.comissao;
      const dateFormatted = new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR');
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${dateFormatted}</td>
        <td>${s.descricao}</td>
        <td>${formatarMoeda(s.valor)}</td>
        <td><strong>${formatarMoeda(s.comissao)}</strong></td>
        <td><button class="btn-delete" onclick="removerServico(${s.id})">Excluir</button></td>
      `;
      tbody.appendChild(tr);
    });
  }

  document.getElementById('totalComissaoFuncionario').innerText = formatarMoeda(totalComissao);
}

function removerServico(id) {
  AppData.servicos = AppData.servicos.filter(s => s.id !== id);
  salvarLocal();
  atualizarMenuFuncionarios();
  exibirComissoesFuncionario();
}

// Manipulação de Folgas
function adicionarFolga() {
  carregarDadosLocal();

  const data = document.getElementById('folgaData').value;
  const pessoa = document.getElementById('folgaPessoa').value.trim();

  if (!data || !pessoa) {
    alert('Todos os campos da folga são obrigatórios.');
    return;
  }

  AppData.folgas.push({ id: Date.now(), data, pessoa });
  salvarLocal();

  document.getElementById('folgaData').value = '';
  document.getElementById('folgaPessoa').value = '';

  renderizarFolgas();
}

function removerFolga(id) {
  AppData.folgas = AppData.folgas.filter(f => f.id !== id);
  salvarLocal();
  renderizarFolgas();
}

function renderizarFolgas() {
  const lista = document.getElementById('folgasLista');
  if (!lista) return;

  lista.innerHTML = '';

  if (AppData.folgas.length === 0) {
    lista.innerHTML = '<span style="color: #64748b;">Nenhuma folga agendada.</span>';
    return;
  }

  AppData.folgas.forEach(f => {
    const dateFormatted = new Date(f.data + 'T00:00:00').toLocaleDateString('pt-BR');
    const badge = document.createElement('div');
    badge.className = 'folga-badge';
    badge.innerHTML = `
      <strong>${dateFormatted}</strong>: ${f.pessoa}
      <button onclick="removerFolga(${f.id})">&times;</button>
    `;
    lista.appendChild(badge);
  });
}

// Utilitários de formatação
function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Salvar e Baixar Relatório do Funcionário em TXT
function salvarEEmitirRelatorio() {
  const nome = document.getElementById('seletorFuncionario').value.trim();
  if (!nome) return;

  const servicosFiltrados = AppData.servicos.filter(s => 
    s.funcionario.trim().toLowerCase() === nome.toLowerCase()
  );

  let totalComissao = 0;

  let conteudo = `=======================================\n`;
  conteudo += `   RELATÓRIO DE COMISSÃO (5%)\n`;
  conteudo += `=======================================\n`;
  conteudo += `Funcionário: ${nome}\n`;
  conteudo += `Data da emissão: ${new Date().toLocaleDateString('pt-BR')}\n\n`;
  conteudo += `SERVIÇOS PRESTADOS:\n`;
  conteudo += `---------------------------------------\n`;

  servicosFiltrados.forEach((s, idx) => {
    totalComissao += s.comissao;
    const dateFormatted = new Date(s.data + 'T00:00:00').toLocaleDateString('pt-BR');
    conteudo += `${idx + 1}. [Data: ${dateFormatted}] ${s.descricao}\n`;
    conteudo += `   Valor: ${formatarMoeda(s.valor)} | Comissão: ${formatarMoeda(s.comissao)}\n\n`;
  });

  conteudo += `---------------------------------------\n`;
  conteudo += `TOTAL ACUMULADO: ${formatarMoeda(totalComissao)}\n`;
  conteudo += `=======================================\n`;

  const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Comissao_${nome.replace(/\s+/g, '_')}.txt`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Inicializar os dados e exibir a logo ao carregar a página
carregarDadosLocal();
exibirLogo();