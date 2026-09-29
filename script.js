/* ==========================================
   CONFERÊNCIA DE PALETES — script.js
   ========================================== */

'use strict';

// ── Estado global ──────────────────────────
const state = {
  produtoSelecionado: null,

  // Mantém suporte às cargas antigas
  cargas: [],

  cargaAtivaId: null,

  autocompleteAberto: false,
  activeIndex: -1,
};


// ── Elementos DOM ──────────────────────────

const $busca         = document.getElementById('busca-input');
const $clearSearch   = document.getElementById('btn-clear-search');
const $acList        = document.getElementById('autocomplete-list');

const $prodBadge     = document.getElementById('produto-selecionado');
const $badgeCode     = document.getElementById('badge-code');
const $badgeName     = document.getElementById('badge-name');
const $badgePalete   = document.getElementById('badge-palete');

const $qtdInput      = document.getElementById('qtd-input');
const $btnCalc       = document.getElementById('btn-calcular');

const $cardResult    = document.getElementById('card-resultado');
const $resProdInfo   = document.getElementById('res-produto-info');
const $resPaletes    = document.getElementById('res-paletes');
const $resAvulsas    = document.getElementById('res-avulsas');

const $btnAdicionar  = document.getElementById('btn-adicionar');

const $btnLimpar     = document.getElementById('btn-limpar-carga');
const $listaCarga    = document.getElementById('lista-carga');
const $listaVazia    = document.getElementById('lista-vazia');

const $totalPaletes  = document.getElementById('total-paletes');
const $totalAvulsas  = document.getElementById('total-avulsas');
const $totalItens    = document.getElementById('total-itens');

const $toast         = document.getElementById('toast');
const $btnLimparHistorico = document.getElementById('btn-limpar-historico');

// ── Elementos das cargas ───────────────────

const $btnNovaCarga          = document.getElementById('btn-nova-carga');
const $novaCargaBox          = document.getElementById('nova-carga-box');
const $docaSelect            = document.getElementById('doca-select');
const $btnCriarCarga         = document.getElementById('btn-criar-carga');
const $btnCancelarNovaCarga  = document.getElementById('btn-cancelar-nova-carga');

const $listaCargasAtivas     = document.getElementById('lista-cargas-ativas');
const $historicoCargas       = document.getElementById('historico-cargas');
const $listaCargasFinalizadas = document.getElementById('lista-cargas-finalizadas');

const $cardCargaAtiva        = document.getElementById('card-carga-ativa');
const $cargaTitulo           = document.getElementById('carga-titulo');
const $cargaDoca             = document.getElementById('carga-doca');
const $cargaStatus           = document.getElementById('carga-status');
const $btnFinalizarCarga     = document.getElementById('btn-finalizar-carga');


// ── Normalização de texto ──────────────────

function normalizar(str) {
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}


// ── Busca de produtos ──────────────────────

function buscarProdutos(query) {

  if (!query || query.length < 1) return [];

  const q = normalizar(query);
  const resultados = [];

  for (const p of produtos) {

    const code = String(p.item);
    const desc = normalizar(p.descricao);

    if (
      code.startsWith(q) ||
      code.endsWith(q) ||
      desc.includes(q)
    ) {
      resultados.push(p);

      if (resultados.length >= 30) break;
    }
  }

  return resultados;
}


// ── Highlight ──────────────────────────────

function highlight(text, query) {

  if (!query) return text;

  const q = normalizar(query);
  const norm = normalizar(text);

  const idx = norm.indexOf(q);

  if (idx === -1) return text;

  const pre = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const post = text.slice(idx + q.length);

  return `${pre}<mark class="match-highlight">${match}</mark>${post}`;
}


// ── Autocomplete ───────────────────────────

function renderAutocomplete(resultados, query) {

  $acList.innerHTML = '';
  state.activeIndex = -1;

  if (!query) {
    fecharAutocomplete();
    return;
  }

  if (resultados.length === 0) {

    $acList.innerHTML = `
      <div class="autocomplete-no-results">
        Nenhum produto encontrado para "<strong>${query}</strong>"
      </div>
    `;

    $acList.classList.add('open');
    return;
  }

  const frag = document.createDocumentFragment();

  resultados.forEach((p, i) => {

    const item = document.createElement('div');

    item.className = 'autocomplete-item';

    item.setAttribute('role', 'option');
    item.setAttribute('data-index', i);

    const codeHL = highlight(String(p.item), query);
    const descHL = highlight(p.descricao, query);

    item.innerHTML = `
      <span class="ac-code">${codeHL}</span>

      <div>
        <div class="ac-desc">${descHL}</div>

        <div class="ac-sub">
          Lastro: ${p.lastro}
          &nbsp;|&nbsp;
          Palete: ${p.qtdPalete} cx
        </div>
      </div>
    `;

    item.addEventListener('mousedown', (e) => {

      e.preventDefault();

      selecionarProduto(p);

    });

    frag.appendChild(item);

  });

  $acList.appendChild(frag);

  $acList.classList.add('open');

  state.autocompleteAberto = true;
}


function fecharAutocomplete() {

  $acList.classList.remove('open');

  $acList.innerHTML = '';

  state.autocompleteAberto = false;

  state.activeIndex = -1;
}


// ── Selecionar produto ─────────────────────

function selecionarProduto(produto) {

  state.produtoSelecionado = produto;

  $busca.value = `${produto.item} — ${produto.descricao}`;

  $clearSearch.classList.add('visible');

  fecharAutocomplete();

  $badgeCode.textContent = `Item: ${produto.item}`;

  $badgeName.textContent = produto.descricao;

  $badgePalete.textContent =
    `Lastro: ${produto.lastro} | Palete completo: ${produto.qtdPalete} cx`;

  $prodBadge.classList.remove('hidden');

  $cardResult.classList.add('hidden');

  setTimeout(() => {

    $qtdInput.focus();
    $qtdInput.select();

  }, 120);

  showToast(
    `Produto selecionado: ${produto.descricao.slice(0, 40)}...`,
    'success'
  );
}


// ── Cálculo ────────────────────────────────

function calcular() {

  const produto = state.produtoSelecionado;

  if (!produto) {

    showToast(
      'Selecione um produto primeiro!',
      'warning'
    );

    $busca.focus();

    return;
  }

  const qtd = parseInt($qtdInput.value, 10);

  if (isNaN(qtd) || qtd <= 0) {

    showToast(
      'Informe a quantidade recebida!',
      'warning'
    );

    $qtdInput.focus();

    return;
  }

  const paletes =
    Math.floor(qtd / produto.qtdPalete);

  const avulsas =
    qtd % produto.qtdPalete;

  $resProdInfo.innerHTML = `
    <strong>${produto.item}</strong> — ${produto.descricao}<br>

    <span>
      Lastro: <b>${produto.lastro}</b>
      &nbsp;|&nbsp;
      Palete: <b>${produto.qtdPalete} cx</b>
      &nbsp;|&nbsp;
      Recebido: <b>${qtd} cx</b>
    </span>
  `;

  $resPaletes.textContent = paletes;
  $resAvulsas.textContent = avulsas;

  $cardResult.classList.remove('hidden');

  $cardResult.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest'
  });
}


// ── Carga ativa ────────────────────────────

function obterCargaAtiva() {

  if (!state.cargaAtivaId) {
    return null;
  }

  return state.cargas.find(
    carga => carga.id === state.cargaAtivaId
  ) || null;
}


// ── Criar nova carga ───────────────────────

function criarNovaCarga() {

  const doca = parseInt($docaSelect.value, 10);

  if (!doca) {

    showToast(
      'Selecione uma doca!',
      'warning'
    );

    return;
  }

  // Não permite duas cargas simultâneas na mesma doca
  const docaOcupada = state.cargas.some(
    carga =>
      carga.status === 'em andamento' &&
      Number(carga.doca) === doca
  );

  if (docaOcupada) {

    showToast(
      `A Doca ${String(doca).padStart(2, '0')} já possui uma carga em andamento.`,
      'warning'
    );

    return;
  }

  const novaCarga = {

    id: Date.now(),

    numero:
      obterProximoNumeroCarga(),

    doca,

    status: 'em andamento',

    criadaEm:
      new Date().toISOString(),

    finalizadaEm: null,

    produtos: []
  };

  state.cargas.push(novaCarga);

  state.cargaAtivaId = novaCarga.id;

  salvarCargas();

  $novaCargaBox.classList.add('hidden');

  $docaSelect.value = '';

  renderCargas();

  renderCargaAtiva();

  limparFormularioProduto();

  showToast(
    `Carga #${novaCarga.numero} criada na Doca ${String(doca).padStart(2, '0')}`,
    'success'
  );

  $busca.focus();

  $cardCargaAtiva.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}


// ── Número da carga ────────────────────────

function obterProximoNumeroCarga() {

  if (state.cargas.length === 0) {
    return 1;
  }

  return Math.max(
    ...state.cargas.map(carga => Number(carga.numero) || 0)
  ) + 1;
}


// ── Abrir carga ────────────────────────────

function abrirCarga(id) {

  const carga = state.cargas.find(
    item => item.id === id
  );

  if (!carga) return;

  if (carga.status === 'finalizada') {

    showToast(
      'Esta carga já foi finalizada.',
      'warning'
    );

    return;
  }

  state.cargaAtivaId = id;

  salvarCargas();

  renderCargas();

  renderCargaAtiva();

  limparFormularioProduto();

  $busca.focus();

  $cardCargaAtiva.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
}


// ── Adicionar produto à carga ──────────────

function adicionarACarga() {

  const carga = obterCargaAtiva();

  if (!carga) {

    showToast(
      'Crie ou selecione uma carga primeiro!',
      'warning'
    );

    return;
  }

  if (carga.status !== 'em andamento') {

    showToast(
      'Esta carga já foi finalizada.',
      'warning'
    );

    return;
  }

  const produto = state.produtoSelecionado;

  if (!produto) return;

  const qtd = parseInt(
    $qtdInput.value,
    10
  );

  if (isNaN(qtd) || qtd <= 0) return;

  const paletes =
    Math.floor(qtd / produto.qtdPalete);

  const avulsas =
    qtd % produto.qtdPalete;

  const entrada = {

    id: Date.now(),

    produto,

    qtd,

    paletes,

    avulsas
  };

  carga.produtos.push(entrada);

  salvarCargas();

  renderCargas();

  renderCargaAtiva();

  limparFormularioProduto();

  showToast(
    `Adicionado! ${paletes} pal. + ${avulsas} avulsas`,
    'success'
  );

  $busca.focus();
}


// ── Remover item da carga ──────────────────

function removerDaCarga(id) {

  const carga = obterCargaAtiva();

  if (!carga) return;

  carga.produtos =
    carga.produtos.filter(
      entrada => entrada.id !== id
    );

  salvarCargas();

  renderCargas();

  renderCargaAtiva();

  showToast(
    'Item removido da carga',
    ''
  );
}


// ── Limpar carga atual ─────────────────────

function limparCarga() {

  const carga = obterCargaAtiva();

  if (!carga) return;

  if (carga.produtos.length === 0) return;

  if (!confirm(
    `Deseja realmente limpar toda a carga #${carga.numero}?`
  )) {
    return;
  }

  carga.produtos = [];

  salvarCargas();

  renderCargas();

  renderCargaAtiva();

  showToast(
    'Carga limpa!',
    ''
  );
}


// ── Finalizar carga ────────────────────────

function finalizarCarga() {

  const carga = obterCargaAtiva();

  if (!carga) return;

  if (carga.produtos.length === 0) {

    showToast(
      'Adicione pelo menos um produto antes de finalizar.',
      'warning'
    );

    return;
  }

  if (!confirm(
    `Finalizar a Carga #${carga.numero} da Doca ${String(carga.doca).padStart(2, '0')}?`
  )) {
    return;
  }

  carga.status = 'finalizada';

  carga.finalizadaEm =
    new Date().toISOString();

  state.cargaAtivaId = null;

  salvarCargas();

  renderCargas();

  renderCargaAtiva();

  limparFormularioProduto();

  showToast(
    `Carga #${carga.numero} finalizada!`,
    'success'
  );
}


// ── Excluir carga vazia ────────────────────

function excluirCarga(id) {

  const carga = state.cargas.find(
    item => item.id === id
  );

  if (!carga) return;

  if (carga.produtos.length > 0) {

    showToast(
      'Para excluir uma carga com produtos, use Limpar primeiro.',
      'warning'
    );

    return;
  }

  if (!confirm(
    `Excluir a Carga #${carga.numero}?`
  )) {
    return;
  }

  state.cargas =
    state.cargas.filter(
      item => item.id !== id
    );

  if (state.cargaAtivaId === id) {
    state.cargaAtivaId = null;
  }

  salvarCargas();

  renderCargas();

  renderCargaAtiva();
}


// ── Totais da carga ────────────────────────

function calcularTotaisCarga(carga) {

  return carga.produtos.reduce(
    (totais, entrada) => {

      totais.paletes += entrada.paletes;
      totais.avulsas += entrada.avulsas;

      return totais;

    },
    {
      paletes: 0,
      avulsas: 0
    }
  );
}


// ── Renderizar carga ativa ─────────────────

function renderCargaAtiva() {

  const carga = obterCargaAtiva();

  if (!carga) {

    $cardCargaAtiva.classList.add('hidden');

    return;
  }

  $cardCargaAtiva.classList.remove('hidden');

  $cargaTitulo.textContent =
    `Carga #${carga.numero}`;

  $cargaDoca.textContent =
    `Doca ${String(carga.doca).padStart(2, '0')}`;

  $cargaStatus.textContent =
    carga.status === 'finalizada'
      ? 'Finalizada'
      : 'Em carregamento';

  const totais =
    calcularTotaisCarga(carga);

  $totalPaletes.textContent =
    totais.paletes;

  $totalAvulsas.textContent =
    totais.avulsas;

  $totalItens.textContent =
    carga.produtos.length;

  Array.from(
    $listaCarga.querySelectorAll('.carga-item')
  ).forEach(el => el.remove());

  if (carga.produtos.length === 0) {

    $listaVazia.style.display = '';

    return;
  }

  $listaVazia.style.display = 'none';

  carga.produtos.forEach(
    (entrada, idx) => {

      const div =
        document.createElement('div');

      div.className = 'carga-item';

      div.dataset.id = entrada.id;

      div.innerHTML = `
        <div class="carga-item-num">
          ${idx + 1}
        </div>

        <div class="carga-item-info">

          <div class="carga-item-code">
            Item ${entrada.produto.item}
          </div>

          <div class="carga-item-name">
            ${entrada.produto.descricao}
          </div>

          <div class="carga-item-detalhe">
            ${entrada.qtd} cx · Lastro ${entrada.produto.lastro}
          </div>

        </div>

        <div class="carga-item-nums">

          <div class="carga-item-pal">
            🏗️ ${entrada.paletes} pal.
          </div>

          <div class="carga-item-avul">
            📦 ${entrada.avulsas} avul.
          </div>

        </div>

        <button
          class="carga-item-remove"
          title="Remover"
          data-id="${entrada.id}"
        >
          ✕
        </button>
      `;

      div
        .querySelector('.carga-item-remove')
        .addEventListener(
          'click',
          () => removerDaCarga(entrada.id)
        );

      $listaCarga.appendChild(div);

    }
  );
}


// ── Renderizar lista de cargas ─────────────

function renderCargas() {

  $listaCargasAtivas.innerHTML = '';

  $listaCargasFinalizadas.innerHTML = '';

  const ativas =
    state.cargas.filter(
      carga => carga.status === 'em andamento'
    );

  const finalizadas =
    state.cargas.filter(
      carga => carga.status === 'finalizada'
    ).reverse();

  // Cargas ativas

  if (ativas.length === 0) {

    $listaCargasAtivas.innerHTML = `
      <div class="lista-vazia">
        <p>Nenhuma carga em andamento.</p>
        <p>Crie uma nova carga e selecione a doca.</p>
      </div>
    `;

  } else {

    ativas.forEach(
      carga => {

        $listaCargasAtivas.appendChild(
          criarCardCarga(carga, false)
        );

      }
    );

  }


  // Histórico

  if (finalizadas.length === 0) {

    $historicoCargas.classList.add('hidden');

  } else {

    $historicoCargas.classList.remove('hidden');

    finalizadas.forEach(
      carga => {

        $listaCargasFinalizadas.appendChild(
          criarCardCarga(carga, true)
        );

      }
    );

  }
}


// ── Card individual de carga ───────────────

function criarCardCarga(carga, finalizada) {

  const div =
    document.createElement('div');

  div.className =
    `carga-card ${finalizada ? 'finalizada' : 'ativa'}`;

  const totais =
    calcularTotaisCarga(carga);

  const statusTexto =
    finalizada
      ? 'Finalizada'
      : 'Em carregamento';

  div.innerHTML = `

    <div class="carga-card-top">

      <div class="carga-card-info">

        <div class="carga-card-titulo">
          Carga #${carga.numero}
        </div>

        <span class="carga-card-doca">
          Doca ${String(carga.doca).padStart(2, '0')}
        </span>

      </div>

      <span class="carga-card-status ${finalizada ? 'finalizada' : ''}">
        ${statusTexto}
      </span>

    </div>

    <div class="carga-card-resumo">

      <span>
        <strong>${totais.paletes}</strong> pal.
      </span>

      <span>
        <strong>${totais.avulsas}</strong> avul.
      </span>

      <span>
        <strong>${carga.produtos.length}</strong> produtos
      </span>

    </div>

    <div class="carga-card-acoes">

      <button
        class="btn btn-card btn-outline btn-abrir-carga"
      >
        ${finalizada ? 'Ver carga' : 'Abrir carga'}
      </button>

      ${
        !finalizada
          ? `
            <button
              class="btn btn-card btn-finalizar-card btn-finalizar-card-action"
            >
              ✓ Finalizar
            </button>
          `
          : ''
      }

    </div>
  `;

  div
    .querySelector('.btn-abrir-carga')
    .addEventListener(
      'click',
      () => {

        if (finalizada) {

          visualizarCargaFinalizada(carga.id);

        } else {

          abrirCarga(carga.id);

        }

      }
    );

  const btnFinalizar =
    div.querySelector(
      '.btn-finalizar-card-action'
    );

  if (btnFinalizar) {

    btnFinalizar.addEventListener(
      'click',
      () => {

        if (!confirm(
          `Finalizar a Carga #${carga.numero} da Doca ${String(carga.doca).padStart(2, '0')}?`
        )) {
          return;
        }

        carga.status = 'finalizada';

        carga.finalizadaEm =
          new Date().toISOString();

        if (state.cargaAtivaId === carga.id) {
          state.cargaAtivaId = null;
        }

        salvarCargas();

        renderCargas();

        renderCargaAtiva();

        limparFormularioProduto();

        showToast(
          `Carga #${carga.numero} finalizada!`,
          'success'
        );

      }
    );

  }

  return div;
}


// ── Visualizar carga finalizada ────────────

function visualizarCargaFinalizada(id) {

  const carga =
    state.cargas.find(
      item => item.id === id
    );

  if (!carga) return;

  state.cargaAtivaId = id;

  renderCargaAtiva();

  $cardCargaAtiva.scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });

  showToast(
    `Visualizando Carga #${carga.numero}`,
    ''
  );
}


// ── Persistência ───────────────────────────

function salvarCargas() {

  try {

    localStorage.setItem(
      'palete_cargas',
      JSON.stringify(state.cargas)
    );

    localStorage.setItem(
      'palete_carga_ativa',
      String(state.cargaAtivaId || '')
    );

  } catch (e) {
    // Ignorar erro de localStorage
  }
}


function carregarCargas() {

  try {

    const raw =
      localStorage.getItem('palete_cargas');

    if (raw) {

      const cargas =
        JSON.parse(raw);

      if (Array.isArray(cargas)) {

        state.cargas = cargas;

      }

    }

    // Recupera carga ativa
    const cargaAtiva =
      localStorage.getItem('palete_carga_ativa');

    if (cargaAtiva) {

      state.cargaAtivaId =
        Number(cargaAtiva);

    }


    /*
      Compatibilidade com a versão antiga.

      Se o usuário já tinha uma carga salva
      no formato antigo, ela vira uma nova
      carga na Doca 1 para não perder os dados.
    */

    if (
      state.cargas.length === 0
    ) {

      const antiga =
        localStorage.getItem('palete_carga');

      if (antiga) {

        const produtosAntigos =
          JSON.parse(antiga);

        if (
          Array.isArray(produtosAntigos) &&
          produtosAntigos.length > 0
        ) {

          const cargaMigrada = {

            id: Date.now(),

            numero: 1,

            doca: 1,

            status: 'em andamento',

            criadaEm:
              new Date().toISOString(),

            finalizadaEm: null,

            produtos: produtosAntigos

          };

          state.cargas = [
            cargaMigrada
          ];

          state.cargaAtivaId =
            cargaMigrada.id;

          salvarCargas();

        }

      }

    }

  } catch (e) {

    state.cargas = [];

    state.cargaAtivaId = null;

  }
}


// ── Limpar formulário ──────────────────────

function limparFormularioProduto() {

  $busca.value = '';

  $qtdInput.value = '';

  $prodBadge.classList.add('hidden');

  $cardResult.classList.add('hidden');

  $clearSearch.classList.remove('visible');

  state.produtoSelecionado = null;

  fecharAutocomplete();
}


// ── Toast ──────────────────────────────────

let toastTimer = null;

function showToast(msg, type = '') {

  $toast.textContent = msg;

  $toast.className =
    'toast' +
    (type ? ` ${type}` : '');

  void $toast.offsetWidth;

  $toast.classList.add('show');

  if (toastTimer) {
    clearTimeout(toastTimer);
  }

  toastTimer =
    setTimeout(() => {

      $toast.classList.remove('show');

    }, 2600);
}


// ── Navegação autocomplete ─────────────────

function moverAutocomplete(dir) {

  const items =
    $acList.querySelectorAll(
      '.autocomplete-item'
    );

  if (!items.length) return;

  state.activeIndex += dir;

  if (state.activeIndex < 0) {
    state.activeIndex =
      items.length - 1;
  }

  if (state.activeIndex >= items.length) {
    state.activeIndex = 0;
  }

  items.forEach(
    (el, i) => {

      el.classList.toggle(
        'active',
        i === state.activeIndex
      );

      if (i === state.activeIndex) {

        el.scrollIntoView({
          block: 'nearest'
        });

      }

    }
  );
}


// ── EVENTOS ────────────────────────────────


// Nova carga

$btnNovaCarga.addEventListener(
  'click',
  () => {

    $novaCargaBox.classList.toggle(
      'hidden'
    );

    if (!$novaCargaBox.classList.contains('hidden')) {

      $docaSelect.focus();

    }

  }
);


// Cancelar nova carga

$btnCancelarNovaCarga.addEventListener(
  'click',
  () => {

    $novaCargaBox.classList.add('hidden');

    $docaSelect.value = '';

  }
);


// Criar carga

$btnCriarCarga.addEventListener(
  'click',
  criarNovaCarga
);


// Busca

$busca.addEventListener(
  'input',
  () => {

    const q =
      $busca.value.trim();

    $clearSearch.classList.toggle(
      'visible',
      q.length > 0
    );

    if (!q) {

      fecharAutocomplete();

      $prodBadge.classList.add('hidden');

      state.produtoSelecionado = null;

      return;
    }

    const res =
      buscarProdutos(q);

    renderAutocomplete(res, q);

  }
);


// Teclado busca

$busca.addEventListener(
  'keydown',
  (e) => {

    if (!state.autocompleteAberto) return;

    if (e.key === 'ArrowDown') {

      e.preventDefault();

      moverAutocomplete(1);

    }

    else if (e.key === 'ArrowUp') {

      e.preventDefault();

      moverAutocomplete(-1);

    }

    else if (e.key === 'Enter') {

      e.preventDefault();

      const items =
        $acList.querySelectorAll(
          '.autocomplete-item'
        );

      if (
        state.activeIndex >= 0 &&
        items[state.activeIndex]
      ) {

        items[
          state.activeIndex
        ].dispatchEvent(
          new MouseEvent('mousedown')
        );

      }

      else if (items.length === 1) {

        items[0].dispatchEvent(
          new MouseEvent('mousedown')
        );

      }

    }

    else if (e.key === 'Escape') {

      fecharAutocomplete();

    }

  }
);


// Blur busca

$busca.addEventListener(
  'blur',
  () => {

    setTimeout(
      () => fecharAutocomplete(),
      150
    );

  }
);


// Focus busca

$busca.addEventListener(
  'focus',
  () => {

    const q =
      $busca.value.trim();

    if (
      q &&
      !state.produtoSelecionado
    ) {

      const res =
        buscarProdutos(q);

      renderAutocomplete(res, q);

    }

  }
);


// Limpar busca

$clearSearch.addEventListener(
  'click',
  () => {

    limparFormularioProduto();

    $busca.focus();

  }
);


// Quantidade Enter

$qtdInput.addEventListener(
  'keydown',
  (e) => {

    if (e.key === 'Enter') {

      e.preventDefault();

      calcular();

    }

  }
);


// Auto cálculo

$qtdInput.addEventListener(
  'input',
  () => {

    const v =
      $qtdInput.value;

    if (
      v &&
      parseInt(v) > 0 &&
      state.produtoSelecionado
    ) {

      calcular();

    }

  }
);


// Calcular

$btnCalc.addEventListener(
  'click',
  calcular
);


// Adicionar

$btnAdicionar.addEventListener(
  'click',
  adicionarACarga
);


// Limpar carga

$btnLimpar.addEventListener(
  'click',
  limparCarga
);


// Finalizar carga

$btnFinalizarCarga.addEventListener(
  'click',
  finalizarCarga
);

function limparHistorico() {

  const cargasFinalizadas = state.cargas.filter(
    carga => carga.status === 'finalizada'
  );

  if (cargasFinalizadas.length === 0) {
    showToast('⚠️ O histórico já está vazio.', 'warning');
    return;
  }

  if (!confirm('Deseja realmente apagar todo o histórico de cargas?')) {
    return;
  }

  // Mantém somente as cargas que ainda estão em andamento
  state.cargas = state.cargas.filter(
    carga => carga.status !== 'finalizada'
  );

  // Se a carga ativa foi afetada, limpa a seleção
  if (
    state.cargaAtivaId &&
    !state.cargas.some(
      carga => carga.id === state.cargaAtivaId
    )
  ) {
    state.cargaAtivaId = null;
  }

  salvarCargas();

  renderCargas();
  renderCargaAtiva();

  showToast('🗑️ Histórico apagado!', 'success');
}

// ── Inicialização ──────────────────────────
function init() {

  carregarCargas();

  renderCargas();

  /*
    Se existir uma carga ativa salva,
    abre automaticamente essa carga.
  */

  const cargaAtiva =
    obterCargaAtiva();

  if (
    cargaAtiva &&
    cargaAtiva.status === 'em andamento'
  ) {

    renderCargaAtiva();

  } else {

    state.cargaAtivaId = null;

    renderCargaAtiva();

  }


  // Registrar Service Worker

  if ('serviceWorker' in navigator) {

    window.addEventListener(
      'load',
      () => {

        navigator.serviceWorker
          .register('./sw.js')

          .then(
            reg =>
              console.log(
                'SW registrado:',
                reg.scope
              )
          )

          .catch(
            err =>
              console.warn(
                'SW erro:',
                err
              )
          );

      }
    );

  }

}

$btnLimparHistorico.addEventListener('click', limparHistorico);
init();