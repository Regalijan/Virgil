import { config as dotenv } from 'dotenv'
import { readdirSync } from 'fs'
import { join } from 'path'
import {
  ApplicationCommandData,
  Client,
  CommandInteraction,
  Interaction,
  MessageEmbed,
  PermissionResolvable,
  ShardClientUtil
} from 'discord.js'
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

const mongo = db.db()

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
      color: settings.commandLogColor ?? 3756250,
      description: `Ran the \`${command.name}\` command.`
    })
    await logChannel.send({ embeds: [embed] }).catch(e => console.error(e))
  } catch (e) {
    console.error(e)
    await i.reply({ content: `Oops! An error occured when running this command! If you contact the developer, give them this information: \`${e}\``, ephemeral: true }).catch(e => console.error(e))
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

setInterval(async function (): Promise<void> {
  try {
    const bansDoc = mongo.collection('bans').find({ unban: { $lte: Date.now() } })
    let bans: any[] = []

    bansDoc.forEach(function (ban) {
      bans.push(ban) // Callbacks suck
    })

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
