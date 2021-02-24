module.exports = {
  name: 'verificationdata',
  description: 'Displays your verification data from the RoVer and BloxLink registries',
  async execute (message) {
    const { MessageEmbed } = require('discord.js')
    const request = require('axios')
    const roverData = await request(`https://verify.eryn.io/api/user/${message.author.id}`, { transformResponse: [], validateStatus: false })
    const embed = new MessageEmbed()
      .setTitle('Verification Data')
      .addField('RoVer', `https://verify.eryn.io/api/user/${message.author.id}:\n\`${roverData.data}\``)
      .setColor(3756250)
    message.channel.send(embed)
  }
}
