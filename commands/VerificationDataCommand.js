const { MessageEmbed } = require('discord.js')
const request = require('axios')
module.exports = {
  name: 'verificationdata',
  description: 'Displays your verification data from the RoVer and BloxLink registries',
  async execute (message) {
    let roverData = await request(`https://verify.eryn.io/api/user/${message.author.id}`, { validateStatus: false })
    if (roverData.status !== 200) roverData = 'No data'
    else roverData = `\`{"robloxUsername":"${roverData.data.robloxUsername}","robloxId": ${roverData.data.robloxId}}\``
    let bloxlinkData = await request(`https://api.blox.link/v1/user/${message.author.id}`, { validateStatus: false })
    if (bloxlinkData.status !== 200 || bloxlinkData.data.status !== 'ok') bloxlinkData = 'No data'
    else bloxlinkData = `\`{"primaryAccount":"${bloxlinkData.data.primaryAccount}"}\``
    const embed = new MessageEmbed()
      .setTitle('Verification Data')
      .addFields(
        { name: 'RoVer', value: `https://verify.eryn.io/api/user/${message.author.id}:\n${roverData}` },
        { name: 'BloxLink', value: `https://api.blox.link/v1/user/${message.author.id}:\n${bloxlinkData}` }
      )
      .setColor(3756250)
    message.channel.send(embed)
  }
}
