module.exports = {
    name: "mute",
    description: 'What do you think this does lmfao',
    guildOnly: true,
    execute(message,args) {
        const serversettings = require(`../serversettings/${message.guild.id}.json`)
        if ((message.member.hasPermission('BAN_MEMBERS')) || (message.member.roles.cache.some(role => serversettings.permissionOverrideRoles.includes(role.id)))) {
            if (args[0]) {
                let reason = args.slice(2).join(" ")
                let time = args[1]
                let member = args[0]
                if (member.match(/(^<@!?[0-9]*>)/)) {
                    member = message.mentions.members.first()
                }
                else if (message.guild.member(member)) member = message.guild.member(member)
                else return message.channel.send('I could not find this user.')
                if (message.member == member) return message.channel.send('Dumbass, why would you want to mute yourself?')
                if (member.roles.cache) {
                    if (member.roles.cache.find(role => serversettings.moderatorRoles.includes(role.id))) return message.channel.send('I cannot mute moderators.')
                }
                if (!reason) reason = 'No reason provided.'
                if (!serversettings.muteRole) return message.channel.send('Muted role was not set!')
                if (!guild.roles.cache.find(role => role.id === serversettings.muteRole)) return message.channel.send('The muted role is invalid!')
                const role = guild.roles.cache.find(role => role.id === serversettings.muteRole)
                member.roles.add(role)
                message.channel.send(`${member} was muted!`)
            }
        }
    }
}