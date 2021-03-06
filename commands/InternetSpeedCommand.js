module.exports = {
  name: 'internetspeed',
  properName: 'InternetSpeed',
  description: 'What do you think this is lol',
  async execute (message) {
    const { MessageEmbed } = require('discord.js')
    const embed = new MessageEmbed()
      .setImage('https://thumbsnap.com/sc/3N5uU9CP.png')
      .setColor(3756250)
    await message.channel.send(embed)
  }
}
