const { SlashCommandBuilder } = require('discord.js');
const { createTicket, logAction } = require('../utils/discord');
const { sendTicketPanel } = require('../utils/ticket-system');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Abre um ticket privado com a equipe.'),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: 'Use este comando dentro do servidor.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });
    const { channel, created } = await createTicket(
      interaction.guild,
      interaction.user,
      'Suporte'
    );

    if (!created) {
      return interaction.editReply(`Você já possui um ticket aberto: ${channel}`);
    }

    await sendTicketPanel(channel, interaction.user);
    await logAction(
      interaction.guild,
      `🎫 Ticket aberto por ${interaction.user.tag}: ${channel}`
    );

    await interaction.editReply(`✅ Ticket criado: ${channel}`);
  }
};
