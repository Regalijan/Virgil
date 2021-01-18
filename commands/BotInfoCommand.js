const { MessageEmbed } = require('discord.js')
const { client } = require('../index')
const { execSync } = require('child_process')
const os = require('os')
module.exports = {
  name: 'botinfo',
  description: 'Bot information',
  async execute (message) {
    const app = await client.fetchApplication()
    const cpus = os.cpus()
    let commit
    try {
      commit = execSync('git rev-parse HEAD')
    } catch (e) {
      console.error(e)
      return message.channel.send('An error occured when fetching commit information!')
    }
    let sysuptime = os.uptime()
    let days = Math.floor(sysuptime / 86400)
    if (days > 0) sysuptime %= 86400
    let hours = Math.floor(sysuptime / 3600)
    if (hours > 0) sysuptime %= 3600
    let minutes = Math.floor(sysuptime / 60)
    if (minutes > 0) sysuptime %= 60
    let sysuptimestr = `${sysuptime}s`
    if (minutes > 0) sysuptimestr = `${minutes}m ${sysuptimestr}`
    if (hours > 0) sysuptimestr = `${hours}h ${sysuptimestr}`
    if (days > 0) sysuptimestr = `${days}d ${sysuptimestr}`
    let botuptime = Math.floor(client.uptime / 1000)
    days = Math.floor(botuptime / 86400)
    if (days > 0) botuptime %= 86400
    hours = Math.floor(botuptime / 3600)
    if (hours > 0) botuptime %= 3600
    minutes = Math.floor(botuptime / 60)
    if (minutes > 0) botuptime %= 60
    let botuptimestr = `${botuptime}s`
    if (minutes > 0) botuptimestr = `${minutes}m ${botuptimestr}`
    if (hours > 0) botuptimestr = `${hours}h ${botuptimestr}`
    if (days > 0) botuptimestr = `${days}d ${botuptimestr}`
    const embed = new MessageEmbed()
      .setAuthor(client.user.tag, client.user.displayAvatarURL())
      .setTitle('System Information')
      .setColor(3756250)
      .addFields(
        { name: 'Owner', value: app.owner.tag },
        { name: 'Repository', value: 'https://github.com/Wolftallemo/Virgil' },
        { name: 'Current Commit Hash', value: commit },
        { name: 'System Architecture', value: process.arch },
        { name: 'Operating System', value: os.version() },
        { name: 'CPU Cores (logical)', value: cpus.length },
        { name: 'Processor', value: cpus[0].model },
        { name: 'Total Memory', value: `${Math.floor(os.totalmem() / 1000000)} MB` },
        { name: 'System Uptime', value: sysuptimestr },
        { name: 'Process Uptime', value: botuptimestr },
        { name: 'Node Version', value: process.version }
      )
    await message.channel.send(embed).catch(() => {})
  }
}
