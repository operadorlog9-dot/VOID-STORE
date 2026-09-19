const {
  SlashCommandBuilder,
  PermissionFlagsBits
} = require('discord.js');
const {
  getGuildState,
  updateGuildConfig
} = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configurar-loja')
    .setDescription('Configura esta loja para usar o bot.')
    .addStringOption((o) =>
      o
        .setName('nome')
        .setDescription('Nome da loja')
        .setMaxLength(80)
    )
    .addRoleOption((o) =>
      o
        .setName('cargo_staff')
        .setDescription('Cargo da equipe/staff')
    )
    .addRoleOption((o) =>
      o
        .setName('cargo_comprador')
        .setDescription('Cargo entregue após uma compra confirmada')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({
        content: 'Use este comando dentro de um servidor.',
        ephemeral: true
      });
    }

    const current = getGuildState(interaction.guild.id);
    const name = interaction.options.getString('nome');
    const staffRole = interaction.options.getRole('cargo_staff');
    const buyerRole = interaction.options.getRole('cargo_comprador');

    const patch = {};
    if (name) patch.brandName = name.trim();
    if (staffRole) patch.staffRoleId = staffRole.id;
    if (buyerRole) patch.buyerRoleId = buyerRole.id;

    const config = Object.keys(patch).length
      ? updateGuildConfig(interaction.guild.id, patch)
      : current.config;

    await interaction.reply({
      content: [
        '✅ **Configuração da loja**',
        `Nome: **${config.brandName || interaction.guild.name}**`,
        `Cargo Staff: ${config.staffRoleId ? `<@&${config.staffRoleId}>` : 'será criado automaticamente'}`,
        `Cargo Comprador: ${config.buyerRoleId ? `<@&${config.buyerRoleId}>` : 'será criado automaticamente'}`,
        '',
        'Depois execute `/montar-loja` para criar a estrutura de canais.'
      ].join('\n'),
      ephemeral: true
    });
  }
};
