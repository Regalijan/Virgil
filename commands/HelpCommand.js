module.exports = {
  name: 'help',
  description: 'Displays all commands',
  async execute (message, args) {
    const { prefix } = require('../config.json')
    const { MessageEmbed } = require('discord.js')
    const embed = new MessageEmbed()
      .setAuthor(message.author.tag, message.author.displayAvatarURL())
    message.client.commands.forEach(async cmd => {
      embed.addField(`${prefix}${cmd.name}`, cmd.description)
    })
    await message.channel.send(embed)
  }
}
