const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getGuildState, listProducts } = require('../utils/storage');

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('catalogo')
    .setDescription('Mostra o catálogo de produtos da loja.'),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: 'Use este comando dentro do servidor.', ephemeral: true });
    }

    const state = getGuildState(interaction.guild.id);
    const products = listProducts(interaction.guild.id).filter((p) => p.active);

    if (!products.length) {
      return interaction.reply({
        content: '📦 O catálogo ainda está vazio. A equipe precisa cadastrar produtos.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`${state.config.brandName || interaction.guild.name} • Catálogo`)
      .setDescription('Use `/comprar produto:<nome>` para iniciar sua compra.')
      .addFields(
        products.slice(0, 12).map((p) => ({
          name: `${p.name} • ${money(p.price)}`,
          value: [
            p.description.slice(0, 180),
            `Estoque: **${p.stock}**`,
            `Categoria: ${p.category || 'Geral'}`
          ].join('\n')
        }))
      )
      .setFooter({ text: 'Atendimento e pagamento são confirmados pela equipe.' });

    const firstBanner = products.find((p) => /^https:\/\//i.test(p.bannerUrl || ''));
    if (firstBanner) embed.setImage(firstBanner.bannerUrl);

    await interaction.reply({ embeds: [embed] });
  }
};
