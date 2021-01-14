module.exports = {
  name: 'stock',
  description: 'Fetches stock information from Yahoo Finance',
  async execute (message, args) {
    const request = require('axios').default
    const { prefix } = require('../config.json')
    if (args.length === 0) return message.channel.send(`Usage: \`${prefix}stock <symbol>\``)
    const data = await request(`https://finance.yahoo.com/quote/${args[0].toUpperCase()}`, { responseType: 'text', validateStatus: false })
    if (data.status !== 200) return message.channel.send('That stock could not be found!')
    const { MessageEmbed } = require('discord.js')
    const embed = new MessageEmbed()
      .setAuthor(message.author.tag, message.author.displayAvatarURL())
      .setTitle(args[0].toUpperCase(data.data.match(/data-reactid="7">([^<]*)<\/h1>/)[1]))
      .setDescription(`Current Value: ${data.data.match(/data-reactid="50">([0-9,.]*)/)[1]}\nChange: ${data.data.match(/data-reactid="51">(-?\d*\.\d* \(-?\d*\.\d*%\))/)[1]}\n${data.data.match(/span data-reactid="53">([0-9 A-z :.]*)/)[1]}`)
      .setFooter('Powered by Yahoo Finance')
    await message.channel.send(embed)
  }
}
