# Mercado App

Lista de mercado offline com orçamento, preço no carrinho em tempo real, ditado por voz, histórico de compras com comparativo de preços e nota em PDF. PWA em HTML/JS puro.

**Demo:** https://ojonatasquirino.github.io/mercado/

## Recursos

- Listas prontas, preço direto no card, botões − e + de quantidade
- Ditado por voz: "arroz cinco quilos vinte e quatro e noventa"
- Alerta quando um item está mais caro ou mais barato que na última compra
- Barra de carrinho/orçamento fixa no topo
- Compras anteriores: gasto por mês, por mercado, itens que mais subiram de preço
- Compartilhar a lista no WhatsApp e gerar nota em PDF
- Funciona offline e instala na tela inicial
- Login opcional (Google ou e-mail) com sincronização entre aparelhos

## Estrutura

| Arquivo | Papel |
| --- | --- |
| `index.html` | Marcação |
| `styles.css` | Estilos |
| `store.js` | Camada de dados (localStorage + ganchos para a nuvem) |
| `cloud.js` | Login e sincronização no Firebase |
| `voice.js` | Ditado e parser de voz em português |
| `app.js` | Interface e regras do app |
| `firebase-config.js` | Configuração do projeto Firebase |
| `firestore.rules` | Regras de segurança do banco |
| `sw.js` / `manifest.json` | PWA offline |

## Login e sincronização (Firebase)

O app usa o projeto Firebase próprio `mercado-app-228fe`:

- **Authentication:** Google e E-mail/senha, domínio `ojonatasquirino.github.io` autorizado
- **Firestore:** região `southamerica-east1` (São Paulo), dados em `users/{uid}/estado/lista` e `users/{uid}/compras/{id}`
- **Regras:** as de `firestore.rules` (cada pessoa só acessa os próprios dados)

A configuração em `firebase-config.js` não é segredo: quem protege os dados são as regras.
