const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { hasConfirmedPurchase } = require('../utils/storage');
const { logAction } = require('../utils/discord');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avaliar')
    .setDescription('Publica uma avaliação após uma compra confirmada.')
    .addIntegerOption((o) => o.setName('nota').setDescription('Nota de 1 a 5').setMinValue(1).setMaxValue(5).setRequired(true))
    .addStringOption((o) => o.setName('comentario').setDescription('Seu comentário').setRequired(true).setMaxLength(500)),

  async execute(interaction) {
    if (!interaction.inGuild()) return interaction.reply({ content: 'Use este comando no servidor.', ephemeral: true });
    if (!hasConfirmedPurchase(interaction.user.id)) {
      return interaction.reply({ content: 'A avaliação é liberada somente após uma compra ser marcada como confirmada.', ephemeral: true });
    }

    const nota = interaction.options.getInteger('nota', true);
    const comentario = interaction.options.getString('comentario', true);
    const channel = interaction.guild.channels.cache.find((c) => c.name === 'avaliacoes');
    if (!channel) return interaction.reply({ content: 'O canal #avaliacoes ainda não existe. Execute /montar-loja.', ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle('Avaliação de cliente')
      .setDescription(comentario)
      .addFields({ name: 'Nota', value: '⭐'.repeat(nota) })
      .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    await logAction(interaction.guild, `⭐ ${interaction.user.tag} publicou avaliação ${nota}/5.`);
    await interaction.reply({ content: `✅ Avaliação publicada em ${channel}.`, ephemeral: true });
  }
};
