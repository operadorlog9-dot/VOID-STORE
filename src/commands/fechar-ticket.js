const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { parseTicketMeta, isStaffMember, logAction } = require('../utils/discord');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fechar-ticket')
    .setDescription('Fecha o ticket atual.'),

  async execute(interaction) {
    const meta = parseTicketMeta(interaction.channel);
    if (!interaction.inGuild() || !meta) {
      return interaction.reply({
        content: 'Este comando só pode ser usado dentro de um ticket.',
        ephemeral: true
      });
    }

    const isOwner = interaction.user.id === meta.ownerId;
    const isStaff = isStaffMember(interaction.guild, interaction.member);
    const canManage = interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels);

    if (!isOwner && !isStaff && !canManage) {
      return interaction.reply({
        content: 'Você não pode fechar este ticket.',
        ephemeral: true
      });
    }

    await interaction.reply('🔒 Ticket encerrado. Este canal será removido em alguns segundos.');
    await logAction(
      interaction.guild,
      `🔒 Ticket ${interaction.channel.name} fechado por ${interaction.user.tag}.`
    );

    setTimeout(
      () => interaction.channel.delete('Ticket encerrado').catch(() => null),
      4000
    );
  }
};
