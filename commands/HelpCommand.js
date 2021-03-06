module.exports = {
  name: 'help',
  properName: 'Help',
  description: 'Displays all commands',
  async execute (message, args) {
    const { prefix } = require('../config.json')
    let cmds = '```Commands```'
    message.client.commands.forEach(cmd => {
      cmds += `\n${prefix}${cmd.name} - ${cmd.description}`
    })
    await message.channel.send(cmds, { split: true })
  }
}
