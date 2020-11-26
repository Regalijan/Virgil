const Discord = require('discord.js')

module.exports = {
    name: 'noobdetector',
    description: 'Find out how much of a noob you are',
    async execute(message, args) {
        let member = message.member
        if (args[0] && args[0].match(/(^<@!?[0-9]*>)/)) member = message.mentions.members.first()
        else if (args[0]) member = await message.guild.members.fetch(args[0]).catch(e => console.error(e))
        const embed = new Discord.MessageEmbed()
        .setTitle('Noob Detector')
        .setAuthor(member.user.tag,member.user.displayAvatarURL())
        .setColor(3756250)
        .addField('Noob Percentage',`${Math.round(Math.random()*101)}%`)
        message.channel.send(embed)
    }
}