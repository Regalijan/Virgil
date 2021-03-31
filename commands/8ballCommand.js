module.exports = {
  name: '8ball',
  properName: '8ball',
  description: 'What does the future hold?',
  async execute (message, args) {
    if (args.length === 0) return await message.channel.send('Gimme a question first.')
    const request = require('axios')
    const eightballdata = await request('https://nekos.life/api/v2/8ball').catch(() => {})
    if (!eightballdata) return await message.channel.send(`The 8ball decided that you won't know your future (Request failed, HTTP ${eightballdata.status})`)
    const { MessageEmbed } = require('discord.js')
    const embed = new MessageEmbed()
      .setAuthor(message.author.tag, message.author.displayAvatarURL())
      .setColor(3756250)
      .setDescription(eightballdata.data.response)
      .setImage(eightballdata.data.url)
    await message.channel.send(embed)
  }
}
