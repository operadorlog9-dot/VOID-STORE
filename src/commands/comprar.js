const { SlashCommandBuilder } = require('discord.js');
const {
  findProduct,
  listProducts,
  makeOrderId,
  createOrder,
  updateOrder
} = require('../utils/storage');
const {
  createTicket,
  findOpenTicket,
  logAction
} = require('../utils/discord');
const { sendTicketPanel } = require('../utils/ticket-system');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('comprar')
    .setDescription('Inicia um atendimento de compra.')
    .addStringOption((o) =>
      o
        .setName('produto')
        .setDescription('Produto que deseja comprar')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    if (!interaction.inGuild()) return interaction.respond([]);
    const focused = interaction.options.getFocused().toLowerCase();
    const choices = listProducts(interaction.guild.id)
      .filter((p) => p.active && p.stock > 0)
      .filter((p) => p.name.toLowerCase().includes(focused) || p.id.includes(focused))
      .slice(0, 25)
      .map((p) => ({ name: `${p.name} • estoque ${p.stock}`, value: p.id }));

    await interaction.respond(choices);
  },

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: 'Use este comando dentro do servidor.', ephemeral: true });
    }

    const existing = findOpenTicket(interaction.guild, interaction.user.id);
    if (existing) {
      return interaction.reply({
        content: `Você já possui um ticket aberto: ${existing}`,
        ephemeral: true
      });
    }

    const identifier = interaction.options.getString('produto', true);
    const product = findProduct(interaction.guild.id, identifier);

    if (!product || !product.active) {
      return interaction.reply({
        content: '❌ Produto não encontrado ou indisponível.',
        ephemeral: true
      });
    }

    if (Number(product.stock || 0) <= 0) {
      return interaction.reply({
        content: '❌ Este produto está sem estoque no momento.',
        ephemeral: true
      });
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
      return interaction.editReply(`Você já possui um ticket aberto: ${channel}`);
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
      `🛒 ${interaction.user.tag} abriu o pedido **${order.id}** de **${product.name}** em ${channel}.`
    );

    await interaction.editReply(`✅ Atendimento de compra criado: ${channel}`);
  }
};
