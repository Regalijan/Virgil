module.exports = {
  name: 'owoify',
  description: 'OwOifies text (200 characters maximum)',
  async execute (message, args) {
    if (args.length === 0) return await message.channel.send('I need some text first!')
    if (args.slice(0).join(' ').length > 200) return await message.channel.send('Text must be 200 characters or less!')
    const body = encodeURIComponent(args.slice(0).join(' '))
    const request = require('axios')
    const owo = await request(`https://nekos.life/api/v2/owoify?text=${body}`).catch(() => {})
    if (!owo) return await message.channel.send('An error occured :(')
    await message.channel.send(owo.data.owo)
  }
}
