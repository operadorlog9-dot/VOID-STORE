const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { updateProduct } = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('produto-editar')
    .setDescription('Edita um produto existente.')
    .addStringOption((o) =>
      o.setName('produto').setDescription('Nome ou ID do produto').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('novo_nome').setDescription('Novo nome').setMaxLength(80)
    )
    .addNumberOption((o) =>
      o.setName('preco').setDescription('Novo preço em reais').setMinValue(0)
    )
    .addStringOption((o) =>
      o.setName('descricao').setDescription('Nova descrição').setMaxLength(500)
    )
    .addStringOption((o) =>
      o.setName('categoria').setDescription('Nova categoria').setMaxLength(60)
    )
    .addStringOption((o) =>
      o.setName('banner').setDescription('Nova URL HTTPS do banner, ou "remover"').setMaxLength(500)
    )
    .addBooleanOption((o) =>
      o.setName('ativo').setDescription('Produto aparece no catálogo?')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: 'Use este comando dentro do servidor.', ephemeral: true });
    }

    const bannerInput = interaction.options.getString('banner');
    if (
      bannerInput &&
      bannerInput.toLowerCase() !== 'remover' &&
      !/^https:\/\//i.test(bannerInput)
    ) {
      return interaction.reply({
        content: '❌ O banner precisa ser uma URL HTTPS ou a palavra `remover`.',
        ephemeral: true
      });
    }

    const patch = {};
    const newName = interaction.options.getString('novo_nome');
    const price = interaction.options.getNumber('preco');
    const description = interaction.options.getString('descricao');
    const category = interaction.options.getString('categoria');
    const active = interaction.options.getBoolean('ativo');

    if (newName !== null) patch.name = newName;
    if (price !== null) patch.price = price;
    if (description !== null) patch.description = description;
    if (category !== null) patch.category = category;
    if (bannerInput !== null) patch.bannerUrl = bannerInput.toLowerCase() === 'remover' ? '' : bannerInput;
    if (active !== null) patch.active = active;

    if (!Object.keys(patch).length) {
      return interaction.reply({
        content: '⚠️ Informe pelo menos um campo para alterar.',
        ephemeral: true
      });
    }

    const product = updateProduct(
      interaction.guild.id,
      interaction.options.getString('produto', true),
      patch
    );

    if (!product) {
      return interaction.reply({ content: '❌ Produto não encontrado.', ephemeral: true });
    }

    await interaction.reply({
      content: `✅ Produto **${product.name}** atualizado.`,
      ephemeral: true
    });
  }
};
