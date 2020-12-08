const config = require('../config.json')

module.exports = {
  name: 'reload',
  description: 'Reload a command',
  async execute (message, args) {
    if (message.author.id !== config.owner) return message.channel.send('You do not have permission to run this command!')
    if (!args[0]) return message.channel.send('No data was passed to reload.')
    const commandName = args[0].toLowerCase()
    const command = message.client.commands.get(commandName) || message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName))
    if (!command) return message.channel.send(`There is no command with name or alias \`${commandName}\`!`)
    delete require.cache[require.resolve(`./${command.name}Command.js`)]
    try {
      const newCommand = require(`./${command.name}Command.js`)
      message.client.commands.set(newCommand.name, newCommand)
    } catch (error) {
      console.error(error)
      return message.channel.send(`There was an error while reloading a command \`${command.name}\`:\n\`${error.message}\``)
    }
    message.channel.send(`Command \`${command.name}\` was reloaded!`)
  }
}
