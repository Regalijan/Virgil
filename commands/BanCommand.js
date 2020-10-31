module.exports = {
    name: 'ban',
    description: 'What do you think this does lol.',
    guildOnly: true,
    execute(message, args) {

        const { moderatorRoles, permissionOverrideRoles } = require(`../serversettings/${message.guild.id}.json`)
        let reason = args.slice(1).join(" ")
        if ((message.member.hasPermission('BAN_MEMBERS')) || (message.member.roles.cache.some(role => permissionOverrideRoles.includes(role.id)))) {
            if (args[0]) {
                let member = args[0]
                if (member.match(/(^<@!?[0-9]*>)/)) {
                    member = message.mentions.members.first()
                }
                else if (message.guild.member(member)) member = message.guild.member(member)
                let user = member.user
                if (message.author == user) return message.channel.send('Dumbass, why would you want to ban yourself?')
                if (member.roles.cache) {
                    if (member.roles.cache.find(role => moderatorRoles.includes(role.id))) return message.channel.send('I cannot ban moderators.')
                }
                if (!message.guild.member(member).bannable) return message.channel.send('This user cannot be banned!')
                message.guild.members.ban(member)
                .then(user => message.channel.send(`${user.user.tag} was banned! | ${reason}`))
                .catch(e => {
                    console.error(e.stack)
                    return message.channel.send(`I could not ban that user! ${e}`)
                })
            }
            else {
                message.channel.send('I can\'t ban air.')
            }
        }
    }
}
