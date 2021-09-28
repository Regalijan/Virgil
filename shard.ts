import { config as dotenv } from 'dotenv'
import { readdirSync } from 'fs'
import { join } from 'path'
import {
  ApplicationCommandData,
  Client,
  CommandInteraction,
  GuildMember,
  Interaction,
  MessageEmbed,
  PermissionResolvable,
  ShardClientUtil,
  TextChannel
} from 'discord.js'
import Sentry from './sentry'
import db from './mongo'

db.connect()
dotenv()

const cmds: Map<string, {
  name: string,
  permissions?: PermissionResolvable[],
  interactionData: ApplicationCommandData,
  privileged?: boolean,
  exec (i: CommandInteraction): Promise<void>
}> = new Map()

for (const file of readdirSync(join(__dirname, 'commands')).filter(f => f.endsWith('.js'))) {
  const commandFile = require(`./commands/${file}`)
  cmds.set(commandFile.name, commandFile)
}

const bot = new Client({
  intents: 519
})

bot.login().catch(e => {
  console.error(e)
  process.exit()
})

const mongo = db.db('bot')

if (process.env.ENABLEDEBUG) bot.on('debug', function (m) {
  console.log(m)
})

bot.once('ready', function (client) {
  console.log(`Shard ${client.shard?.ids[0]} ready with ${client.guilds.cache.size} guilds.`)
})

bot.on('interactionCreate', async function (i: Interaction): Promise<void> {
  if (!i.isCommand() || !cmds.has(i.commandName)) return
  try {
    const command = cmds.get(i.commandName)
    if (!i.channel || !['GUILD_PRIVATE_THREAD', 'GUILD_PUBLIC_THREAD', 'GUILD_TEXT'].includes(i.channel.type)) {
      await i.reply({ content: 'Hey! You can\'t run commands here! They may only be run in a thread or a standard text channel.', ephemeral: true }).catch(e => console.error(e))
      return
    }

    const interactionUser = await i.guild?.members.fetch(i.user.id)
    if (command?.permissions?.length && !interactionUser?.permissions.has(command.permissions)) {
      await i.reply({ content: 'You cannot run this command!', ephemeral: true }).catch(e => console.error(e))
      return
    }

    await command?.exec(i)
    if (!command?.privileged) return
    const settings = await mongo.collection('settings').findOne({ guild: i.guild?.id })
    if (!settings?.commandLogChannel) return
    const logChannel = await i.guild?.channels.fetch(settings.commandLogChannel).catch(e => console.error(e))
    if (!logChannel || logChannel.type !== 'GUILD_TEXT' || !bot.user || !logChannel.permissionsFor(bot.user.id)?.has('SEND_MESSAGES')) return
    const embed = new MessageEmbed({
      author: {
        name: i.user.tag,
        iconURL: i.user.displayAvatarURL({ dynamic: true })
      },
      description: `Ran the \`${command.name}\` command.`
    })
    if (i.member instanceof GuildMember) embed.setColor(i.member.displayColor)
    await logChannel.send({ embeds: [embed] }).catch(e => console.error(e))
  } catch (e) {
    console.error(e)
    const eventId = Sentry.captureException(e)
    await i.reply({ content: `Oops! An error occured when running this command! If you contact the developer, give them this information: \`Event ID: ${eventId}\``, ephemeral: true }).catch(e => console.error(e))
  }
})

bot.on('channelCreate', async function (channel): Promise<void> {
  const settings = await mongo.collection('settings').findOne({ guild: channel.guild.id }).catch(e => console.error(e))
  if (!settings?.channelCreateLogChannel) return
  const logChannel = await channel.guild.channels.fetch(settings.channelCreateLogChannel).catch(e => console.error(e))
  if (!logChannel || logChannel.type !== 'GUILD_TEXT' || !channel.guild.me || !channel.permissionsFor(channel.guild.me.id)?.has('SEND_MESSAGES')) return
  const embed = new MessageEmbed()
    .setDescription(`${channel} has been created.`)
  if (settings.embedColor) embed.setColor(settings.embedColor)
  if (channel.guild.me.permissions.has('VIEW_AUDIT_LOG')) {
    const auditlogs = await channel.guild.fetchAuditLogs({ limit: 1, type: 10 }).catch(e => console.error(e))
    if (auditlogs?.entries.size) {
      const auditEntry = auditlogs.entries.first()
      embed.setAuthor(`${auditEntry?.executor?.tag}`, auditEntry?.executor?.displayAvatarURL({ dynamic: true }))
    }
  }
  await logChannel.send({ embeds: [embed] }).catch(e => console.error(e))
})

bot.on('channelDelete', async function (channel): Promise<void> {
  if (channel.type === 'DM') return
  const settings = await mongo.collection('settings').findOne({ guild: channel.guild.id }).catch(e => console.error(e))
  if (!settings?.channelDeleteLogChannel) return
  const logChannel = await channel.guild.channels.fetch(settings.channelDeleteLogChannel).catch(e => console.error(e))
  if (!logChannel || logChannel.type !== 'GUILD_TEXT' || !channel.guild.me || !channel.permissionsFor(channel.guild.me.id)?.has('SEND_MESSAGES')) return
  const embed = new MessageEmbed()
    .setDescription(`${channel} has been deleted.`)
  if (settings.embedColor) embed.setColor(settings.embedColor)
  if (channel.guild.me.permissions.has('VIEW_AUDIT_LOG')) {
    const auditlogs = await channel.guild.fetchAuditLogs({ limit: 1, type: 12 }).catch(e => console.error(e))
    if (auditlogs?.entries.size) {
      const auditEntry = auditlogs.entries.first()
      embed.setAuthor(`${auditEntry?.executor?.tag}`, auditEntry?.executor?.displayAvatarURL({ dynamic: true }))
    }
  }
  await logChannel.send({ embeds: [embed] }).catch(e => console.error(e))
})

bot.on('channelUpdate', async function (oldChannel, newChannel): Promise<void> {
  if (newChannel.type === 'DM') return
  const settings = await mongo.collection('settings').findOne({ guild: newChannel.guild.id }).catch(e => console.error(e))
  if (!settings?.channelUpdateLogChannel) return
  const logChannel = await newChannel.guild.channels.fetch(settings.channelUpdateLogChannel).catch(e => console.error(e))
  if (!logChannel || logChannel.type !== 'GUILD_TEXT' || !newChannel.guild.me || !logChannel.permissionsFor(newChannel.guild.me).has('SEND_MESSAGES')) return
  const embed = new MessageEmbed()
    .setDescription(`${newChannel} has been updated. See audit logs for details.`)
  if (settings.embedColor) embed.setColor(settings.embedColor)
  if (newChannel.guild.me.permissions.has('VIEW_AUDIT_LOG')) {
    const auditlogs = await newChannel.guild.fetchAuditLogs({ limit: 1, type: 11 }).catch(e => console.error(e))
    if (auditlogs?.entries.size) {
      const auditEntry = auditlogs.entries.first()
      embed.setAuthor(`${auditEntry?.executor?.tag}`, auditEntry?.executor?.displayAvatarURL({ dynamic: true }))
    }
  }
  await logChannel.send({ embeds: [embed] }).catch(e => console.error(e))
})

bot.on('guildBanAdd', async function (ban): Promise<void> {
  const settings = await mongo.collection('settings').findOne({ guild: ban.guild.id }).catch(e => {
    console.error(e)
    Sentry.captureException(e)
  })
  if (!settings?.banLogChannel) return
  const banChannel = await ban.guild.channels.fetch(settings.banLogChannel).catch(e => {
    console.error(e)
    Sentry.captureException(e)
  })

  if (banChannel?.type !== 'GUILD_TEXT') return
  if (!ban.guild.me || !banChannel.permissionsFor(ban.guild.me).has('SEND_MESSAGES')) return

  const embed = new MessageEmbed()
    .setThumbnail('Member Banned')
    .setDescription(`<@${ban.user.id}> ${ban.user.tag}`)
    .addField('Reason', ban.reason ?? 'No reason provided')

  if (ban.guild.me?.permissions.has('VIEW_AUDIT_LOG')) {
    const auditEntry = (await ban.guild.fetchAuditLogs({ type: 22, limit: 1 }).catch(e => {
      console.error(e)
      Sentry.captureException(e)
    }))?.entries.first()
    if (auditEntry?.executor?.id === ban.guild.me.id) return
    embed.setAuthor(auditEntry?.executor?.tag ?? 'Unknown')
  }
  await banChannel.send({ embeds: [embed] }).catch(e => {
    console.error(e)
    Sentry.captureException(e)
  })
})

bot.on('guildCreate', async function (guild): Promise<void> {
  const existingSettings = await mongo.collection('settings').findOne({ guild: guild.id }).catch(e => console.error(e))
  if (typeof existingSettings === 'undefined' || existingSettings) return
  await mongo.collection('settings').insertOne({ guild: guild.id }).catch(e => console.error(e))
})

bot.on('guildMemberUpdate', async function (oldMember, newMember): Promise<void> {
  const settings = await mongo.collection('settings').findOne({ guild: newMember.guild.id }).catch(e => console.error(e))
  if (!settings) return
  const embed = new MessageEmbed()
  if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
    if (!settings.roleLogChannel) return
    const roleLogChannel = await newMember.guild.channels.fetch(settings.roleLogChannel)
    if (roleLogChannel?.type !== 'GUILD_TEXT') return
    if (!newMember.client.user || !roleLogChannel.permissionsFor(newMember.client.user.id)?.has('SEND_MESSAGES')) return
    embed.setTitle('Roles Updated')
    embed.setAuthor(newMember.user.tag, newMember.user.displayAvatarURL({ dynamic: true }))
    let oldrolesstring = ''
    oldMember.roles.cache.forEach(r => {
      oldrolesstring += ` <@&${r.id}>`
    })
    embed.addField('Old Roles', oldrolesstring)
    if (oldMember.roles.cache.size > newMember.roles.cache.size) {
      let rolesremoved = ''
      oldMember.roles.cache.each(r => {
        if (!newMember.roles.cache.has(r.id)) rolesremoved += ` <@&${r.id}>`
      })
      embed.addField('Roles Removed', rolesremoved)
    } else {
      let rolesadded = ''
      newMember.roles.cache.each(r => {
        if (!oldMember.roles.cache.has(r.id)) rolesadded += ` <@&${r.id}>`
      })
      embed.addField('Roles Added', rolesadded)
    }
    await roleLogChannel.send({ embeds: [embed] }).catch(e => {
      console.error(e)
      Sentry.captureException(e)
    })
  } else if (oldMember.nickname !== newMember.nickname) {
    if (!settings.nicknameLogChannel) return
    const nicknameLogChannel = await newMember.guild.channels.fetch(settings.nicknameLogChannel).catch(e => {
      console.error(e)
      Sentry.captureException(e)
    })
    if (nicknameLogChannel?.type !== 'GUILD_TEXT') return
    if (!newMember.client.user || !nicknameLogChannel.permissionsFor(newMember.client.user.id)?.has('SEND_MESSAGES')) return
    embed.setTitle('Nickname Updated')
    embed.setDescription(`\`${oldMember.nickname ?? 'None'}\` -> \`${newMember.nickname ?? 'None'}\``)
    await nicknameLogChannel.send({ embeds: [embed] }).catch(Sentry.captureException)
  }
})

bot.on('messageDelete', async function (message): Promise<void> {
  if (!message.guild || !message.author) return
  const settings = await mongo.collection('settings').findOne({ guild: message.guild.id }).catch(e => console.error(e))
  if (!settings?.deleteLogChannel) return
  const embed = new MessageEmbed()
    .setAuthor(`${message.author.tag} (${message.author.id})`, message.author.displayAvatarURL({ dynamic: true }))
    .setDescription(`Message ${message.id} deleted from <#${message.channel.id}>${message.thread ? ` - Thread ${message.thread.name}` : ''}${message.content ? `\n**Content:** ${message.content}` : ''}`)
  if (message.member) embed.setColor(message.member.displayColor)
  const channel = await message.guild.channels.fetch(settings.deleteLogChannel).catch(e => console.error(e))
  if (!(channel instanceof TextChannel)) return
  if (!message.client.user?.id) return
  if (!channel?.permissionsFor(message.client.user.id)?.has('SEND_MESSAGES')) return
  await channel.send({ embeds: [embed] }).catch(e => console.error(e))
})

bot.on('messageUpdate', async function (oldMessage, newMessage): Promise<void> {
  if (!oldMessage || !oldMessage.content || !oldMessage.author  || !newMessage.guild) return
  const settings = await mongo.collection('settings').findOne({ guild: newMessage.guild.id }).catch(e => console.error(e))
  if (!settings?.editLogChannel) return
  const embed = new MessageEmbed()
    .setAuthor(`${oldMessage.author.tag} (${oldMessage.author.id})`, oldMessage.author.displayAvatarURL({ dynamic: true }))
    .setDescription(`Message edited in <#${newMessage.channel.id}> [Go to message](${newMessage.url})`)
    .addFields(
      { name: 'Before', value: oldMessage.content ?? 'Unknown content' },
      { name: 'After', value: newMessage.content ?? 'Unknown content' }
    )
  const channel = await newMessage.guild.channels.fetch(settings.editLogChannel).catch(e => console.error(e))
  if (!channel || !(channel instanceof TextChannel) || !newMessage.client.user?.id || !channel.permissionsFor(newMessage.client.user.id)?.has('SEND_MESSAGES')) return
  await channel.send({ embeds: [embed] }).catch(e => console.error(e))
})

setInterval(async function (): Promise<void> {
  try {
    const bans = await mongo.collection('bans').find({ unban: { $lte: Date.now() } }).toArray()
    for (const ban of bans) {
      const shard = ShardClientUtil.shardIdForGuildId(ban.server, bot.shard?.count ?? 1)
      await bot.shard?.broadcastEval(async c => {
        const server = await c.guilds.fetch(ban.server).catch(() => {})
        if (!server || !server.me?.permissions.has('BAN_MEMBERS')) return
        const member = await server.bans.fetch(ban.user).catch(() => {})
        if (!member) return
        try {
          await server.bans.remove(member.user.id, 'Temporary ban expired.')
          await mongo.collection('bans').findOneAndDelete({ user: member.user.id })
        } catch (e) {
          console.error(e)
        }
      }, { shard: shard })
    }
  } catch(e) {
    console.error(e)
    return
  }
}, 30000)

process.on('SIGTERM', function () {
  bot.destroy()
  process.exit()
})

process.on('SIGINT', function () {
  bot.destroy()
  process.exit()
})

process.on('SIGHUP', function () {
  bot.destroy()
  process.exit()
})