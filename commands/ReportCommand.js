module.exports = {
  name: 'report',
  properName: 'Report',
  description: 'Report an exploiter',
  guildOnly: true,
  async execute (message, args) {
    const config = require('../config.json')
    const db = require('../database')
    let serversettings = await db.query('SELECT * FROM core_settings WHERE guild_id = $1;', [message.guild.id])
    serversettings = serversettings.rows[0]
    if (!serversettings.exploiter_reports_channel) return
    const channel = await message.guild.channels.cache.find(c => c.id === serversettings.exploiter_reports_channel.toString())
    if (!channel) return message.channel.send('I could not run the command because the report channel is missing!')
    if (args.length >= 3) {
      let username = args[0]
      username = username.replace(/<|>/g, '')
      let url = args[1]
      url = url.replace(/<|>/g, '')
      url = url.replace('/edit', '')
      url = url.replace('https://studio.youtube.com/video/', 'https://www.youtube.com/watch?v=')
      if (!url.match(/https?:\/\/.+\.\w+\/?\S+/)) return await message.channel.send('Could not validate url!')
      if (url.match(/.*\.roblox\.com/)) return await message.channel.send('Roblox links are not acceptable evidence!')
      let reason = args.slice(2).join(' ')
      reason = reason.replace(/<|>/g, '')
      const request = require('axios')
      const response = await request(`https://api.roblox.com/users/get-by-username?username=${username}`, { validateStatus: false })
      if (response.data.Username) {
        const bancheck = await request(`https://storage.googleapis.com/${config.bucket}/${response.data.Id}.json`, { validateStatus: false })
        let banstatus = 'Not banned or blacklisted'
        if (bancheck.status === 200 && bancheck.data.usercode === '0x1') banstatus = 'Blacklisted'
        else if (bancheck.status === 200 && bancheck.data.usercode === '0x2') banstatus = `Banned (${bancheck.data.reason})`
        const thumbdata = await request(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${response.data.Id}&size=720x720&format=Png`)
        const { MessageEmbed } = require('discord.js')
        const embed = new MessageEmbed()
          .setTitle('Exploiter Report')
          .setColor(3756250)
          .setAuthor(message.author.tag, message.author.displayAvatarURL())
          .setThumbnail(thumbdata.data.data[0].imageUrl)
          .addFields(
            { name: 'Username', value: `[${response.data.Username}](https://www.roblox.com/users/${response.data.Id}/profile)` },
            { name: 'Description', value: reason },
            { name: 'Evidence', value: url },
            { name: 'Current user status', value: banstatus }
          )
          .setFooter(`ID: ${message.author.id}`)
        await channel.send(embed).catch(() => {})
        const confirmation = await message.reply('Report sent!')
        message.delete({ timeout: 10000 }).catch(e => console.error(e))
        confirmation.delete({ timeout: 10000 })
      } else if (response.status === 200 && response.data.success === false) {
        return message.channel.send('This username does not appear to exist.')
      } else {
        message.channel.send('An unknown error occured! Maybe Roblox is down or is returning malformed data. If this keeps happening, contact the bot developer.')
      }
    } else if (!args[0]) {
      message.channel.send(`Command Usage: \`${config.prefix}report <username> <link> <description>\``)
    } else if (!args[1]) {
      message.channel.send('Please provide a link!')
    } else if (!args[2]) {
      message.channel.send('Please provide a description!')
    }
  }
}
