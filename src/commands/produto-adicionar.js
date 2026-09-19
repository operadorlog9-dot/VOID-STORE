const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { addProduct } = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('produto-adicionar')
    .setDescription('Adiciona um produto ao catálogo.')
    .addStringOption((o) =>
      o.setName('nome').setDescription('Nome do produto').setRequired(true).setMaxLength(80)
    )
    .addNumberOption((o) =>
      o.setName('preco').setDescription('Preço em reais').setRequired(true).setMinValue(0)
    )
    .addStringOption((o) =>
      o.setName('descricao').setDescription('Descrição do produto').setRequired(true).setMaxLength(500)
    )
    .addIntegerOption((o) =>
      o.setName('estoque').setDescription('Quantidade inicial em estoque').setMinValue(0)
    )
    .addStringOption((o) =>
      o.setName('categoria').setDescription('Categoria do produto').setMaxLength(60)
    )
    .addStringOption((o) =>
      o.setName('banner').setDescription('URL HTTPS da imagem/banner').setMaxLength(500)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: 'Use este comando dentro do servidor.', ephemeral: true });
    }

    const banner = interaction.options.getString('banner') || '';
    if (banner && !/^https:\/\//i.test(banner)) {
      return interaction.reply({
        content: '❌ O banner precisa ser uma URL HTTPS.',
        ephemeral: true
      });
    }

    const result = addProduct(interaction.guild.id, {
      name: interaction.options.getString('nome', true),
      price: interaction.options.getNumber('preco', true),
      description: interaction.options.getString('descricao', true),
      stock: interaction.options.getInteger('estoque') ?? 0,
      category: interaction.options.getString('categoria') || 'Geral',
      bannerUrl: banner
    });

    if (!result.ok) {
      return interaction.reply({
        content: '❌ Já existe um produto com esse nome.',
        ephemeral: true
      });
    }

    await interaction.reply({
      content: `✅ Produto **${result.product.name}** criado com ID \`${result.product.id}\` e estoque **${result.product.stock}**.`,
      ephemeral: true
    });
  }
};
