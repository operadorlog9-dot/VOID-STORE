require('dotenv').config();
const fs = require('fs');
const path = require('path');
const {
  Client,
  Collection,
  Events,
  GatewayIntentBits
} = require('discord.js');
const { handleTicketComponent } = require('./utils/ticket-system');

const required = ['DISCORD_BOT_TOKEN', 'DISCORD_CLIENT_ID'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Variáveis ausentes: ${missing.join(', ')}`);
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ Bot online como ${readyClient.user.tag}`);
  console.log(`✅ Servidores conectados: ${readyClient.guilds.cache.size}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (command?.autocomplete) {
        await command.autocomplete(interaction);
      }
      return;
    }

    if (interaction.isMessageComponent()) {
      const handledTicket = await handleTicketComponent(interaction);
      if (handledTicket) return;

      if (
        interaction.isButton() &&
        interaction.customId === 'nitrada_ver_opcoes'
      ) {
        await interaction.reply({
          content: [
            '**Nitrada • opções disponíveis**',
            '',
            'Consulte as opções cadastradas no catálogo.',
            'Use `/catalogo` para ver os produtos e `/comprar` para iniciar o pedido.'
          ].join('\n'),
          ephemeral: true
        });
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    await command.execute(interaction);
  } catch (error) {
    console.error('Erro ao processar interação:', error);

    if (interaction.isAutocomplete()) {
      await interaction.respond([]).catch(() => null);
      return;
    }

    const payload = {
      content: '❌ Ocorreu um erro ao executar esta ação.',
      ephemeral: true
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(payload).catch(() => null);
    } else {
      await interaction.reply(payload).catch(() => null);
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
