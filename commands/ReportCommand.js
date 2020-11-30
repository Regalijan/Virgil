const Discord = require('discord.js')
const request = require('axios')

module.exports = {
  name: 'report',
  description: 'Report an exploiter',
  execute (message, args) {
    const { exploiterReportChannel } = require(`../serversettings/${message.guild.id}.json`)
    if ((args[0]) && (args[1]) && (args[2]) && (exploiterReportChannel)) {
      const reason = args.slice(2).join(' ')
      request(`https://api.roblox.com/users/get-by-username?username=${args[0]}`)
        .then(response => {
          if ((response.status === 200) && (args[1].match(/^(https:\/\/|http:\/\/|<https:\/\/|<http:\/\/.)/))) {
            const embed = new Discord.MessageEmbed()
              .setTitle('Exploiter Report')
              .setDescription(`${message.author.username}#${message.author.discriminator} has reported ${response.data.Username} for exploiting!\n\nReason: ${args[2]}\n\n[Evidence](${reason})`)
              .setFooter(`Reporter ID: ${message.author.id}`)
            if (exploiterReportChannel) {
              exploiterReportChannel.send(embed)
            }
          } else if (response.status == 404) {
            message.channel.send('I could not find this user, is the spelling correct? (Usernames are not case-sensitive)')
          } else if (!args[1].match(/^(https:\/\/|http:\/\/|<https:\/\/|<http:\/\/.)/)) {
            message.channel.send('The URL you sent was not valid, make sure it starts with `http://` or `https://`')
          } else {
            message.channel.send('An unknown error occured! Maybe Roblox is down or is returning malformed data. If this keeps happening, contact the bot developer.')
          }
        })
    } else {
      message.channel.send('A required argument was missing, make sure you have supplied all required information.')
    }
  }
}
