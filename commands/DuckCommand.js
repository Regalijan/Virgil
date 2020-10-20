const Discord = require('discord.js')
const request = require('axios')

module.exports = {
    name: "duck",
    description: "Shows a random duck.",
    execute(message) {
        request('https://random-d.uk/api/v2/random')
        .then(function (response) {
            const embed = new Discord.MessageEmbed()
            .setTitle(':duck: QUACK! A random duck for you!')
            .setImage(response.data.url)
            .setFooter(response.data.message)
            return message.channel.send(embed)
        })
        .catch(function (error) {
            console.error(error)
            return message.channel.send(`D0h! Some monkeying happened on my end! ${error}`)
        })
    }
}