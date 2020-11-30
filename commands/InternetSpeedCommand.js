const Discord = require('discord.js')

module.exports = {
  name: 'internetspeed',
  description: 'What do you think this is lol',
  execute (message) {
    const embed = new Discord.MessageEmbed()
      .setImage('https://thumbsnap.com/sc/3N5uU9CP.png')
      .setColor(3756250)
    return message.channel.send(embed)
  }
}
