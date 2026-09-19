const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config/store');
const { addPurchase } = require('../utils/storage');
const { ensureRole, logAction } = require('../utils/discord');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('confirmar-pagamento')
    .setDescription('Marca manualmente uma compra como paga e libera o cargo de comprador.')
    .addUserOption((o) => o.setName('usuario').setDescription('Cliente').setRequired(true))
    .addStringOption((o) => o.setName('produto').setDescription('Produto comprado').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!interaction.inGuild()) return interaction.reply({ content: 'Use este comando no servidor.', ephemeral: true });
    const target = interaction.options.getUser('usuario', true);
    const produto = interaction.options.getString('produto', true);
    const member = await interaction.guild.members.fetch(target.id);
    const buyerRole = await ensureRole(interaction.guild, config.roles.buyer);

    await member.roles.add(buyerRole, `Pagamento confirmado por ${interaction.user.tag}`);
    addPurchase({
      userId: target.id,
      product: produto,
      status: 'confirmed',
      confirmedBy: interaction.user.id,
      confirmedAt: new Date().toISOString()
    });

    await logAction(interaction.guild, `💳 Pagamento confirmado: ${target.tag} • ${produto} • por ${interaction.user.tag}.`);
    await interaction.reply({ content: `✅ Pagamento de ${target} confirmado. Cargo **${buyerRole.name}** aplicado.`, ephemeral: true });
  }
};
