const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { listOrders } = require('../utils/storage');

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pedidos')
    .setDescription('Mostra o histórico recente de pedidos da loja.')
    .addStringOption((o) =>
      o
        .setName('status')
        .setDescription('Filtrar por status')
        .addChoices(
          { name: 'Todos', value: 'all' },
          { name: 'Pendentes', value: 'pending' },
          { name: 'Confirmados', value: 'confirmed' },
          { name: 'Entregues', value: 'delivered' }
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: 'Use este comando dentro do servidor.', ephemeral: true });
    }

    const status = interaction.options.getString('status') || 'all';
    let orders = listOrders(interaction.guild.id)
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (status !== 'all') orders = orders.filter((o) => o.status === status);

    if (!orders.length) {
      return interaction.reply({
        content: 'Nenhum pedido encontrado com esse filtro.',
        ephemeral: true
      });
    }

    const lines = orders.slice(0, 20).map((o) =>
      `• \`${o.id}\` • <@${o.userId}> • **${o.productName}** • ${money(o.price)} • **${o.status}**`
    );

    const embed = new EmbedBuilder()
      .setTitle('Histórico de pedidos')
      .setDescription(lines.join('\n'))
      .setFooter({ text: `Exibindo ${Math.min(orders.length, 20)} de ${orders.length}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
