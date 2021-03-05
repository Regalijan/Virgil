module.exports = {
  name: 'owoify',
  description: 'OwOifies text (200 characters maximum)',
  async execute (message, args) {
    if (args.slice(0).join(' ') > 200) return await message.channel.send('Text must be 200 characters or less!')
    const body = encodeURIComponent(args.slice(0).join(' '))
    const request = require('axios').default
    const owo = await request(`https://nekos.life/api/v2/owoify?text=${body}`).catch(() => {})
    if (!owo) return await message.channel.send('An error occured :(')
    await message.channel.send(owo.data.owo)
  }
}
