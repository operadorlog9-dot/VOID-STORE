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
    const infoEmbed = new EmbedBuilder()
      .setColor(0x57f287)
      .setAuthor({ name: '⚡ Entrega Automática!' })
      .setTitle('Nitrada')
      .setDescription([
        '**Duração:** 1 Mês e 3 Meses completos de Nitro Gaming.',
        '',
        '**Impulsos Inclusos:** Receba 2 Boosts de Servidor já disponíveis para usar onde quiser.',
        '',
        '**Acesso Total:** Consulte os detalhes da modalidade escolhida antes da compra.',
        '',
        '**Segurança:** Confira as condições do produto e do atendimento antes de finalizar o pedido.',
        '',
        '**Entrega Rápida:** As instruções são enviadas após a confirmação da compra.',
        '',
        '━━━━━━━━━━━━━━━━━━━━',
        '',
        '**A partir de** `R$ 2,50`',
        'Clique no botão **"Ver opções"** para ver as variações disponíveis.'
      ].join('\n'))
      .setFooter({ text: 'VOID STORE' });

    if (process.env.NITRADA_THUMB_URL) {
      infoEmbed.setThumbnail(process.env.NITRADA_THUMB_URL);
    }

    const embeds = [];

    if (process.env.NITRADA_BANNER_URL) {
      const bannerEmbed = new EmbedBuilder()
        .setColor(0x57f287)
        .setImage(process.env.NITRADA_BANNER_URL);

      embeds.push(bannerEmbed);
    }

    embeds.push(infoEmbed);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('nitrada_ver_opcoes')
        .setLabel('Ver opções')
        .setEmoji('🛒')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      embeds,
      components: [row]
    });
  }
};
