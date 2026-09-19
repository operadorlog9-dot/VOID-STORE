const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { changeStock } = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('estoque-adicionar')
    .setDescription('Adiciona unidades ao estoque de um produto.')
    .addStringOption((o) =>
      o.setName('produto').setDescription('Nome ou ID do produto').setRequired(true)
    )
    .addIntegerOption((o) =>
      o.setName('quantidade').setDescription('Quantidade a adicionar').setRequired(true).setMinValue(1)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: 'Use este comando dentro do servidor.', ephemeral: true });
    }

    const product = changeStock(
      interaction.guild.id,
      interaction.options.getString('produto', true),
      interaction.options.getInteger('quantidade', true)
    );

    if (!product) {
      return interaction.reply({ content: '❌ Produto não encontrado.', ephemeral: true });
    }

    await interaction.reply({
      content: `✅ Estoque de **${product.name}** atualizado para **${product.stock}** unidade(s).`,
      ephemeral: true
    });
  }
};
