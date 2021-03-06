module.exports = {
  name: 'httpduck',
  properName: 'Httpduck',
  description: 'Gets a duck with the specified http status code if one exists',
  async execute (message, args) {
    const Discord = require('discord.js')
    const request = require('axios')
    try {
      const response = await request(`https://random-d.uk/api/v2/http/${args[0]}`, { validateStatus: false })
      if (response.status !== 200) return message.channel.send('I could not find a duck with that status code.')
      const embed = new Discord.MessageEmbed()
        .setTitle(`${args[0]} Duck`)
        .setImage(`https://random-d.uk/api/v2/http/${args[0]}`)
        .setColor(3756250)
      return message.channel.send(embed)
    } catch (e) {
      console.error(e)
      return message.channel.send('Something broke on my end! If this keeps happening, contact the bot developer.')
    }
  }
}
