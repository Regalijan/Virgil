const Discord = require('discord.js')
const request = require('axios')

module.exports = {
    name: "verify",
    description: 'Adds roles based on your roblox badges and group rank (if applicable).',
    guildOnly: true,
    execute(message) {
        let RobloxID = undefined
        let groupRank = 0
        const { groupranks } = require(`../serversettings/${message.guild.id}.json`)
        request(`https://verify.eryn.io/api/user/${message.author.id}`)
        .then(function (roverResponse) {
            if (roverResponse.status != 200) {
                request(`https://api.blox.link/v1/user/${message.author.id}`)
                .then(function (bloxlinkResponse) {
                    if (bloxlinkResponse.data.status === "ok") {
                        RobloxID = bloxlinkResponse.data.primaryAccount
                        request(`https://api.roblox.com/users/${RobloxID}/groups`)
                        .then(function (groupInfo) {
                            for(var i = 0;i < groupInfo.data.length; i++) {
                                for(var x = 0; x < groupranks.length; x++) {
                                    if ((groupranks[x].group.includes(groupInfo.data[i].Id)) && (groupranks[x].rank.includes(groupInfo.data[i].Rank))) {
                                        groupRank = groupInfo.data[i].Rank
                                        /* message.member.addRole(groupranks[x].role) */
                                        return message.reply(`Your group rank in Car Crushers is ${groupRank}, with the associated discord role of <@&${groupranks[x].role}>`)
                                    }
                                }
                            }
                        })
                    }
                    else {
                        return message.reply('You are not verified on either RoVer or BloxLink, please visit https://verify.eryn.io to link your account to RoVer')
                    }
                })
                .catch(function (error) {
                    console.error(error)
                    return message.channel.send(`D0h! Some monkeying happened on my end! ${error}`)
                })
                
            }
            else {
                RobloxID = roverResponse.data.robloxId
                request(`https://api.roblox.com/users/${RobloxID}/groups`)
                .then(function (groupInfo) {
                    for(var i = 0;i < groupInfo.data.length; i++) {
                        for(var x = 0; x < groupranks.length; x++) {
                            if ((groupranks[x].group.includes(groupInfo.data[i].Id)) && (groupranks[x].rank.includes(groupInfo.data[i].Rank))) {
                                groupRank = groupInfo.data[i].Rank
                                /* message.member.addRole(groupranks[x].role) */
                                return message.reply(`Your group rank in Car Crushers is ${groupRank}, with the associated discord role of <@&${groupranks[x].role}>`)
                            }
                        }
                    }
                })
                .catch(function (error) {
                    console.error(error)
                    return message.channel.send(`D0h! Some monkeying happened on my end! ${error}`)
                })
            }
        })
    }
}