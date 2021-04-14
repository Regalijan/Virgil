module.exports = {
  name: 'virus',
  properName: 'Virus',
  description: 'Hello your computer has virus',
  guildOnly: true,
  async execute (message) {
    if (!message.member.voice.channel) return await message.channel.send('Join a voice channel first noob.')
    const vc = await message.member.voice.channel.join()
    const { join } = require('path')
    await message.channel.send('Sending virus...')
    const dispatcher = vc.play(join(__dirname, '../media/virus.mp3'))
    dispatcher.on('error', e => console.error(e))
    dispatcher.on('finish', () => vc.leave())
  }
}
