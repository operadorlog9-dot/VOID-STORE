const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { listProducts } = require('../utils/storage');

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('produtos')
    .setDescription('Lista produtos, IDs e estoque para a equipe.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: 'Use este comando dentro do servidor.', ephemeral: true });
    }

    const products = listProducts(interaction.guild.id);
    if (!products.length) {
      return interaction.reply({
        content: 'Nenhum produto cadastrado. Use `/produto-adicionar`.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('Produtos cadastrados')
      .setDescription(
        products.slice(0, 25).map((p) =>
          `• **${p.name}** — \`${p.id}\`\n  ${money(p.price)} • estoque: **${p.stock}** • ${p.active ? 'ativo' : 'inativo'}`
        ).join('\n')
      )
      .setFooter({ text: `${products.length} produto(s)` });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
