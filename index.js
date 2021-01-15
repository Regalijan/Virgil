const config = require('./config.json')
const crypto = require('crypto')
const db = require('./database')
const Discord = require('discord.js')
const fs = require('fs')
const verifier = require('./verify')
module.exports = {
  client: new Discord.Client({ disableMentions: 'everyone', ws: { intents: ['GUILDS', 'GUILD_MEMBERS', 'GUILD_BANS', 'GUILD_MESSAGES', 'GUILD_VOICE_STATES', 'DIRECT_MESSAGES'] } })
}
const client = module.exports.client
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

client.on('message', async message => {
  if (message.content.match(/discord\.gg\/\S*|discord\.com\/invite\/\S*|discordapp\.com\/invite\/\S*/gim)) {
    await onInvite(message)
    message.delete({ reason: 'Invite(s) detected' })
    return
  }
  const ignored = await db.query('SELECT * FROM ignored WHERE snowflake = $1 AND type = \'command\';', [message.channel.id])
  if (ignored.rowCount > 0 && message.type !== 'dm' && !message.member.hasPermission('MANAGE_MESSAGES')) return
  if (!message.content.startsWith(config.prefix) || message.author.bot) return
  const args = message.content.slice(config.prefix.length).trim().split(/ +/)
  const command = args.shift().toLowerCase()
  if (!client.commands.has(command)) return
  if (command.guildOnly && message.channel.type === 'dm') return
  try {
    client.commands.get(command).execute(message, args)
  } catch (error) {
    console.error(error)
  }
})

client.on('guildMemberAdd', async member => {
  if (!member.guild.available) return
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
    channel.send(embed)
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
  if (!message.guild.available) return
  if (message.channel.type === 'dm') return
  if (message.author.bot) return
  // TODO: Detect invites /(https?:\/\/w?w?w?\.?discord\.gg\/\S+|https?:\/\/w?w?w?\.?discord\.com\/invite\/\S+|https?:\/\/w?w?w?\.?discordapp\.com\/invite\/\S+)/g
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
  if (!newMessage.guild.available) return
  if ((oldMessage.content) && (newMessage.content) && (newMessage.channel.type !== 'dm') && (!newMessage.author.bot) && (oldMessage.content !== newMessage.content)) {
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
    .setDescription(`Bulk delete for ${channel}`)
    .attachFiles(file)
  await logchannel.send(embed)
  fs.unlink(fileName, err => { if (err) return console.error(err) })
})

client.on('voiceStateUpdate', async (oldState, newState) => {
  if (!newState.guild.available) return
  let serversettings = await db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [newState.guild.id])
  serversettings = serversettings.rows[0]
  if (!serversettings.voice_log_channel) return
  let change
  let color = 3756250
  if (oldState.channel && !newState.channel) {
    change = `left \`#${oldState.channel.name}\``
    color = 16711680
  } else if (!oldState.channel && newState.channel) change = `joined \`#${newState.channel.name}\``
  else if (oldState.channel.id === newState.channel.id) return
  else change = `switched from \`#${oldState.channel.name}\` to \`#${newState.channel.name}\``
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
  let serversettings = await db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [newMember.guild.id])
  serversettings = serversettings.rows[0]
  if (oldMember.nickname !== newMember.nickname) {
    if (!serversettings.nickname_log_channel) return
    const channel = newMember.guild.channels.cache.find(c => c.id === serversettings.nickname_log_channel.toString())
    if (!channel) return
    let oldnick = oldMember.nickname
    let newnick = newMember.nickname
    if (!oldnick) oldnick = 'None'
    if (!newnick) newnick = 'None'
    const embed = new Discord.MessageEmbed()
      .setAuthor(newMember.user.tag, newMember.user.displayAvatarURL())
      .setColor(3756250)
      .setDescription(`**Nickname Change**\n\`${oldnick}\` -> \`${newnick}\``)
    await channel.send(embed)
  } else if (oldMember.roles.cache !== newMember.roles.cache) {
    if (!serversettings.role_log_channel) return
    const channel = newMember.guild.channels.cache.find(c => c.id === serversettings.role_log_channel.toString())
    if (!channel) return
    const embed = new Discord.MessageEmbed()
      .setAuthor(newMember.user.tag, newMember.user.displayAvatarURL())
      .setColor(3756250)
      .setTitle('Roles Updated')
    let diff = ''
    const oldrs = []
    const newrs = []
    oldMember.roles.cache.forEach(async role => oldrs.push(role.id))
    newMember.roles.cache.forEach(async role => newrs.push(role.id))
    let oldroles = ''
    for (let i = 0; i < oldrs.length; i++) {
      oldroles += `<@&${oldrs[i]}> `
    }
    embed.addField('Old Roles', oldroles)
    if (oldrs.length > newrs.length) {
      for (let i = 0; i < oldrs.length; i++) {
        if (!newrs.includes(oldrs[i])) diff += `<@&${oldrs[i]}> `
      }
      embed.addField('Roles Removed', diff)
      await channel.send(embed)
    } else if (oldrs.length < newrs.length) {
      for (let i = 0; i < newrs.length; i++) {
        if (!oldrs.includes(newrs[i])) diff += `<@&${newrs[i]}> `
      }
      embed.addField('Roles Added', diff)
      await channel.send(embed)
    }
  }
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
  if (message.channel.type === 'dm') return
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
    } catch {}
  })
}

process.on('unhandledRejection', error => console.error('Uncaught Promise Rejection', error))
db.connect().catch(e => {
  console.error(e)
  process.exit()
})
