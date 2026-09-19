const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('catalogo')
    .setDescription('Mostra o catálogo básico da VOID STORE.'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('VOID STORE • Catálogo')
      .setDescription('Use `/comprar` para iniciar um atendimento de compra.')
      .addFields(
        { name: 'Discord Nitro', value: 'Consulte disponibilidade, modalidade e condições no atendimento.' },
        { name: 'Itens de jogos', value: 'Consulte os itens disponíveis no canal de catálogo.' }
      )
      .setFooter({ text: 'VOID STORE' });

    await interaction.reply({ embeds: [embed] });
  }
};
