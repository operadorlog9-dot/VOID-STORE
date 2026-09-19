const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config/store');
const { logAction } = require('../utils/discord');

module.exports = {
  data: new SlashCommandBuilder().setName('fechar-ticket').setDescription('Fecha o ticket atual.'),

  async execute(interaction) {
    if (!interaction.inGuild() || !interaction.channel?.topic?.startsWith('ticket-owner:')) {
      return interaction.reply({ content: 'Este comando só pode ser usado dentro de um ticket.', ephemeral: true });
    }

    const ownerId = interaction.channel.topic.split(':')[1];
    const staffRole = interaction.guild.roles.cache.find((r) => r.name === config.roles.staff);
    const isOwner = interaction.user.id === ownerId;
    const isStaff = staffRole && interaction.member.roles.cache.has(staffRole.id);
    const canManage = interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels);

    if (!isOwner && !isStaff && !canManage) {
      return interaction.reply({ content: 'Você não pode fechar este ticket.', ephemeral: true });
    }

    await interaction.reply('🔒 Ticket encerrado. Este canal será removido em alguns segundos.');
    await logAction(interaction.guild, `🔒 Ticket ${interaction.channel.name} fechado por ${interaction.user.tag}.`);
    setTimeout(() => interaction.channel.delete('Ticket encerrado').catch(() => null), 4000);
  }
};
