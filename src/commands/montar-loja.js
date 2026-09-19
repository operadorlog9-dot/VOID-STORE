const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config/store');
const { getGuildState } = require('../utils/storage');
const {
  getConfiguredRoles,
  ensureCategory,
  ensureTextChannel,
  logAction
} = require('../utils/discord');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('montar-loja')
    .setDescription('Monta automaticamente a estrutura da loja sem duplicar canais.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({
        content: 'Use este comando dentro de um servidor.',
        ephemeral: true
      });
    }

    if (
      !interaction.memberPermissions.has(PermissionFlagsBits.Administrator) &&
      !interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)
    ) {
      return interaction.reply({
        content: 'Você precisa de Administrador ou Gerenciar Servidor.',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild;
    const state = getGuildState(guild.id);
    const { staffRole } = await getConfiguredRoles(guild);

    const categoryMap = {};
    categoryMap.inicio = await ensureCategory(guild, config.categories.inicio);
    categoryMap.loja = await ensureCategory(guild, config.categories.loja);
    categoryMap.suporte = await ensureCategory(guild, config.categories.suporte);
    categoryMap.staff = await ensureCategory(
      guild,
      config.categories.staff,
      true,
      staffRole
    );

    for (const [key, channels] of Object.entries(config.channels)) {
      for (const [name, topic] of channels) {
        await ensureTextChannel(guild, name, topic, categoryMap[key].id);
      }
    }

    await logAction(
      guild,
      `🛠️ ${interaction.user.tag} executou /montar-loja.`
    );

    await interaction.editReply(
      `✅ **${state.config.brandName || guild.name}** configurada com sucesso.\nAgora use \`/produto-adicionar\` para cadastrar o catálogo.`
    );
  }
};
