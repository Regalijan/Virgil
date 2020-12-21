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
      url = url.replace('studio.youtube.com/video/', 'www.youtube.com/watch?v=')
      url = url.replace('/edit', '')
      const reason = args.slice(2).join(' ')
      const response = await request(`https://api.roblox.com/users/get-by-username?username=${args[0]}`, { validateStatus: false })
      if (response.data.Username) {
        const urltest = await request(args[1], { validateStatus: false })
        if (!urltest || urltest.status !== 200) return message.channel.send('This url is either not valid or cannot be verified.')
        const bancheck = await request(`https://storage.googleapis.com/${config.bucket}/${response.data.Id}.json`, { validateStatus: false })
        let description = `${message.author.username}#${message.author.discriminator} has reported ${response.data.Username} for exploiting!\n\nReason: ${reason}\n\n[Evidence](${url})`
        if (bancheck.status === 200 && bancheck.data.usercode === '0x1') description += '\n\nThis user is blacklisted!'
        else if (bancheck.status === 200 && bancheck.data.usercode === '0x2') description += '\n\nThis user is banned!'
        const embed = new Discord.MessageEmbed()
          .setTitle('Exploiter Report')
          .setDescription(description)
          .setFooter(`Reporter: ${message.author.tag} - ${message.author.id}`)
        if (exploiterReportsChannel) {
          exploiterReportsChannel.send(embed)
        }
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
