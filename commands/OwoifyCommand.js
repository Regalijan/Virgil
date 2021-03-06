module.exports = {
  name: 'owoify',
  description: 'OwOifies text (200 characters maximum)',
  async execute (message, args) {
    if (args.length === 0) return await message.channel.send('I need some text first!')
    const body = args.slice(0).join(' ')
      .replace(/[lr]/g, 'w')
      .replace(/[LR]/g, 'W')
      .replace(/n([aeiou])/g, 'ny$1')
      .replace(/N([aeiou])/g, 'Ny$1')
      .replace(/N([AEIOU])/g, 'Ny$1')
      .replace(/ove/g, 'uv')
    await message.channel.send(body)
  }
}
