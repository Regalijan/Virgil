const Discord = require('discord.js')

module.exports = {
    name: 'noobdetector',
    description: 'Find out how much of a noob you are',
    execute(message) {
        let member = message.member
        if (args[0]) member = args[0]
        if (args[0] && args[0].match(/(^<@!?[0-9]*>)/)) {
            member = message.mentions.members.first()
        }
        else if (args[0] && message.guild.member(args[0])) member = message.guild.member(member)
        const embed = new Discord.MessageEmbed()
        .setTitle('Noob Detector')
        .setAuthor(member.user.tag,member.user.displayAvatarURL())
        .setColor(3756250)
        .addField('Noob Percentage',Math.floor(Math.random()*101).toString())
        message.channel.send(embed)
    }
}