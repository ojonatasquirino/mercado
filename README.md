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

## Ativar login e sincronização (Firebase)

Sem isso o app funciona normalmente, só que salvo no próprio aparelho.

1. Acesse https://console.firebase.google.com e clique em **Criar projeto** (Google Analytics pode ficar desativado).
2. Em **Build > Authentication > Get started**, ative os provedores **Google** e **E-mail/senha**.
3. Em **Build > Firestore Database > Criar banco de dados**, escolha a região `southamerica-east1 (São Paulo)` e o **modo de produção**.
4. Na aba **Regras** do Firestore, cole o conteúdo de `firestore.rules` e publique.
5. Em **Authentication > Settings > Domínios autorizados**, adicione `ojonatasquirino.github.io`.
6. Em **Configurações do projeto > Seus apps**, clique no ícone **Web (`</>`)**, registre o app e copie o objeto `firebaseConfig`.
7. Cole em `firebase-config.js` no lugar de `null` e faça o commit.

A configuração web do Firebase não é segredo: quem protege os dados são as regras do passo 4.
