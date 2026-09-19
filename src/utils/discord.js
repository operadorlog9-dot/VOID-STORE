const { ChannelType, PermissionFlagsBits } = require('discord.js');
const config = require('../config/store');

function normalizeTicketName(username) {
  return username.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20) || 'cliente';
}

function findCategory(guild, name) {
  return guild.channels.cache.find((c) => c.type === ChannelType.GuildCategory && c.name === name);
}

async function ensureRole(guild, name) {
  let role = guild.roles.cache.find((r) => r.name === name);
  if (!role) role = await guild.roles.create({ name, reason: 'Configuração automática VOID STORE' });
  return role;
}

async function ensureCategory(guild, name, staffOnly = false, staffRole = null) {
  let category = findCategory(guild, name);
  if (category) return category;

  const permissionOverwrites = staffOnly && staffRole
    ? [
        { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: staffRole.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
        }
      ]
    : [];

  category = await guild.channels.create({
    name,
    type: ChannelType.GuildCategory,
    permissionOverwrites,
    reason: 'Configuração automática VOID STORE'
  });
  return category;
}

async function ensureTextChannel(guild, name, topic, parentId) {
  let channel = guild.channels.cache.find((c) => c.type === ChannelType.GuildText && c.name === name);
  if (!channel) {
    channel = await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      topic,
      parent: parentId,
      reason: 'Configuração automática VOID STORE'
    });
  } else if (!channel.parentId && parentId) {
    await channel.setParent(parentId).catch(() => null);
  }
  return channel;
}

async function logAction(guild, message) {
  const channel = guild.channels.cache.find((c) => c.type === ChannelType.GuildText && c.name === 'logs');
  if (channel) await channel.send({ content: message }).catch(() => null);
}

async function createTicket(guild, user, reason = 'Atendimento') {
  const existing = guild.channels.cache.find(
    (c) => c.type === ChannelType.GuildText && c.topic === `ticket-owner:${user.id}`
  );
  if (existing) return { channel: existing, created: false };

  const staffRole = guild.roles.cache.find((r) => r.name === config.roles.staff);
  let supportCategory = findCategory(guild, config.categories.suporte);
  if (!supportCategory) supportCategory = await ensureCategory(guild, config.categories.suporte);

  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: user.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
    }
  ];
  if (staffRole) {
    overwrites.push({
      id: staffRole.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
    });
  }

  const channel = await guild.channels.create({
    name: `ticket-${normalizeTicketName(user.username)}-${String(user.id).slice(-4)}`,
    type: ChannelType.GuildText,
    topic: `ticket-owner:${user.id}`,
    parent: supportCategory.id,
    permissionOverwrites: overwrites,
    reason: `Ticket VOID STORE: ${reason}`
  });

  return { channel, created: true };
}

module.exports = {
  ensureRole,
  ensureCategory,
  ensureTextChannel,
  logAction,
  createTicket,
  findCategory
};
