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
  if (message.channel.type === 'dm') return
  if (message.author.bot) return
  try {
    const snowflakecheck = await db.query('SELECT * FROM ignored WHERE snowflake = $1 OR snowflake = $2 AND WHERE NOT type = \'command\';', [message.channel.id, message.channel.parent.id])
    if (snowflakecheck.rowCount > 0) return
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
  if ((oldMessage.content) && (newMessage.content) && (newMessage.channel.type !== 'dm') && (!newMessage.author.bot) && (oldMessage.content !== newMessage.content)) {
    try {
      const snowflakecheck = await db.query('SELECT * FROM ignored WHERE snowflake = $1 OR snowflake = $2 AND WHERE NOT type = \'command\';', [newMessage.channel.id, newMessage.channel.parent.id])
      if (snowflakecheck.rowCount > 0) return
      let serversettings = await db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [newMessage.guild.id])
      serversettings = serversettings.rows[0]
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
  let serversettings = await db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [channel.guild.id])
  serversettings = serversettings.rows[0]
  const ignorecheck = await db.query('SELECT * FROM ignored WHERE snowflake = $1 OR snowflake = $2 AND WHERE NOT type = \'command\';', [channel.id, channel.parent.id])
  if (ignorecheck.rowCount > 0) return
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
  let serversettings = await db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [newState.guild.id])
  serversettings = serversettings.rows[0]
  if (!serversettings.voice_log_channel) return
  let change
  if (oldState.channel) change = `left ${oldState.channel.name}`
  else change = `joined ${newState.channel.name}`
  const channel = newState.guild.channels.cache.find(ch => ch.id === serversettings.voice_log_channel.toString())
  const embed = new Discord.MessageEmbed()
    .setAuthor(newState.member.user.tag, newState.member.user.displayAvatarURL())
    .setDescription(`${newState.member} ${change}`)
    .setColor(3756250)
    .setFooter(`ID: ${newState.member.id}`)
  await channel.send(embed).catch(e => console.error(e))
})

client.on('invalidated', () => {
  console.log('SESSION WAS INVALIDATED!')
  process.exit()
})

client.on('error', e => {
  console.error(e)
})

client.on('shardError', error => {
  console.error(error)
})

process.on('unhandledRejection', error => console.error('Uncaught Promise Rejection', error))
db.connect().catch(e => {
  console.error(e)
  process.exit()
})
