const Discord = require('discord.js')
const request = require('axios')

module.exports = {
    name: "update",
    description: "Updates the target user's role bindings.",
    guildOnly: true,
    execute(message) {
        let RobloxID = undefined
        let groupRank = 0
        const { badges, gamepasses, groupranks, updateCommandRoles } = require(`../serversettings/${message.guild.id}.json`)
        const member = message.mentions.members.first()
        if ((message.member.roles.cache.some(role => updateCommandRoles.includes(role.id))) || (message.member.hasPermission('MANAGE_GUILD'))) {
            request(`https://verify.eryn.io/api/user/${member.id}`)
            .then(function (roverResponse) {
                if (roverResponse.status != 200) {
                    request(`https://api.blox.link/v1/user/${member.id}`)
                    .then(function (bloxlinkResponse) {
                        if (bloxlinkResponse.data.status === "ok") {
                            RobloxID = bloxlinkResponse.data.primaryAccount
                            request(`https://api.roblox.com/users/${RobloxID}/groups`)
                            .then(function (groupInfo) {
                                for (var i = 0;i < groupInfo.data.length;i++) {
                                    for(var x = 0; x < groupranks.length;x++) {
                                        if ((groupranks[x].group.includes(groupInfo.data[i].Id)) && (groupranks[x].rank.includes(groupInfo.data[i].Rank))) {
                                            groupRank = groupInfo.data[i].Rank
                                            member.roles.add(groupranks[x].role).catch(error => {
                                                console.error(error)
                                                return message.channel.send(`D0h! I couldn't give roles to ${target}! ${error}`)
                                            })
                                        }
                                    }
                                }
                            })
                            .catch(function (error) {
                                console.error(error)
                                return message.channel.send('HMMMMMMMM... Something br0ke when running this command!')
                            })
                        }
                        else {
                            return message.reply('This user is not verified on either RoVer or BloxLink')
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
                        for (var i = 0;i < groupInfo.data.length;i++) {
                            for(var x = 0; x < groupranks.length;x++) {
                                if ((groupranks[x].group.includes(groupInfo.data[i].Id)) && (groupranks[x].rank.includes(groupInfo.data[i].Rank))) {
                                    groupRank = groupInfo.data[i].Rank
                                    member.roles.add(groupranks[x].role).catch(error => {
                                        console.error(error)
                                        return message.channel.send(`D0h! I couldn't give roles to ${target}! ${error}`)
                                    })
                                }
                            }
                        }
                        for (let i = 0;i < badges.length;i++) {
                            if (badges) {
                                request(`https://inventory.roblox.com/v1/users/${RobloxID}/items/Badge/${badges[i].badge}`)
                                .then(function (badgeData) {
                                    if (badgeData.data.data) {
                                        if (!member.roles.cache.has(badges[i].role)) member.roles.add(badges[i].role).catch(error => console.error(error))
                                    }
                                })
                                .catch(function (error) {
                                    console.error(error)
                                })
                            }
                        }
                        for (let i = 0;i < gamepasses.length;i++) {
                            if (badges) {
                                request(`https://inventory.roblox.com/v1/users/${RobloxID}/items/GamePass/${gamepasses[i].badge}`)
                                .then(function (gamepassData) {
                                    if (gamepassData.data.data) {
                                        if (!member.roles.cache.has(gamepasses[i].role)) member.roles.add(gamepasses[i].role).catch(error => console.error(error))
                                    }
                                })
                                .catch(function (error) {
                                    console.error(error)
                                })
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
        else {
            return message.channel.send('You do not have permission to run this command!')
        }
    }
}