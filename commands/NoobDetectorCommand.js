const Discord = require('discord.js')

module.exports = {
    name: 'noobdetector',
    description: 'Find out how much of a noob you are',
    execute(message) {
        const embed = new Discord.MessageEmbed()
        .setTitle('Noob Detector')
        .setAuthor(message.author.tag,message.author.displayAvatarURL())
        .setColor(3756250)
        .addField('Noob Percentage',Math.floor(Math.random()*101).toString())
        message.channel.send(embed)
    }
}