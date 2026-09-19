const { SlashCommandBuilder } = require('discord.js');
const { createTicket, logAction } = require('../utils/discord');

module.exports = {
  data: new SlashCommandBuilder().setName('ticket').setDescription('Abre um ticket privado com a equipe.'),

  async execute(interaction) {
    if (!interaction.inGuild()) return interaction.reply({ content: 'Use este comando dentro do servidor.', ephemeral: true });
    await interaction.deferReply({ ephemeral: true });
    const { channel, created } = await createTicket(interaction.guild, interaction.user, 'Suporte');
    if (!created) return interaction.editReply(`Você já possui um ticket aberto: ${channel}`);

    await channel.send(`Olá ${interaction.user}. Explique o que você precisa e a equipe continuará o atendimento aqui.`);
    await logAction(interaction.guild, `🎫 Ticket aberto por ${interaction.user.tag}: ${channel}`);
    await interaction.editReply(`Ticket criado: ${channel}`);
  }
};
