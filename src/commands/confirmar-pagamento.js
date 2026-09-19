const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const {
  findPendingOrder,
  confirmOrder,
  updateGuildConfig
} = require('../utils/storage');
const {
  getConfiguredRoles,
  logAction
} = require('../utils/discord');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('confirmar-pagamento')
    .setDescription('Confirma manualmente um pedido pago e libera o cargo de comprador.')
    .addUserOption((o) =>
      o.setName('usuario').setDescription('Cliente').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('produto').setDescription('Nome ou ID do produto').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: 'Use este comando no servidor.', ephemeral: true });
    }

    const target = interaction.options.getUser('usuario', true);
    const productIdentifier = interaction.options.getString('produto', true);
    const order = findPendingOrder(interaction.guild.id, target.id, productIdentifier);

    if (!order) {
      return interaction.reply({
        content: '❌ Não encontrei um pedido pendente desse cliente para esse produto.',
        ephemeral: true
      });
    }

    const result = confirmOrder(interaction.guild.id, order.id, interaction.user.id);
    if (!result.ok && result.reason === 'out_of_stock') {
      return interaction.reply({
        content: '❌ O estoque chegou a zero. Reponha o produto antes de confirmar.',
        ephemeral: true
      });
    }

    if (!result.ok) {
      return interaction.reply({
        content: '❌ Não foi possível confirmar esse pedido.',
        ephemeral: true
      });
    }

    const member = await interaction.guild.members.fetch(target.id);
    const { buyerRole } = await getConfiguredRoles(interaction.guild);
    updateGuildConfig(interaction.guild.id, { buyerRoleId: buyerRole.id });

    await member.roles.add(
      buyerRole,
      `Pagamento confirmado por ${interaction.user.tag}`
    );

    if (order.channelId) {
      const channel = interaction.guild.channels.cache.get(order.channelId);
      if (channel) {
        const embed = new EmbedBuilder()
          .setColor(0x57f287)
          .setTitle('✅ Pagamento confirmado')
          .setDescription(
            `Pedido \`${order.id}\` de ${target} foi confirmado pela equipe.\nO atendimento pode continuar neste ticket.`
          )
          .setTimestamp();
        await channel.send({ embeds: [embed] }).catch(() => null);
      }
    }

    await logAction(
      interaction.guild,
      `💳 Pagamento confirmado: ${target.tag} • ${order.productName} • pedido ${order.id} • por ${interaction.user.tag}.`
    );

    await interaction.reply({
      content: `✅ Pedido \`${order.id}\` confirmado. Cargo **${buyerRole.name}** aplicado a ${target}.`,
      ephemeral: true
    });
  }
};
