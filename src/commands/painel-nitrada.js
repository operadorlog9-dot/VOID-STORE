const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('painel-nitrada')
    .setDescription('Publica o painel Nitrada da VOID STORE.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle('Nitrada')
      .setDescription([
        '⚡ **Entrega automática**',
        '',
        '**Opções:** 1 mês e 3 meses.',
        '',
        '**Benefícios:** consulte as opções disponíveis antes da compra.',
        '',
        '**Entrega:** as instruções são enviadas após a confirmação do pedido.',
        '',
        '**A partir de R$ 2,50**',
        '',
        'Clique em **Ver opções** para conferir as variações disponíveis.'
      ].join('\n'))
      .setFooter({ text: 'VOID STORE' });

    if (process.env.NITRADA_BANNER_URL) embed.setImage(process.env.NITRADA_BANNER_URL);
    if (process.env.NITRADA_THUMB_URL) embed.setThumbnail(process.env.NITRADA_THUMB_URL);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('nitrada_ver_opcoes')
        .setLabel('Ver opções')
        .setEmoji('🛒')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};
