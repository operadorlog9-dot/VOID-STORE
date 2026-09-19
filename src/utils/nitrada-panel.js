const {
  ActionRowBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} = require('discord.js');

const {
  listProducts,
  findProduct,
  makeOrderId,
  createOrder,
  updateOrder
} = require('./storage');
const {
  createTicket,
  findOpenTicket,
  logAction
} = require('./discord');
const { sendTicketPanel } = require('./ticket-system');

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function truncate(value, max) {
  const text = String(value || '');
  return text.length > max ? `${text.slice(0, Math.max(0, max - 1))}…` : text;
}

function durationRank(product) {
  const text = `${product.name || ''} ${product.category || ''}`.toLowerCase();
  if (/mensal|1\s*m[eê]s/.test(text)) return 1;
  if (/trimestral|3\s*m[eê]s/.test(text)) return 2;
  if (/semestral|6\s*m[eê]s/.test(text)) return 3;
  if (/anual|12\s*m[eê]s|1\s*ano/.test(text)) return 4;
  return 10;
}

function getNitradaProducts(guildId) {
  return listProducts(guildId)
    .filter((product) => {
      if (!product.active) return false;
      const haystack = `${product.name || ''} ${product.category || ''}`;
      return /nitrad|nitro/i.test(haystack);
    })
    .sort((a, b) => durationRank(a) - durationRank(b) || Number(a.price || 0) - Number(b.price || 0))
    .slice(0, 25);
}

function buildOptionsMessage(guildId) {
  const products = getNitradaProducts(guildId);

  if (!products.length) {
    return {
      empty: true,
      payload: {
        content: '📦 Ainda não há opções de Nitro/Nitrada cadastradas no catálogo.',
        ephemeral: true
      }
    };
  }

  const embed = new EmbedBuilder()
    .setTitle('📦 Escolha uma opção')
    .setDescription('Selecione abaixo a modalidade que deseja comprar.')
    .addFields(
      products.map((product) => ({
        name: product.name,
        value: `Preço: **${money(product.price)}** | Estoque: **${Number(product.stock || 0)}**`
      }))
    )
    .setFooter({ text: 'VOID STORE • o menu abaixo só aparece para você' });

  const menu = new StringSelectMenuBuilder()
    .setCustomId('nitrada_select_product')
    .setPlaceholder('➡️ Escolha uma opção')
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(
      products.map((product) => {
        const stock = Number(product.stock || 0);
        return new StringSelectMenuOptionBuilder()
          .setLabel(truncate(stock > 0 ? product.name : `${product.name} • ESGOTADO`, 100))
          .setDescription(
            truncate(`${money(product.price)} • estoque ${stock}`, 100)
          )
          .setValue(product.id)
          .setEmoji(stock > 0 ? '📦' : '⛔');
      })
    );

  return {
    empty: false,
    payload: {
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(menu)],
      ephemeral: true
    }
  };
}

async function startPurchaseFromSelect(interaction, productIdentifier) {
  const existing = findOpenTicket(interaction.guild, interaction.user.id);
  if (existing) {
    await interaction.reply({
      content: `⚠️ Você já possui um ticket aberto: ${existing}`,
      ephemeral: true
    });
    return;
  }

  const product = findProduct(interaction.guild.id, productIdentifier);

  if (!product || !product.active) {
    await interaction.reply({
      content: '❌ Essa opção não está mais disponível.',
      ephemeral: true
    });
    return;
  }

  if (Number(product.stock || 0) <= 0) {
    await interaction.reply({
      content: '❌ Essa opção está sem estoque no momento.',
      ephemeral: true
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const orderId = makeOrderId();
  const { channel, created } = await createTicket(
    interaction.guild,
    interaction.user,
    `Compra: ${product.name}`,
    { orderId, productName: product.name }
  );

  if (!created) {
    await interaction.editReply(`⚠️ Você já possui um ticket aberto: ${channel}`);
    return;
  }

  const order = createOrder(interaction.guild.id, {
    id: orderId,
    userId: interaction.user.id,
    productId: product.id,
    productName: product.name,
    price: product.price,
    channelId: channel.id
  });

  updateOrder(interaction.guild.id, order.id, { channelId: channel.id });
  await sendTicketPanel(channel, interaction.user, order);

  await logAction(
    interaction.guild,
    `🛒 ${interaction.user.tag} selecionou **${product.name}** no painel Nitrada e abriu o pedido **${order.id}** em ${channel}.`
  );

  await interaction.editReply(
    `✅ **${product.name}** selecionado. Seu atendimento foi criado: ${channel}`
  );
}

async function handleNitradaComponent(interaction) {
  if (!interaction.inGuild()) return false;

  if (interaction.isButton() && interaction.customId === 'nitrada_ver_opcoes') {
    const result = buildOptionsMessage(interaction.guild.id);
    await interaction.reply(result.payload);
    return true;
  }

  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === 'nitrada_select_product'
  ) {
    await startPurchaseFromSelect(interaction, interaction.values[0]);
    return true;
  }

  return false;
}

module.exports = {
  getNitradaProducts,
  buildOptionsMessage,
  handleNitradaComponent
};
