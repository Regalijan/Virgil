const config = require('./config.json')
const crypto = require('crypto')
const db = require('./database')
const Discord = require('discord.js')
const fs = require('fs')
const verifier = require('./verify')
const client = new Discord.Client({ disableMentions: 'everyone', ws: { intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_BANS', 'GUILD_MESSAGES', 'GUILD_VOICE_STATES', 'DIRECT_MESSAGES'] } })
client.commands = new Discord.Collection()
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))
for (const file of commandFiles) {
  const command = require(`./commands/${file}`)
  client.commands.set(command.name, command)
}
client.login(config.token)
let lastlogtime
client.once('ready', () => {
  console.log('Virgil has started!')
})

const keypathexists = fs.existsSync('./servicekeys')
if (!keypathexists) fs.mkdirSync('./servicekeys')

async function getApp () {
  return await client.fetchApplication()
}

const app = getApp()
module.exports = app
client.on('message', async message => {
  if (message.content.match(/discord\.gg\/\S*|discord\.com\/invite\/\S*|discordapp\.com\/invite\/\S*/gim)) {
    await onInvite(message)
    return
  }
  const ignored = await db.query('SELECT * FROM ignored WHERE snowflake = $1 AND type = \'command\';', [message.channel.id])
  if (ignored.rowCount > 0 && message.channel.type !== 'dm' && !message.member.hasPermission('MANAGE_MESSAGES')) return
  message.attachments.forEach(async att => {
    if (att.url.endsWith('.exe' || '.msi' || '.apk' || '.appx' || '.bat' || '.cmd' || '.ps1' || '.dmg' || '.pkg' || '.apk' || '.ipa' || '.deb' || '.rpm' || '.js' || '.har') && message.channel.type === 'text' && !message.member.hasPermission('MANAGE_GUILD')) return await message.delete()
  })
  if (!message.content.startsWith(config.prefix) || message.author.bot) return
  const args = message.content.slice(config.prefix.length).trim().split(/ +/)
  const command = args.shift().toLowerCase()
  if (!client.commands.has(command)) return
  if (message.channel.type !== 'dm') {
    const mee6 = message.guild.members.cache.find(m => m.id === '159985870458322944')
    if (mee6) return await message.channel.send('MEE6 has been detected in your server! If you are a server admin, please remove MEE6 before continuing to use my services.')
  }
  if (command.guildOnly && message.channel.type === 'dm') return
  if (!message.channel.type === 'dm' && !message.guild.me.hasPermission('SEND_MESSAGES')) return
  try {
    client.commands.get(command).execute(message, args)
  } catch (error) {
    console.error(error)
  }
})

client.on('guildMemberAdd', async member => {
  if (!member.guild || !member.guild.available) return
  if (member.id === '159985870458322944') await member.guild.owner.send('MEE6 has been detected in your server! Please remove MEE6 before continuing to use my services.').catch(() => {})
  try {
    let serversettings = await db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [member.guild.id])
    serversettings = serversettings.rows[0]
    if (!serversettings.join_log_channel) return
    const channel = member.guild.channels.cache.find(ch => ch.id === serversettings.join_log_channel.toString())
    if (!channel) return
    const embed = new Discord.MessageEmbed()
      .setAuthor('Member Joined', member.user.displayAvatarURL())
      .setDescription(`${member} ${member.user.tag}`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setColor(3756250)
      .addField('Registration Date', new Intl.DateTimeFormat(member.guild.preferredLocale, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(new Date(member.user.createdTimestamp)))
      .setFooter(`ID: ${member.id}`)
    await channel.send(embed)
    if (member.bot) return
    const dmtext = `Thank you for joining ${member.guild.name}! Due to our security settings,`
    const secLevel = member.guild.verificationLevel
    if (secLevel === 'MEDIUM' && member.joinedTimestamp - member.user.createdTimestamp < 300000) return member.send(`${dmtext} you must wait 5 minutes befire chatting`)
    if (secLevel === 'HIGH') return member.send(`${dmtext} you must wait 10 minutes before speaking if you do not have a verified phone number, after which you may verify yourself.`).catch(() => {})
    if (secLevel === 'VERY_HIGH') return member.send(`${dmtext} you must verify your phone number before chatting. You may verify after doing so (or if you have already done so).`).catch(() => {})
    const success = await verifier.onjoin(member)
    if (success) member.send(`Thank you for joining ${member.guild.name}! You were automatically verified.`).catch(() => {})
  } catch (e) {
    console.error(e)
  }
})

client.on('guildMemberRemove', async member => {
  if (!member.guild.available) return
  const mee6 = member.guild.members.cache.find(m => m.id === '159985870458322944')
  if (mee6) return
  try {
    let serversettings = await db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [member.guild.id])
    serversettings = serversettings.rows[0]
    if (!serversettings.join_log_channel) return
    const channel = member.guild.channels.cache.find(ch => ch.id === serversettings.join_log_channel.toString())
    if (!channel) return
    const embed = new Discord.MessageEmbed()
      .setAuthor('Member Left', member.user.displayAvatarURL())
      .setDescription(`${member} ${member.user.username}#${member.user.discriminator}`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setColor(16711680)
      .setFooter(`ID: ${member.id}`)
    channel.send(embed)
  } catch (e) {
    console.error(e)
  }
})

client.on('guildBanAdd', async (guild, user) => {
  if (!guild.available) return
  const mee6 = guild.members.cache.find(m => m.id === '159985870458322944')
  if (mee6) return
  try {
    let serversettings = await db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [guild.id])
    serversettings = serversettings.rows[0]
    if (!serversettings.ban_log_channel) return
    const channel = guild.channels.cache.find(ch => ch.id === serversettings.ban_log_channel.toString())
    if (!channel) return
    const embed = new Discord.MessageEmbed()
      .setAuthor('Member Banned', user.displayAvatarURL())
      .setDescription(`${user} ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setColor(16711680)
      .setFooter(`ID: ${user.id}`)
    channel.send(embed)
  } catch (e) {
    console.error(e)
  }
})

client.on('guildBanRemove', async (guild, user) => {
  if (!guild.available) return
  const mee6 = guild.members.cache.find(m => m.id === '159985870458322944')
  if (mee6) return
  try {
    let serversettings = await db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [guild.id])
    serversettings = serversettings.rows[0]
    if (!serversettings.ban_log_channel) return
    const channel = guild.channels.cache.find(ch => ch.id === serversettings.ban_log_channel.toString())
    if (!channel) return
    const embed = new Discord.MessageEmbed()
      .setAuthor('Member Unbanned', user.displayAvatarURL())
      .setDescription(`${user} ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .setColor(3756250)
      .setFooter(`ID: ${user.id}`)
    channel.send(embed)
  } catch (e) {
    console.error(e)
  }
})

client.on('messageDelete', async message => {
  if (message.channel.type === 'dm' || !message.guild.available) return
  if (message.author.bot) return
  const mee6 = message.guild.members.cache.find(m => m.id === '159985870458322944')
  if (mee6) return
  try {
    const snowflakecheck = await db.query('SELECT * FROM ignored WHERE snowflake = $1 OR snowflake = $2;', [message.channel.id, message.channel.parent.id])
    if (snowflakecheck.rowCount > 0 && snowflakecheck.rows[0].type !== 'command') return
    let serversettings = await db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [message.guild.id])
    serversettings = serversettings.rows[0]
    if (!serversettings.delete_log_channel) return
    const channel = message.guild.channels.cache.find(ch => ch.id === serversettings.delete_log_channel.toString())
    if (!channel) return
    let auditlogs = await message.guild.fetchAuditLogs({ limit: 1, type: 72 })
    auditlogs = auditlogs.entries.first()
    let messagecontent = `Message ${message.id} deleted from ${message.channel}`
    if (auditlogs.createdTimestamp !== lastlogtime && Date.now() - auditlogs.createdTimestamp < 5000) {
      if (auditlogs.executor) messagecontent += `by \`${auditlogs.executor.tag}\``
      lastlogtime = auditlogs.createdTimestamp
    }
    if (message.content) {
      messagecontent += `\n**Content:** ${message.content}`
    }
    if (messagecontent.length > 1800) messagecontent = messagecontent.substr(0, 1799) + '...'
    const embed = new Discord.MessageEmbed()
      .setAuthor(`${message.author.username}#${message.author.discriminator} (${message.author.id})`, message.author.displayAvatarURL())
      .setDescription(messagecontent)
      .setColor(3756250)
    if (message.attachments) {
      message.attachments.forEach(attachment => {
        embed.addField('Attachment', `[Link to Attachment](${attachment.url})`, true)
      })
    }
    channel.send(embed).catch(e => console.error(e))
  } catch (e) {
    console.error(e)
  }
})

client.on('messageUpdate', async (oldMessage, newMessage) => {
  if (newMessage.channel.type === 'dm' || !newMessage.guild.available) return
  const mee6 = newMessage.guild.members.cache.find(m => m.id === '159985870458322944')
  if (mee6) return
  if ((oldMessage.content) && (newMessage.content) && (!newMessage.author.bot) && (oldMessage.content !== newMessage.content)) {
    try {
      const snowflakecheck = await db.query('SELECT * FROM ignored WHERE snowflake = $1 OR snowflake = $2;', [newMessage.channel.id, newMessage.channel.parent.id])
      if (snowflakecheck.rowCount > 0 && snowflakecheck.rows[0].type !== 'command') return
      let serversettings = await db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [newMessage.guild.id])
      serversettings = serversettings.rows[0]
      if (!serversettings.edit_log_channel) return
      const channel = oldMessage.guild.channels.cache.find(ch => ch.id === serversettings.edit_log_channel.toString())
      const embed = new Discord.MessageEmbed()
        .setAuthor(`${oldMessage.author.username}#${oldMessage.author.discriminator} (${oldMessage.author.id})`, oldMessage.author.displayAvatarURL())
        .setDescription(`**Message edited in** ${oldMessage.channel} [Go to message](${oldMessage.url})`)
        .addField('Before', oldMessage.content)
        .addField('After', newMessage.content)
        .setColor(3756250)
      channel.send(embed).catch(e => console.error(e))
    } catch (e) {
      console.error(e)
    }
  }
})

client.on('messageDeleteBulk', async (messages) => {
  let channel
  const mee6 = messages.first().guild.members.cache.find(m => m.id === '159985870458322944')
  if (mee6) return
  messages.findKey(m => { channel = m.channel })
  if (!channel.guild.available) return
  let serversettings = await db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [channel.guild.id])
  serversettings = serversettings.rows[0]
  const ignorecheck = await db.query('SELECT * FROM ignored WHERE snowflake = $1 OR snowflake = $2;', [channel.id, channel.parent.id])
  if (ignorecheck.rowCount > 0 && ignorecheck.rows[0].type !== 'command') return
  if (!serversettings.delete_log_channel) return
  let contents = `BULK DELETE - ${Date()}`
  messages.each(m => { contents += `\n\n[${m.author.id}](${m.author.tag}) ${m.createdAt}: ${m.content}` })
  const fileName = `./bulk-${crypto.randomBytes(16).toString('hex')}.txt`
  try {
    fs.writeFileSync(fileName, contents)
  } catch (e) {
    return console.error(e)
  }
  const logchannel = channel.guild.channels.cache.find(ch => ch.id === serversettings.delete_log_channel.toString())
  if (!logchannel) return
  const file = new Discord.MessageAttachment(fileName)
  const embed = new Discord.MessageEmbed()
    .setAuthor('Bulk Delete')
    .setTitle('Virgil Message Logging')
    .setColor(3756250)
    .setDescription(`Bulk delete for ${channel}`)
    .attachFiles(file)
  await logchannel.send(embed)
  fs.unlink(fileName, err => { if (err) return console.error(err) })
})

client.on('voiceStateUpdate', async (oldState, newState) => {
  if (!newState.guild.available) return
  const mee6 = newState.guild.members.cache.find(m => m.id === '159985870458322944')
  if (mee6) return
  let serversettings = await db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [newState.guild.id])
  serversettings = serversettings.rows[0]
  if (!serversettings.voice_log_channel) return
  let change
  let color = 3756250
  if (oldState.channel && !newState.channel) {
    change = `left \`#${oldState.channel.name}\``
    color = 16711680
  } else if (!oldState.channel && newState.channel) change = `joined \`#${newState.channel.name}\``
  else if (oldState.channel.id !== newState.channel.id) change = `switched from \`#${oldState.channel.name}\` to \`#${newState.channel.name}\``
  else if (oldState.selfDeaf !== newState.selfDeaf) {
    if (newState.selfDeaf) {
      change = 'deafened themself'
      color = 16711680
    } else change = 'undeafened themself'
  } else if (oldState.selfMute !== newState.selfMute) {
    if (newState.selfMute) {
      change = 'muted themself'
      color = 16711680
    } else change = 'unmuted themself'
  } else if (oldState.serverDeaf !== newState.serverDeaf) {
    if (newState.serverDeaf) {
      change = 'was server deafened'
      color = 16711680
    } else change = 'no longer server deafened'
  } else if (oldState.serverMute !== newState.serverMute) {
    if (newState.serverMute) {
      change = 'was server muted'
      color = 16711680
    } else change = 'no longer server muted'
  }
  const channel = newState.guild.channels.cache.find(ch => ch.id === serversettings.voice_log_channel.toString())
  const embed = new Discord.MessageEmbed()
    .setAuthor(newState.member.user.tag, newState.member.user.displayAvatarURL())
    .setDescription(`${newState.member} ${change}`)
    .setColor(color)
    .setFooter(`ID: ${newState.member.id}`)
  await channel.send(embed).catch(e => console.error(e))
})

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  if (!newMember.guild.available) return
  const mee6 = newMember.guild.members.cache.find(m => m.id === '159985870458322944')
  if (mee6 && !mee6.deleted) return
  let serversettings = await db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [newMember.guild.id])
  serversettings = serversettings.rows[0]
  if (oldMember.nickname !== newMember.nickname) {
    if (!serversettings.nickname_log_channel) return
    const channel = newMember.guild.channels.cache.find(c => c.id === serversettings.nickname_log_channel.toString())
    if (!channel) return
    const oldnick = oldMember.nickname || 'None'
    const newnick = newMember.nickname || 'None'
    const embed = new Discord.MessageEmbed()
      .setAuthor(newMember.user.tag, newMember.user.displayAvatarURL())
      .setColor(3756250)
      .setDescription(`**Nickname Change**\n\`${oldnick}\` -> \`${newnick}\``)
    await channel.send(embed)
  } else if (oldMember.roles.cache !== newMember.roles.cache) {
    if (!serversettings.role_log_channel) return
    const channel = newMember.guild.channels.cache.find(c => c.id === serversettings.role_log_channel.toString())
    if (!channel) return
    const notdeleted = oldMember.roles.cache.every(role => !role.deleted)
    if (!notdeleted) return
    const embed = new Discord.MessageEmbed()
      .setAuthor(newMember.user.tag, newMember.user.displayAvatarURL())
      .setColor(3756250)
      .setTitle('Roles Updated')
    let diff = ''
    let oldroles = ''
    oldMember.roles.cache.each(role => { oldroles += `<@&${role.id}> ` })
    embed.addField('Old Roles', oldroles)
    if (oldMember.roles.cache.size > newMember.roles.cache.size) {
      oldMember.roles.cache.each(role => { if (!newMember.roles.cache.get(role.id)) diff += `<@&${role.id}> ` })
      if (!diff) return
      embed.addField('Roles Removed', diff)
    } else {
      newMember.roles.cache.each(role => { if (!oldMember.roles.cache.get(role.id)) diff += `<@&${role.id}> ` })
      if (!diff) return
      embed.addField('Roles Added', diff)
    }
    await channel.send(embed)
  }
})

client.on('channelCreate', async channel => {
  if (channel.type === 'dm') return
  const mee6 = channel.guild.members.cache.find(m => m.id === '159985870458322944')
  if (mee6) return
  let serversettings = await db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [channel.guild.id])
  if (serversettings.rowCount === 0) return
  serversettings = serversettings.rows[0]
  if (!serversettings.channel_log_channel) return
  const logchannel = channel.guild.channels.cache.find(c => c.id === serversettings.channel_log_channel.toString())
  if (!logchannel) return
  let auditlogs
  if (channel.guild.me.hasPermission('VIEW_AUDIT_LOG')) auditlogs = await channel.guild.fetchAuditLogs({ limit: 1, type: 10 })
  if (auditlogs) auditlogs = auditlogs.entries.first()
  const embed = new Discord.MessageEmbed()
    .setColor(3756250)
    .setDescription(`Channel \`${channel.name}\` has been created.`)
  if (auditlogs) embed.setAuthor(auditlogs.executor.tag, auditlogs.executor.displayAvatarURL())
  await logchannel.send(embed)
})

client.on('channelDelete', async channel => {
  if (channel.type === 'dm') return
  const mee6 = channel.guild.members.cache.find(m => m.id === '159985870458322944')
  if (mee6) return
  let serversettings = await db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [channel.guild.id])
  if (serversettings.rowCount === 0) return
  serversettings = serversettings.rows[0]
  if (!serversettings.channel_log_channel) return
  const logchannel = channel.guild.channels.cache.find(c => c.id === serversettings.channel_log_channel.toString())
  if (!logchannel) return
  let auditlogs
  if (channel.guild.me.hasPermission('VIEW_AUDIT_LOG')) auditlogs = await channel.guild.fetchAuditLogs({ limit: 1, type: 12 })
  if (auditlogs) auditlogs = auditlogs.entries.first()
  const embed = new Discord.MessageEmbed()
    .setColor(16711680)
    .setDescription(`Channel \`${channel.name}\` has been deleted.`)
  if (auditlogs) embed.setAuthor(auditlogs.executor.tag, auditlogs.executor.displayAvatarURL())
  await logchannel.send(embed)
})

client.on('channelUpdate', async (oldChannel, newChannel) => {
  if (!oldChannel || !newChannel) return
  if (newChannel.type === 'dm') return
  const mee6 = newChannel.guild.members.cache.find(m => m.id === '159985870458322944')
  if (mee6) return
  let serversettings = await db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [newChannel.guild.id])
  if (serversettings.rowCount === 0) return
  serversettings = serversettings.rows[0]
  if (!serversettings.channel_log_channel) return
  const logchannel = newChannel.guild.channels.cache.find(c => c.id === serversettings.channel_log_channel.toString())
  if (!logchannel) return
  let auditlog
  if (newChannel.guild.me.hasPermission('VIEW_AUDIT_LOG')) auditlog = await newChannel.guild.fetchAuditLogs({ limit: 1, type: 11 })
  if (auditlog) auditlog = auditlog.entries.first()
  let text = `Channel \`${newChannel.name}\` updated!`
  if (newChannel.name !== oldChannel.name) text += `\nChannel renamed from \`${oldChannel.name}\` to \`${newChannel.name}\``
  if (oldChannel.position !== newChannel.position) text += `\nChannel position changed from \`${oldChannel.position}\` to \`${newChannel.position}\``
  const embed = new Discord.MessageEmbed()
    .setColor(3756250)
    .setDescription(text)
  if (auditlog) embed.setAuthor(auditlog.executor.tag, auditlog.executor.displayAvatarURL())
})

client.on('roleCreate', async role => {
  const mee6 = role.guild.members.cache.find(m => m.id === '159985870458322944')
  if (mee6) return
  let serversettings = await db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [role.guild.id])
  if (serversettings.rowCount === 0) return
  serversettings = serversettings.rows[0]
  if (!serversettings.role_log_channel) return
  const channel = role.guild.channels.cache.find(c => c.id === serversettings.role_log_channel.toString())
  if (!channel) return
  const embed = new Discord.MessageEmbed()
    .setTitle('Role Created')
    .setDescription(`Role \`${role.name}\` has been created.`)
    .setColor(3756250)
  let auditlog
  if (role.guild.me.hasPermission('VIEW_AUDIT_LOG')) auditlog = await role.guild.fetchAuditLogs({ limit: 1, type: 30 })
  if (auditlog) {
    auditlog = auditlog.entries.first()
    if (Date.now() - auditlog.createdTimestamp < 3000) embed.setAuthor(auditlog.executor.tag, auditlog.executor.displayAvatarURL())
  }
  await channel.send(embed)
})

client.on('roleDelete', async role => {
  const mee6 = role.guild.members.cache.find(m => m.id === '159985870458322944')
  if (mee6) return
  let serversettings = await db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [role.guild.id])
  if (serversettings.rowCount === 0) return
  serversettings = serversettings.rows[0]
  const channel = role.guild.channels.cache.find(c => c.id === serversettings.role_log_channel.toString())
  if (!channel) return
  const embed = new Discord.MessageEmbed()
    .setTitle('Role Deleted')
    .setDescription(`Role \`${role.name}\` has been deleted.`)
    .setColor(16711680)
  if (role.guild.me.hasPermission('VIEW_AUDIT_LOG')) {
    let auditlog = await role.guild.fetchAuditLogs({ limit: 1, type: 32 })
    auditlog = auditlog.entries.first()
    if (Date.now() - auditlog.createdTimestamp < 3000) embed.setAuthor(auditlog.executor.tag, auditlog.executor.displayAvatarURL())
  }
  await channel.send(embed)
})

client.on('guildCreate', async guild => {
  const mee6 = guild.members.cache.find(m => m.id === '159985870458322944')
  if (mee6) {
    await guild.owner.send('MEE6 has been detected in your server, please remove it before readding me.').catch(() => {})
    return await guild.leave()
  }
  const settingscheck = await db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [guild.id])
  if (settingscheck.rowCount > 0) return
  await db.query('INSERT INTO core_settings(guild_id) VALUES($1);', [guild.id])
  await db.query('INSERT INTO gamemod_settings(guild,files_are_public) VALUES($1,\'f\');', [guild.id])
})

client.on('invalidated', () => {
  console.log('SESSION WAS INVALIDATED, THIS SHOULD NEVER HAPPEN!')
  process.exit()
})

client.on('error', e => {
  console.error(e)
})

client.on('shardError', error => {
  console.error(error)
})

async function onInvite (message) {
  if (message.channel.type === 'dm' || message.author.bot) return
  let serversettings = await db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [message.guild.id])
  if (serversettings.rowCount === 0) return
  serversettings = serversettings.rows[0]
  if (!serversettings.invite_log_channel) return
  const channel = message.guild.channels.cache.find(c => c.id === serversettings.invite_log_channel.toString())
  if (!channel) return
  const invites = message.content.match(/discord\.gg\/\S*|discord\.com\/invite\/\S*|discordapp\.com\/invite\/\S*/gim)
  invites.forEach(async inv => {
    try {
      const invite = await message.client.fetchInvite(inv)
      if (invite.guild.id !== message.guild.id) {
        const embed = new Discord.MessageEmbed()
          .setAuthor(message.author.tag, message.author.displayAvatarURL())
          .setDescription(`**Invite posted for ${invite.guild.name}** ${message.channel}\n${inv}`)
          .addFields(
            { name: 'Inviter', value: invite.inviter.tag, inline: true },
            { name: 'Channel', value: `${invite.channel}`, inline: true },
            { name: 'Members', value: `${invite.memberCount}`, inline: true }
          )
          .setFooter(`ID: ${message.author.id}`)
        await channel.send(embed)
      }
    } catch {}
  })
  if (!message.guild.me.hasPermission('MANAGE_MESSAGES')) return
  for (let i = 0; i < invites.length; i++) {
    const invt = await message.client.fetchInvite(invites[i])
    if (invt.guild.id !== message.guild.id && !message.member.hasPermission('MANAGE_GUILD')) {
      message.delete({ reason: 'Invite(s) detected' })
      return
    }
  }
}

async function changeStatus () {
  const { statuses } = require('./statuses.json')
  const index = Math.round(Math.random() * (statuses.length - 1))
  await client.user.setPresence({ activity: { type: 'PLAYING', name: statuses[index] } })
}

setInterval(changeStatus, 60000)

process.on('unhandledRejection', error => console.error('Uncaught Promise Rejection', error))

process.on('SIGTERM', () => {
  client.destroy()
  process.exit()
})

process.on('SIGHUP', () => {
  client.destroy()
  process.exit()
})

process.on('SIGINT', () => {
  client.destroy()
  process.exit()
})

db.connect().catch(e => {
  console.error(e)
  process.exit()
})
