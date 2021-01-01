const fs = require('fs')
const { MessageEmbed } = require('discord.js')
const { client, owner } = require('../index')
const os = require('os')
module.exports = {
  name: 'botinfo',
  description: 'Bot information',
  async execute (message) {
    const cpus = os.cpus()
    const commit = fs.readFile('../.git/ORIG_HEAD', err => { if (err) return console.error(err) }).toString()
    const embed = new MessageEmbed()
      .setAuthor(client.user.tag, client.user.displayAvatarURL())
      .setTitle('System Information')
      .addFields(
        { name: 'Owner', value: owner.tag },
        { name: 'Repository', value: 'https://github.com/Wolftallemo/Virgil' },
        { name: 'Current Commit Hash', value: commit },
        { name: 'System Architecture', value: process.arch },
        { name: 'Operating System', value: os.version() },
        { name: 'CPU Cores (logical)', value: cpus.length },
        { name: 'Processor', value: cpus[0].model },
        { name: 'Total Memory', value: os.totalmem() * 1000000 },
        { name: 'System Uptime', value: `${os.uptime()} seconds` },
        { name: 'Process Uptime', value: `${Math.floor(client.uptime / 1000)} seconds` },
        { name: 'Node Version', value: process.version }
      )
    await message.channel.send(embed).catch(() => {})
  }
}
