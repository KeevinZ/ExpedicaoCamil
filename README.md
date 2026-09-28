# 📦 Conferência de Paletes — Camil Alimentos

> Aplicativo mobile (PWA) para conferência rápida de carga no depósito — calcule paletes fechados e caixas avulsas em segundos, sem precisar instalar nada.

---

## 🎯 O que é esse projeto?

Este é um **Web App progressivo (PWA)** desenvolvido para otimizar o trabalho de conferentes de carga no depósito da **Camil Alimentos**.

No dia a dia do recebimento de mercadorias, o conferente precisa saber rapidamente:
- Quantos **paletes fechados** fazem parte de uma carga?
- Quantas **caixas avulsas (sobras)** ficam fora do palete?

Antes, isso era feito de cabeça ou na calculadora, consultando uma tabela separada com os padrões de paletização de cada produto. **Com esse app, é só buscar o produto, digitar a quantidade e o resultado aparece na hora.**

---

## ✨ Funcionalidades

- 🔍 **Busca inteligente** por código ou descrição do produto (com autocomplete)
- ⚡ **Cálculo automático** de paletes fechados e caixas avulsas ao digitar
- 📋 **Histórico de carga** — adicione vários produtos e acompanhe o total do caminhão
- 💾 **Salva a carga automaticamente** — os dados persistem mesmo ao fechar o navegador
- 📶 **Funciona offline** — após o primeiro acesso, não precisa de internet
- 📱 **Instalável no celular** — pode ser adicionado à tela inicial como um app nativo

---

## 🗃️ Base de dados

O app contém **228 produtos Camil** com seus respectivos padrões de paletização:

| Campo | Descrição |
|---|---|
| `Item` | Código numérico do produto |
| `Descrição` | Nome completo + embalagem |
| `Lastro` | Distribuição por camada (ex: `10x10`) |
| `Qtd. Palete` | Total de caixas em 1 palete fechado |

---

## 🚀 Como usar / hospedar no GitHub Pages

1. Crie um repositório no GitHub (ex: `palete-camil`)
2. Faça upload de **todos os arquivos** desta pasta (incluindo `icons/`)
3. Acesse **Settings → Pages → Source: Deploy from branch → main / (root)**
4. Aguarde ~1 minuto e acesse `https://seu-usuario.github.io/palete-camil/`

---

## 📱 Instalar no celular

| Sistema | Passos |
|---|---|
| **Android (Chrome)** | Menu `⋮` → "Adicionar à tela inicial" |
| **iOS (Safari)** | Botão compartilhar `↑` → "Adicionar à Tela de Início" |

---

## 🛠️ Tecnologias utilizadas

- **HTML5 + CSS3 + JavaScript puro** (sem frameworks ou dependências externas)
- **PWA** com Service Worker para funcionamento offline
- **localStorage** para persistência da carga entre sessões
- **Design mobile-first** otimizado para uso no depósito (alto contraste, botões grandes)

---

## 📁 Estrutura do projeto

```
palete-camil/
├── index.html       # Interface do app
├── style.css        # Estilos responsivos mobile-first
├── script.js        # Lógica de busca, cálculos e histórico
├── dados.js         # Base de dados com 228 produtos
├── manifest.json    # Manifesto PWA
├── sw.js            # Service Worker (modo offline)
└── icons/           # Ícones do app (192px e 512px)
```

---

*Desenvolvido para uso interno no recebimento e conferência de cargas — Camil Alimentos.*