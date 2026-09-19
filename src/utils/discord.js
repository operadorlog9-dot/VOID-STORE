const { ChannelType, PermissionFlagsBits } = require('discord.js');
const config = require('../config/store');
const { getGuildState, updateGuildConfig } = require('./storage');

function normalizeTicketName(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'cliente';
}

function findCategory(guild, name) {
  return guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildCategory && c.name === name
  );
}

async function ensureRole(guild, name) {
  let role = guild.roles.cache.find((r) => r.name === name);
  if (!role) {
    role = await guild.roles.create({
      name,
      reason: 'Configuração automática da loja'
    });
  }
  return role;
}

async function getConfiguredRoles(guild) {
  const state = getGuildState(guild.id);

  let staffRole = state.config.staffRoleId
    ? guild.roles.cache.get(state.config.staffRoleId)
    : null;
  let buyerRole = state.config.buyerRoleId
    ? guild.roles.cache.get(state.config.buyerRoleId)
    : null;

  if (!staffRole) {
    staffRole = await ensureRole(guild, config.roles.staff);
    updateGuildConfig(guild.id, { staffRoleId: staffRole.id });
  }

  if (!buyerRole) {
    buyerRole = await ensureRole(guild, config.roles.buyer);
    updateGuildConfig(guild.id, { buyerRoleId: buyerRole.id });
  }

  return { staffRole, buyerRole };
}

async function ensureCategory(guild, name, staffOnly = false, staffRole = null) {
  let category = findCategory(guild, name);
  if (category) return category;

  const permissionOverwrites = staffOnly && staffRole
    ? [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: staffRole.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory
          ]
        }
      ]
    : [];

  category = await guild.channels.create({
    name,
    type: ChannelType.GuildCategory,
    permissionOverwrites,
    reason: 'Configuração automática da loja'
  });
  return category;
}

async function ensureTextChannel(guild, name, topic, parentId) {
  let channel = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && c.name === name
  );

  if (!channel) {
    channel = await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      topic,
      parent: parentId,
      reason: 'Configuração automática da loja'
    });
  } else if (!channel.parentId && parentId) {
    await channel.setParent(parentId).catch(() => null);
  }

  return channel;
}

async function logAction(guild, message, files = []) {
  const channel = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && c.name === 'logs'
  );
  if (channel) {
    await channel.send({ content: message, files }).catch(() => null);
  }
}

function parseTicketMeta(channel) {
  if (!channel?.topic?.startsWith('ticket-owner:')) return null;

  const meta = {};
  for (const part of channel.topic.split('|')) {
    const index = part.indexOf(':');
    if (index === -1) continue;
    meta[part.slice(0, index)] = part.slice(index + 1);
  }

  return {
    ownerId: meta['ticket-owner'] || null,
    orderId: meta.order && meta.order !== 'none' ? meta.order : null,
    claimedBy: meta.claimed && meta.claimed !== 'none' ? meta.claimed : null
  };
}

async function setTicketMeta(channel, patch) {
  const current = parseTicketMeta(channel);
  if (!current) return null;

  const next = {
    ownerId: patch.ownerId ?? current.ownerId,
    orderId: patch.orderId ?? current.orderId,
    claimedBy: patch.claimedBy ?? current.claimedBy
  };

  const topic = [
    `ticket-owner:${next.ownerId}`,
    `order:${next.orderId || 'none'}`,
    `claimed:${next.claimedBy || 'none'}`
  ].join('|');

  await channel.setTopic(topic).catch(() => null);
  return next;
}

function findOpenTicket(guild, userId) {
  return guild.channels.cache.find((c) => {
    if (c.type !== ChannelType.GuildText) return false;
    const meta = parseTicketMeta(c);
    return meta?.ownerId === userId;
  }) || null;
}

async function createTicket(guild, user, reason = 'Atendimento', options = {}) {
  const existing = findOpenTicket(guild, user.id);
  if (existing) return { channel: existing, created: false };

  const { staffRole } = await getConfiguredRoles(guild);

  let supportCategory = findCategory(guild, config.categories.suporte);
  if (!supportCategory) {
    supportCategory = await ensureCategory(guild, config.categories.suporte);
  }

  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles
      ]
    },
    {
      id: staffRole.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ManageMessages
      ]
    }
  ];

  const productPart = options.productName
    ? `${normalizeTicketName(options.productName)}-`
    : '';

  const channel = await guild.channels.create({
    name: `${productPart}${normalizeTicketName(user.username)}-${String(user.id).slice(-4)}`.slice(0, 95),
    type: ChannelType.GuildText,
    topic: [
      `ticket-owner:${user.id}`,
      `order:${options.orderId || 'none'}`,
      'claimed:none'
    ].join('|'),
    parent: supportCategory.id,
    permissionOverwrites: overwrites,
    reason: `Ticket: ${reason}`
  });

  return { channel, created: true };
}

function isStaffMember(guild, member) {
  if (!guild || !member) return false;
  if (
    member.permissions?.has(PermissionFlagsBits.Administrator) ||
    member.permissions?.has(PermissionFlagsBits.ManageGuild)
  ) {
    return true;
  }

  const state = getGuildState(guild.id);
  return Boolean(
    state.config.staffRoleId &&
    member.roles?.cache?.has(state.config.staffRoleId)
  );
}

module.exports = {
  ensureRole,
  getConfiguredRoles,
  ensureCategory,
  ensureTextChannel,
  logAction,
  createTicket,
  findCategory,
  findOpenTicket,
  parseTicketMeta,
  setTicketMeta,
  isStaffMember
};
