const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { removeProduct } = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('produto-remover')
    .setDescription('Remove um produto do catálogo.')
    .addStringOption((o) =>
      o.setName('produto').setDescription('Nome ou ID do produto').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: 'Use este comando dentro do servidor.', ephemeral: true });
    }

    const product = removeProduct(
      interaction.guild.id,
      interaction.options.getString('produto', true)
    );

    if (!product) {
      return interaction.reply({ content: '❌ Produto não encontrado.', ephemeral: true });
    }

    await interaction.reply({
      content: `✅ Produto **${product.name}** removido do catálogo.`,
      ephemeral: true
    });
  }
};
