/* ==========================================
   CONFERÊNCIA DE PALETES — script.js
   ========================================== */

'use strict';

// ── Estado global ──────────────────────────
const state = {
  produtoSelecionado: null,
  carga: [],
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

// ── Normalização de texto para busca ───────
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
    // Match por código (começa com) ou descrição (contém)
    if (code.startsWith(q) || desc.includes(q)) {
      resultados.push(p);
      if (resultados.length >= 30) break;
    }
  }
  return resultados;
}

// ── Highlight de termos buscados ───────────
function highlight(text, query) {
  if (!query) return text;
  const q = normalizar(query);
  const norm = normalizar(text);
  const idx = norm.indexOf(q);
  if (idx === -1) return text;
  const pre  = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const post = text.slice(idx + q.length);
  return `${pre}<mark class="match-highlight">${match}</mark>${post}`;
}

// ── Renderiza autocomplete ─────────────────
function renderAutocomplete(resultados, query) {
  $acList.innerHTML = '';
  state.activeIndex = -1;

  if (!query) {
    fecharAutocomplete();
    return;
  }

  if (resultados.length === 0) {
    $acList.innerHTML = `<div class="autocomplete-no-results">Nenhum produto encontrado para "<strong>${query}</strong>"</div>`;
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
        <div class="ac-sub">Lastro: ${p.lastro} &nbsp;|&nbsp; Palete: ${p.qtdPalete} cx</div>
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

  // Badge do produto
  $badgeCode.textContent = `Item: ${produto.item}`;
  $badgeName.textContent = produto.descricao;
  $badgePalete.textContent = `Lastro: ${produto.lastro} | Palete completo: ${produto.qtdPalete} cx`;
  $prodBadge.classList.remove('hidden');

  // Limpar resultado anterior
  $cardResult.classList.add('hidden');

  // Focar no campo de quantidade
  setTimeout(() => {
    $qtdInput.focus();
    $qtdInput.select();
  }, 120);

  showToast(`✅ ${produto.descricao.slice(0, 40)}...`, 'success');
}

// ── Calcular paletes ───────────────────────
function calcular() {
  const produto = state.produtoSelecionado;
  if (!produto) {
    showToast('⚠️ Selecione um produto primeiro!', 'warning');
    $busca.focus();
    return;
  }

  const qtd = parseInt($qtdInput.value, 10);
  if (isNaN(qtd) || qtd <= 0) {
    showToast('⚠️ Informe a quantidade recebida!', 'warning');
    $qtdInput.focus();
    return;
  }

  const paletes = Math.floor(qtd / produto.qtdPalete);
  const avulsas = qtd % produto.qtdPalete;

  $resProdInfo.innerHTML = `
    <strong>${produto.item}</strong> — ${produto.descricao}<br>
    <span>Lastro: <b>${produto.lastro}</b> &nbsp;|&nbsp; Palete: <b>${produto.qtdPalete} cx</b> &nbsp;|&nbsp; Recebido: <b>${qtd} cx</b></span>
  `;
  $resPaletes.textContent = paletes;
  $resAvulsas.textContent = avulsas;

  $cardResult.classList.remove('hidden');
  $cardResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── Adicionar à carga ──────────────────────
function adicionarACarga() {
  const produto = state.produtoSelecionado;
  if (!produto) return;

  const qtd = parseInt($qtdInput.value, 10);
  if (isNaN(qtd) || qtd <= 0) return;

  const paletes = Math.floor(qtd / produto.qtdPalete);
  const avulsas = qtd % produto.qtdPalete;

  const entrada = {
    id: Date.now(),
    produto,
    qtd,
    paletes,
    avulsas,
  };

  state.carga.push(entrada);
  salvarCarga();
  renderCarga();

  // Reset form
  $busca.value = '';
  $qtdInput.value = '';
  $prodBadge.classList.add('hidden');
  $cardResult.classList.add('hidden');
  $clearSearch.classList.remove('visible');
  state.produtoSelecionado = null;

  showToast(`✅ Adicionado! ${paletes} pal. + ${avulsas} avulsas`, 'success');
  $busca.focus();
}

// ── Remover item da carga ──────────────────
function removerDaCarga(id) {
  state.carga = state.carga.filter(e => e.id !== id);
  salvarCarga();
  renderCarga();
  showToast('🗑️ Item removido da carga', '');
}

// ── Limpar carga ───────────────────────────
function limparCarga() {
  if (state.carga.length === 0) return;
  if (!confirm('Deseja realmente limpar toda a carga?')) return;
  state.carga = [];
  salvarCarga();
  renderCarga();
  showToast('🗑️ Carga limpa!', '');
}

// ── Renderizar lista de carga ──────────────
function renderCarga() {
  const totalPal  = state.carga.reduce((s, e) => s + e.paletes, 0);
  const totalAvul = state.carga.reduce((s, e) => s + e.avulsas, 0);

  $totalPaletes.textContent = totalPal;
  $totalAvulsas.textContent = totalAvul;
  $totalItens.textContent   = state.carga.length;

  // Rebuild item list
  const container = $listaCarga;
  // Remove existing items (keep lista-vazia)
  Array.from(container.querySelectorAll('.carga-item')).forEach(el => el.remove());

  if (state.carga.length === 0) {
    $listaVazia.style.display = '';
    return;
  }

  $listaVazia.style.display = 'none';

  state.carga.forEach((entrada, idx) => {
    const div = document.createElement('div');
    div.className = 'carga-item';
    div.dataset.id = entrada.id;

    div.innerHTML = `
      <div class="carga-item-num">${idx + 1}</div>
      <div class="carga-item-info">
        <div class="carga-item-code">Item ${entrada.produto.item}</div>
        <div class="carga-item-name">${entrada.produto.descricao}</div>
        <div class="carga-item-detalhe">${entrada.qtd} cx · Lastro ${entrada.produto.lastro}</div>
      </div>
      <div class="carga-item-nums">
        <div class="carga-item-pal">🏗️ ${entrada.paletes} pal.</div>
        <div class="carga-item-avul">📦 ${entrada.avulsas} avul.</div>
      </div>
      <button class="carga-item-remove" title="Remover" data-id="${entrada.id}">✕</button>
    `;

    div.querySelector('.carga-item-remove').addEventListener('click', () => {
      removerDaCarga(entrada.id);
    });

    container.appendChild(div);
  });
}

// ── Persistência (localStorage) ────────────
function salvarCarga() {
  try {
    localStorage.setItem('palete_carga', JSON.stringify(state.carga));
  } catch (e) { /* ignorar */ }
}

function carregarCarga() {
  try {
    const raw = localStorage.getItem('palete_carga');
    if (raw) {
      state.carga = JSON.parse(raw);
    }
  } catch (e) {
    state.carga = [];
  }
}

// ── Toast notification ─────────────────────
let toastTimer = null;
function showToast(msg, type = '') {
  $toast.textContent = msg;
  $toast.className   = 'toast' + (type ? ` ${type}` : '');
  void $toast.offsetWidth; // reflow
  $toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    $toast.classList.remove('show');
  }, 2600);
}

// ── Navegação teclado no autocomplete ──────
function moverAutocomplete(dir) {
  const items = $acList.querySelectorAll('.autocomplete-item');
  if (!items.length) return;

  state.activeIndex += dir;
  if (state.activeIndex < 0) state.activeIndex = items.length - 1;
  if (state.activeIndex >= items.length) state.activeIndex = 0;

  items.forEach((el, i) => {
    el.classList.toggle('active', i === state.activeIndex);
    if (i === state.activeIndex) el.scrollIntoView({ block: 'nearest' });
  });
}

// ── Event Listeners ────────────────────────

// Busca: input
$busca.addEventListener('input', () => {
  const q = $busca.value.trim();
  $clearSearch.classList.toggle('visible', q.length > 0);
  if (!q) {
    fecharAutocomplete();
    $prodBadge.classList.add('hidden');
    state.produtoSelecionado = null;
    return;
  }
  const res = buscarProdutos(q);
  renderAutocomplete(res, q);
});

// Busca: teclado
$busca.addEventListener('keydown', (e) => {
  if (!state.autocompleteAberto) return;

  if (e.key === 'ArrowDown') { e.preventDefault(); moverAutocomplete(1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); moverAutocomplete(-1); }
  else if (e.key === 'Enter') {
    e.preventDefault();
    const items = $acList.querySelectorAll('.autocomplete-item');
    if (state.activeIndex >= 0 && items[state.activeIndex]) {
      items[state.activeIndex].dispatchEvent(new MouseEvent('mousedown'));
    } else if (items.length === 1) {
      items[0].dispatchEvent(new MouseEvent('mousedown'));
    }
  }
  else if (e.key === 'Escape') { fecharAutocomplete(); }
});

// Busca: blur
$busca.addEventListener('blur', () => {
  setTimeout(() => fecharAutocomplete(), 150);
});

// Busca: focus
$busca.addEventListener('focus', () => {
  const q = $busca.value.trim();
  if (q && !state.produtoSelecionado) {
    const res = buscarProdutos(q);
    renderAutocomplete(res, q);
  }
});

// Limpar busca
$clearSearch.addEventListener('click', () => {
  $busca.value = '';
  $clearSearch.classList.remove('visible');
  $prodBadge.classList.add('hidden');
  $cardResult.classList.add('hidden');
  state.produtoSelecionado = null;
  fecharAutocomplete();
  $busca.focus();
});

// Quantidade: Enter → calcular
$qtdInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); calcular(); }
});

// Calcular ao digitar quantidade (auto-calc)
$qtdInput.addEventListener('input', () => {
  const v = $qtdInput.value;
  if (v && parseInt(v) > 0 && state.produtoSelecionado) {
    calcular();
  }
});

// Botão calcular
$btnCalc.addEventListener('click', calcular);

// Adicionar à carga
$btnAdicionar.addEventListener('click', adicionarACarga);

// Limpar carga
$btnLimpar.addEventListener('click', limparCarga);

// ── Inicialização ──────────────────────────
function init() {
  carregarCarga();
  renderCarga();

  // Registrar Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('SW registrado:', reg.scope))
        .catch(err => console.warn('SW erro:', err));
    });
  }
}

init();
