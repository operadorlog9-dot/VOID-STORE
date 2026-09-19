const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require('discord.js');
const { getNitradaProducts } = require('../utils/nitrada-panel');

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('painel-nitrada')
    .setDescription('Publica o painel Nitrada da VOID STORE.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const products = getNitradaProducts(interaction.guild.id);
    const inStock = products.filter((product) => Number(product.stock || 0) > 0);
    const lowestPrice = inStock.length
      ? Math.min(...inStock.map((product) => Number(product.price || 0)))
      : null;

    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setAuthor({ name: '⚡ Entrega após confirmação!' })
      .setTitle('Nitrada')
      .setDescription([
        '**Opções disponíveis:** escolha a duração no botão abaixo.',
        '',
        '**Compra rápida:** veja preço e estoque antes de iniciar o pedido.',
        '',
        '**Atendimento:** ao selecionar uma opção, o bot abre um ticket privado para a compra.',
        '',
        '**Segurança:** confirme os detalhes do produto e do pagamento dentro do atendimento.',
        '',
        '**Entrega:** o pedido segue para entrega após a confirmação do pagamento.',
        '',
        '━━━━━━━━━━━━━━━━━━━━',
        '',
        lowestPrice !== null
          ? `**A partir de**  \`${money(lowestPrice)}\``
          : '**Opções temporariamente indisponíveis**',
        'Clique no botão **“Ver opções”** para consultar as variações, preços e estoque.'
      ].join('\n'))
      .setFooter({ text: 'VOID STORE' });

    if (process.env.NITRADA_BANNER_URL) {
      embed.setImage(process.env.NITRADA_BANNER_URL);
    }

    if (process.env.NITRADA_THUMB_URL) {
      embed.setThumbnail(process.env.NITRADA_THUMB_URL);
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('nitrada_ver_opcoes')
        .setLabel('Ver opções')
        .setEmoji('🛒')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};
