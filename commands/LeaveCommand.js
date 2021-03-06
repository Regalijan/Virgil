module.exports = {
  name: 'leave',
  properName: 'Leave',
  description: 'Leaves current voice channel',
  guildOnly: true,
  async execute (message) {
    const { dispatcher } = require('./PlayCommand')
    if (!message.member.hasPermission('MANAGE_MESSAGES')) return await message.channel.send('You cannot run this command!')
    if (!message.guild.me.voice) {
      return await message.channel.send('I\'m not in a voice channel you noob.')
    }
    if (dispatcher) {
      await dispatcher.destroy()
    }
    await message.guild.voice.channel.leave()
    await message.channel.send('Left voice channel.')
  }
}
