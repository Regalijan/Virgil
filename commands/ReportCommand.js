const config = require('../config.json')
const Discord = require('discord.js')
const request = require('axios')

module.exports = {
  name: 'report',
  description: 'Report an exploiter',
  async execute (message, args) {
    const { exploiterReportsChannel } = require(`../serversettings/${message.guild.id}.json`)
    if ((args[0]) && (args[1]) && (args[2]) && (exploiterReportsChannel)) {
      let username = args[0]
      username = username.replace(/<|>/g, '')
      let url = args[1]
      url = url.replace('/edit', '')
      url = url.replace('https://studio.youtube.com/video/', 'https://www.youtube.com/watch?v=')
      let reason = args.slice(2).join(' ')
      reason = reason.replace(/<|>/g, '')
      const response = await request(`https://api.roblox.com/users/get-by-username?username=${username}`, { validateStatus: false })
      let validurl = true
      if (response.data.Username) {
        await request(args[1], { validateStatus: false }).catch(() => {
          message.channel.send('This URL could not be reached or verified.')
          validurl = false
        })
        if (!validurl) return
        const bancheck = await request(`https://storage.googleapis.com/${config.bucket}/${response.data.Id}.json`, { validateStatus: false })
        let banstatus = 'Not banned or blacklisted'
        if (bancheck.status === 200 && bancheck.data.usercode === '0x1') banstatus = 'Blacklisted'
        else if (bancheck.status === 200 && bancheck.data.usercode === '0x2') banstatus = `Banned (${bancheck.data.reason})`
        const thumbdata = await request(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${response.data.Id}&size=720x720&format=Png`)
        const embed = new Discord.MessageEmbed()
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
        const channel = message.guild.channels.cache.find(ch => ch.id === exploiterReportsChannel)
        if (!channel) return message.channel.send('The reports channel is not set up!')
        await channel.send(embed)
        const confirmation = await message.reply('Report sent!')
        message.delete({ timeout: 10000 }).catch(e => console.error(e))
        confirmation.delete({ timeout: 10000 })
      } else if (response.status === 200 && response.data.success === false) {
        return message.channel.send('This username does not appear to exist.')
      } else {
        message.channel.send('An unknown error occured! Maybe Roblox is down or is returning malformed data. If this keeps happening, contact the bot developer.')
      }
    } else if (!args[0]) {
      message.channel.send('Command Usage: `[prefix]report <username> <link> <description>`')
    } else if (!args[1]) {
      message.channel.send('Please provide a link!')
    } else if (!args[2]) {
      message.channel.send('Please provide a description!')
    } else if (!exploiterReportsChannel) {
      message.channel.send('The report channel was not set!')
    }
  }
}
