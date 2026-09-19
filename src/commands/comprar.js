const { SlashCommandBuilder } = require('discord.js');
const { createTicket, logAction } = require('../utils/discord');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('comprar')
    .setDescription('Inicia um atendimento de compra.')
    .addStringOption((o) => o.setName('produto').setDescription('Produto que deseja comprar').setRequired(true)),

  async execute(interaction) {
    if (!interaction.inGuild()) return interaction.reply({ content: 'Use este comando dentro do servidor.', ephemeral: true });
    const produto = interaction.options.getString('produto', true);
    await interaction.deferReply({ ephemeral: true });
    const { channel, created } = await createTicket(interaction.guild, interaction.user, `Compra: ${produto}`);
    if (!created) return interaction.editReply(`Você já possui um ticket aberto: ${channel}`);

    await channel.send(`🛒 **Nova solicitação de compra**\nCliente: ${interaction.user}\nProduto: **${produto}**\n\nA equipe continuará o atendimento por aqui.`);
    await logAction(interaction.guild, `🛒 ${interaction.user.tag} iniciou compra de "${produto}" em ${channel}.`);
    await interaction.editReply(`Atendimento de compra criado: ${channel}`);
  }
};
