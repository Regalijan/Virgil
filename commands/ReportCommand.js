const config = require('../config.json')
const Discord = require('discord.js')
const request = require('axios')

module.exports = {
  name: 'report',
  description: 'Report an exploiter',
  async execute (message, args) {
    const { exploiterReportsChannel } = require(`../serversettings/${message.guild.id}.json`)
    if ((args[0]) && (args[1]) && (args[2]) && (exploiterReportsChannel)) {
      let url = args[1]
      if (url.match('studio.youtube.com')) {
        url = url.replace('studio.youtube.com/video/', 'www.youtube.com/watch?v=')
        url = url.replace('/edit', '')
      }
      const reason = args.slice(2).join(' ')
      const response = await request(`https://api.roblox.com/users/get-by-username?username=${args[0]}`, { validateStatus: false })
      if (response.data.Username) {
        const urltest = await request(args[1], { validateStatus: false }).catch(() => { return message.channel.send('This URL could not be reached') })
        if (!urltest.status !== 200) return message.channel.send('This url cannot be verified.')
        const bancheck = await request(`https://storage.googleapis.com/${config.bucket}/${response.data.Id}.json`, { validateStatus: false })
        let banstatus = 'Not banned or blacklisted'
        if (bancheck.status === 200 && bancheck.data.usercode === '0x1') banstatus = 'Blacklisted'
        else if (bancheck.status === 200 && bancheck.data.usercode === '0x2') banstatus = `Banned (${bancheck.data.reason})`
        const thumbdata = await request(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${response.data.Id}&size=250x250&format=Png`)
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
        await message.channel.send('Report sent!')
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
