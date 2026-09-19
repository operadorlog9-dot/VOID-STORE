const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  UserSelectMenuBuilder,
  PermissionFlagsBits
} = require('discord.js');

const { getGuildState, findOrder, markOrderDelivered } = require('./storage');
const {
  parseTicketMeta,
  setTicketMeta,
  isStaffMember,
  logAction
} = require('./discord');

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function buildPanelSelect() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticket_panel_select')
      .setPlaceholder('Selecione um painel de opções')
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('Painel Staff')
          .setDescription('Ferramentas exclusivas para a equipe')
          .setEmoji('♟️')
          .setValue('staff'),
        new StringSelectMenuOptionBuilder()
          .setLabel('Painel Membro')
          .setDescription('Opções disponíveis para você')
          .setEmoji('👤')
          .setValue('member')
      )
  );
}

function buildStaffButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_staff_take')
      .setLabel('Assumir Ticket')
      .setEmoji('🎟️')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('ticket_staff_notify')
      .setLabel('Notificar')
      .setEmoji('🔔')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('ticket_staff_delivered')
      .setLabel('Marcar Entregue')
      .setEmoji('📦')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('ticket_staff_close_save')
      .setLabel('Deletar e Salvar')
      .setEmoji('🗑️')
      .setStyle(ButtonStyle.Danger)
  );
}

function buildMemberButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_member_add')
      .setLabel('Adicionar Participante')
      .setEmoji('➕')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('ticket_member_call')
      .setLabel('Chamar Atendente')
      .setEmoji('📣')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('ticket_member_close')
      .setLabel('Fechar Ticket')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Danger)
  );
}

async function sendTicketPanel(channel, requester, order = null) {
  const state = getGuildState(channel.guild.id);
  const brand = state.config.brandName || 'VOID STORE';

  const embed = new EmbedBuilder()
    .setColor(0x57f287)
    .setTitle(order ? '✅ Pedido Selecionado' : '🎫 Atendimento aberto')
    .setDescription(
      order
        ? `Ticket para tratar sobre o produto: **${order.productName}**`
        : 'Use o painel abaixo para continuar o atendimento.'
    )
    .addFields(
      { name: 'Cliente', value: `${requester}`, inline: true },
      ...(order
        ? [
            { name: 'Produto', value: order.productName, inline: true },
            { name: 'Valor', value: money(order.price), inline: true },
            { name: 'ID do Pedido', value: `\`${order.id}\`` }
          ]
        : [])
    )
    .setFooter({ text: brand })
    .setTimestamp();

  await channel.send({
    content: `${requester}`,
    embeds: [embed],
    components: [buildPanelSelect()]
  });
}

async function makeTranscript(channel) {
  const messages = await channel.messages.fetch({ limit: 100 }).catch(() => null);
  if (!messages) return null;

  const lines = [...messages.values()]
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
    .map((m) => {
      const text = m.content?.trim() || '[sem texto]';
      const attachments = [...m.attachments.values()].map((a) => a.url);
      return `[${new Date(m.createdTimestamp).toISOString()}] ${m.author?.tag || 'desconhecido'}: ${text}${attachments.length ? ` | anexos: ${attachments.join(', ')}` : ''}`;
    });

  return Buffer.from(lines.join('\n'), 'utf8');
}

async function closeAndSave(interaction) {
  const meta = parseTicketMeta(interaction.channel);
  if (!meta) {
    await interaction.reply({ content: '❌ Este canal não é um ticket.', ephemeral: true });
    return;
  }

  const allowed =
    interaction.user.id === meta.ownerId ||
    isStaffMember(interaction.guild, interaction.member) ||
    interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels);

  if (!allowed) {
    await interaction.reply({ content: '❌ Você não pode fechar este ticket.', ephemeral: true });
    return;
  }

  await interaction.reply('🔒 Ticket encerrado. Salvando registro e removendo o canal...');

  const transcript = await makeTranscript(interaction.channel);
  const files = transcript
    ? [{ attachment: transcript, name: `transcript-${interaction.channel.name}.txt` }]
    : [];

  await logAction(
    interaction.guild,
    `🔒 Ticket **${interaction.channel.name}** fechado por ${interaction.user.tag}.`,
    files
  );

  setTimeout(() => {
    interaction.channel.delete(`Ticket encerrado por ${interaction.user.tag}`).catch(() => null);
  }, 3500);
}

async function handlePanelSelect(interaction) {
  const meta = parseTicketMeta(interaction.channel);
  if (!meta) return false;
  if (interaction.customId !== 'ticket_panel_select') return false;

  const selected = interaction.values[0];

  if (selected === 'staff') {
    if (!isStaffMember(interaction.guild, interaction.member)) {
      await interaction.reply({
        content: '❌ Você não tem permissão para acessar o Painel Staff.',
        ephemeral: true
      });
      return true;
    }

    await interaction.reply({
      content: '**Painel da Equipe**\nSelecione uma ação abaixo:',
      components: [buildStaffButtons()],
      ephemeral: true
    });
    return true;
  }

  await interaction.reply({
    content: '**Painel do Membro**\nSelecione uma ação abaixo:',
    components: [buildMemberButtons()],
    ephemeral: true
  });
  return true;
}

async function handleUserSelect(interaction) {
  if (interaction.customId !== 'ticket_member_user_select') return false;

  const meta = parseTicketMeta(interaction.channel);
  if (!meta) return false;

  const allowed =
    interaction.user.id === meta.ownerId ||
    isStaffMember(interaction.guild, interaction.member);

  if (!allowed) {
    await interaction.reply({
      content: '❌ Apenas o dono do ticket ou a equipe pode adicionar participantes.',
      ephemeral: true
    });
    return true;
  }

  const userId = interaction.values[0];
  await interaction.channel.permissionOverwrites.edit(userId, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
    AttachFiles: true
  });

  await interaction.reply({
    content: `✅ <@${userId}> foi adicionado ao ticket.`,
    ephemeral: true
  });
  await logAction(
    interaction.guild,
    `➕ ${interaction.user.tag} adicionou <@${userId}> ao ticket ${interaction.channel}.`
  );
  return true;
}

async function handleButton(interaction) {
  const meta = parseTicketMeta(interaction.channel);
  if (!meta) return false;

  if (interaction.customId === 'ticket_staff_take') {
    if (!isStaffMember(interaction.guild, interaction.member)) {
      await interaction.reply({
        content: '❌ Você não tem permissão para assumir tickets.',
        ephemeral: true
      });
      return true;
    }

    if (meta.claimedBy && meta.claimedBy !== interaction.user.id) {
      await interaction.reply({
        content: `⚠️ Este ticket já foi assumido por <@${meta.claimedBy}>.`,
        ephemeral: true
      });
      return true;
    }

    await setTicketMeta(interaction.channel, { claimedBy: interaction.user.id });
    await interaction.reply(`🎟️ ${interaction.user} assumiu este atendimento.`);
    await logAction(
      interaction.guild,
      `🎟️ ${interaction.user.tag} assumiu ${interaction.channel}.`
    );
    return true;
  }

  if (interaction.customId === 'ticket_staff_notify') {
    if (!isStaffMember(interaction.guild, interaction.member)) {
      await interaction.reply({
        content: '❌ Você não tem permissão para notificar clientes.',
        ephemeral: true
      });
      return true;
    }

    const user = await interaction.client.users.fetch(meta.ownerId).catch(() => null);
    if (!user) {
      await interaction.reply({ content: '❌ Cliente não encontrado.', ephemeral: true });
      return true;
    }

    const sent = await user
      .send(`🔔 A equipe de **${interaction.guild.name}** está aguardando você no ticket ${interaction.channel}.`)
      .then(() => true)
      .catch(() => false);

    await interaction.reply({
      content: sent
        ? '✅ Cliente notificado por mensagem direta.'
        : '⚠️ Não consegui enviar DM. O cliente pode estar com mensagens diretas fechadas.',
      ephemeral: true
    });
    return true;
  }


  if (interaction.customId === 'ticket_staff_delivered') {
    if (!isStaffMember(interaction.guild, interaction.member)) {
      await interaction.reply({
        content: '❌ Você não tem permissão para marcar pedidos como entregues.',
        ephemeral: true
      });
      return true;
    }

    if (!meta.orderId) {
      await interaction.reply({
        content: '⚠️ Este ticket não está vinculado a um pedido.',
        ephemeral: true
      });
      return true;
    }

    const result = markOrderDelivered(
      interaction.guild.id,
      meta.orderId,
      interaction.user.id
    );

    if (!result.ok && result.reason === 'not_confirmed') {
      await interaction.reply({
        content: '⚠️ Confirme o pagamento antes de marcar o pedido como entregue.',
        ephemeral: true
      });
      return true;
    }

    if (!result.ok) {
      await interaction.reply({
        content: '❌ Pedido não encontrado.',
        ephemeral: true
      });
      return true;
    }

    await interaction.reply(
      `📦 Pedido \`${meta.orderId}\` marcado como **entregue** por ${interaction.user}.`
    );
    await logAction(
      interaction.guild,
      `📦 Pedido ${meta.orderId} marcado como entregue por ${interaction.user.tag}.`
    );
    return true;
  }

  if (interaction.customId === 'ticket_staff_close_save') {
    if (!isStaffMember(interaction.guild, interaction.member)) {
      await interaction.reply({
        content: '❌ Você não tem permissão para encerrar tickets como staff.',
        ephemeral: true
      });
      return true;
    }
    await closeAndSave(interaction);
    return true;
  }

  if (interaction.customId === 'ticket_member_add') {
    const allowed =
      interaction.user.id === meta.ownerId ||
      isStaffMember(interaction.guild, interaction.member);

    if (!allowed) {
      await interaction.reply({
        content: '❌ Apenas o dono do ticket ou a equipe pode adicionar participantes.',
        ephemeral: true
      });
      return true;
    }

    const row = new ActionRowBuilder().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId('ticket_member_user_select')
        .setPlaceholder('Escolha quem deseja adicionar')
        .setMinValues(1)
        .setMaxValues(1)
    );

    await interaction.reply({
      content: 'Selecione o usuário que deseja adicionar:',
      components: [row],
      ephemeral: true
    });
    return true;
  }

  if (interaction.customId === 'ticket_member_call') {
    const state = getGuildState(interaction.guild.id);
    const mention = state.config.staffRoleId
      ? `<@&${state.config.staffRoleId}>`
      : 'Equipe';

    await interaction.reply({
      content: `📣 ${mention}, ${interaction.user} solicitou atendimento.`
    });
    return true;
  }

  if (interaction.customId === 'ticket_member_close') {
    await closeAndSave(interaction);
    return true;
  }

  return false;
}

async function handleTicketComponent(interaction) {
  if (!interaction.inGuild()) return false;

  if (interaction.isStringSelectMenu()) return handlePanelSelect(interaction);
  if (interaction.isUserSelectMenu()) return handleUserSelect(interaction);
  if (interaction.isButton()) return handleButton(interaction);

  return false;
}

module.exports = {
  sendTicketPanel,
  handleTicketComponent,
  buildPanelSelect
};
