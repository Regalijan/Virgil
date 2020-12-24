const { MessageEmbed } = require('discord.js')
const request = require('axios')
module.exports = {
  name: 'verificationdata',
  description: 'Displays your verification data from the RoVer and BloxLink registries',
  async execute (message) {
    const roverData = await request(`https://verify.eryn.io/api/user/${message.author.id}`, { transformResponse: [], validateStatus: false })
    const bloxlinkData = await request(`https://api.blox.link/v1/user/${message.author.id}`, { transformResponse: [], validateStatus: false })
    const embed = new MessageEmbed()
      .setTitle('Verification Data')
      .addFields(
        { name: 'RoVer', value: `https://verify.eryn.io/api/user/${message.author.id}:\n\`${roverData.data}\`` },
        { name: 'BloxLink', value: `https://api.blox.link/v1/user/${message.author.id}:\n\`${bloxlinkData.data}\`` }
      )
      .setColor(3756250)
    message.channel.send(embed)
  }
}
