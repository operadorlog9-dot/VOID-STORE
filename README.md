# VOID STORE Bot

Bot Discord em Node.js + discord.js para montar e operar a base da VOID STORE.

## O que já vem pronto

- `/montar-loja` cria categorias, canais e cargos sem duplicar a estrutura.
- `/catalogo` mostra um catálogo básico.
- `/ticket` abre um ticket privado.
- `/comprar produto:<nome>` abre um atendimento de compra.
- `/fechar-ticket` encerra o ticket.
- `/confirmar-pagamento usuario:<@user> produto:<nome>` marca a compra como confirmada e adiciona o cargo `Comprador VOID`.
- `/avaliar` só funciona para usuários com compra confirmada no registro local.
- Canal `logs` recebe registros importantes quando a estrutura já foi montada.

## Segurança

Nunca coloque o token do bot no GitHub, README, código ou chat. No Replit, use **Secrets**.

Variáveis necessárias:

```env
DISCORD_BOT_TOKEN=...
DISCORD_CLIENT_ID=...
DISCORD_GUILD_ID=...
```

O arquivo `.env.example` é apenas um modelo e não contém segredos.

## Replit

1. Importe este projeto para um Repl Node.js ou conecte o repositório GitHub.
2. Em **Secrets**, crie `DISCORD_BOT_TOKEN`, `DISCORD_CLIENT_ID` e `DISCORD_GUILD_ID`.
3. No Shell execute:
   ```bash
   npm install
   npm run deploy
   npm start
   ```
4. No Discord, digite `/` e teste `/montar-loja`.

## GitHub + VS Code

Use o GitHub como fonte principal. No VS Code, clone o mesmo repositório. Faça alterações em uma branch e envie commits normalmente. O Replit pode puxar a mesma branch/repositório.

## Permissões recomendadas do bot

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

## Observação sobre pagamentos

O comando `/confirmar-pagamento` é manual. O bot não considera um pagamento como verdadeiro por conta própria. Para confirmação automática, integre posteriormente uma API oficial do provedor de pagamento e valide os eventos no backend.

## Persistência

Nesta versão inicial, compras confirmadas são salvas em `data/purchases.json`. Para produção, migre esse registro para um banco de dados (ex.: Supabase/PostgreSQL) para evitar perda de dados em ambientes efêmeros.
