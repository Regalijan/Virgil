const Discord = require('discord.js')

module.exports = {
    name: "bonk",
    description: "BONK!",
    guildOnly: true,
    execute(message, args) {
        let target = `<@${args[0]}>`
        if (args[0].match(/(^<@!?[0-9]*>)/)) {
            target = message.mentions.members.first()
        }
        const embed = new Discord.MessageEmbed()
        .setTitle("BONK!")
        .setImage("https://i.pinimg.com/originals/f7/30/3b/f7303b16c4d7902e88060de1ad3c9ed3.jpg")
        .setDescription(`<@${message.author.id}> has bonked ${target}.`)
        .setColor(3756250)
        message.channel.send(embed)
    }
}