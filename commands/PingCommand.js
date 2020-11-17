const client = require('../index')
const Discord = require('discord.js')

module.exports = {
    name: "ping",
    description: "pong",
    execute(message) {
        console.log()
        const embed = new Discord.MessageEmbed()
        .setTitle('PONG!')
        .setColor(3756250)
        .addField('Total', `${Date.now() - message.createdTimestamp}ms`, true)
        .addField('WebSocket',`${client.client.ws.ping}ms`,true)
        return message.channel.send(embed)
    }
}