# VOID STORE Bot — Multi-servidor V2

Bot Discord em Node.js + discord.js para operar lojas digitais com catálogo, pedidos, estoque, tickets e equipe.

## Objetivo

A mesma aplicação pode ser instalada em vários servidores. Cada servidor mantém configuração, produtos e pedidos separados pelo `guildId`.

A VOID STORE pode usar o bot como loja principal e a mesma base pode evoluir para um produto comercial.

## Fluxo principal

1. Administrador usa `/configurar-loja`.
2. `/montar-loja` cria cargos, categorias e canais sem duplicar a estrutura.
3. Staff cadastra produtos pelo Discord.
4. Cliente usa `/catalogo` e `/comprar`.
5. O bot cria um ticket privado e um pedido pendente.
6. Dentro do ticket existem Painel Staff e Painel Membro.
7. Staff confirma o pagamento manualmente com `/confirmar-pagamento`.
8. O bot marca o pedido como confirmado, baixa 1 unidade do estoque e entrega o cargo de comprador.
9. Cliente com compra confirmada pode usar `/avaliar`.
10. Ao encerrar pelo Painel Staff, o bot salva um transcript no canal `logs` e remove o ticket.

## Comandos

### Configuração
- `/configurar-loja`
- `/montar-loja`

### Produtos
- `/produto-adicionar`
- `/produto-editar`
- `/produto-remover`
- `/produtos`
- `/estoque-adicionar`
- `/catalogo`
- `/pedidos`

### Compra e suporte
- `/comprar`
- `/ticket`
- `/fechar-ticket`
- `/confirmar-pagamento`
- `/avaliar`
- `/painel-nitrada`

## Painel de ticket

### Staff
- Assumir Ticket
- Notificar cliente
- Marcar Entregue
- Deletar e Salvar

### Membro
- Adicionar Participante
- Chamar Atendente
- Fechar Ticket

As ações verificam o servidor e as permissões antes de executar.

## Segurança

Nunca coloque o token do bot no GitHub, README, código ou chat. No Replit, use **Secrets**.

```env
DISCORD_BOT_TOKEN=...
DISCORD_CLIENT_ID=...
DISCORD_GUILD_ID=...
NITRADA_BANNER_URL=
NITRADA_THUMB_URL=
```

`DISCORD_GUILD_ID` é opcional:
- com ele definido, `npm run deploy` registra os comandos somente no servidor de teste;
- sem ele, os comandos são registrados globalmente para os servidores onde o bot estiver instalado.

## Replit

```bash
npm install
npm run deploy
npm start
```

## Persistência

A V2 usa `data/store.json`, separado por `guildId`.

Isso é suficiente para desenvolvimento e piloto. Para comercialização em produção, migre a persistência para PostgreSQL/Supabase e mantenha a mesma separação por servidor.

Arquivos de dados locais não devem ser enviados ao GitHub.

## Pagamentos

`/confirmar-pagamento` continua **manual**. O bot não considera um pagamento real por conta própria.

Automação de pagamento só deve ser adicionada com API oficial do provedor e validação de webhook no backend.

## Permissões recomendadas

- Ver canais
- Enviar mensagens
- Ler histórico de mensagens
- Inserir links
- Anexar arquivos
- Gerenciar canais
- Gerenciar cargos
- Gerenciar mensagens
- Usar comandos de aplicativo

Evite conceder `Administrador` se não for necessário. O cargo do bot deve ficar acima dos cargos que ele precisa atribuir.
