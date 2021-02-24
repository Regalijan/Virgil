module.exports = {
  name: 'tempban',
  description: 'Temporarily bans a member',
  guildOnly: true,
  async execute (message, args) {
    if (!message.member.hasPermission('BAN_MEMBERS')) return
    const { prefix } = require('../config.json')
    if (args.length === 0) return await message.channel.send(`Usage: \`${prefix}tempban <user> <number> <time unit> [reason]\`\nThe time unit can be **m**inutes, **d**ays, **m**onths, or years.\nExample: \`${prefix}tempban noob 3 d being a noob\``)
    if (message.guild.me.hasPermission('BAN_MEMBERS')) return await message.channel.send('I cannot ban this member as I do not have the Ban Members permission!')
    const timenum = parseInt(args[1])
    if (!timenum) return await message.channel.send('The time value given was not valid!')
    const { getuser } = require('../getuser')
    const target = await getuser(args[0], message)
    if (!target) return await message.channel.send('I could not find that user!')
    let ts
    switch (args[2].toLowerCase()) {
      case ('m' || 'minutes'):
        ts = Date.now + (timenum * 60000)
        break
      case ('h' || 'hours'):
        ts = Date.now + (timenum * 360000)
        break
      case ('d' || 'days'):
        ts = Date.now + (timenum * 86400000)
        break
      default:
        return await message.channel.send('Invalid time unit!')
    }
    const request = require('axios').default
    const robloxdata = await request(`https://verify.eryn.io/api/user/${target.id}`)
    let robloxid = null
    if (robloxdata.status === 200) robloxid = robloxdata.data.robloxId
    const db = require('../database')
    const dbsuccess = await db.query('INSERT INTO bans(discord_id,roblox_id,time) VALUES($1,$2,$3);', [target.id, robloxid, ts]).catch(e => console.error(e))
    if (!dbsuccess) return await message.channel.send('An error occured when recording this ban!')
    const bean = await message.guild.members.ban(target.id).catch(e => console.error(e))
    if (!bean) return await message.channel.send('An error occured when banning the user!')
    await message.channel.send(`${target} banned!`)
    let serversettings = await db.query('SELECT * FROM core_settings')
    if (serversettings.rowCount === 0) return
    serversettings = serversettings.rows[0]
    const channel = message.guild.channels.cache.find(c => c.id === serversettings.mod_log_channel.toString())
    if (!channel) return
    const { MessageEmbed } = require('discord.js')
    const embed = new MessageEmbed()
      .setAuthor(message.author.tag, message.author.displayAvatarURL())
      .setDescription(`Tempbanned ${target}\nOriginal message: \`${message.content}\``)
    await channel.send(embed)
  }
}
