const request = require('axios')

module.exports = {
    name: "verify",
    description: 'Adds roles based on your roblox badges and group rank (if applicable).',
    guildOnly: true,
    execute(message) {
        let RobloxID = undefined
        let groupRank = 0
        const { badges, groupranks, gamepasses } = require(`../serversettings/${message.guild.id}.json`)
        request(`https://verify.eryn.io/api/user/${message.author.id}`)
        .then(function (roverResponse) {
            if (roverResponse.status != 200) {
                request(`https://api.blox.link/v1/user/${message.author.id}`)
                .then(function (bloxlinkResponse) {
                    if (bloxlinkResponse.data.status === "ok") {
                        RobloxID = bloxlinkResponse.data.primaryAccount
                        request(`https://api.roblox.com/users/${RobloxID}/groups`)
                        .then(function (groupInfo) {
                            for(var i = 0;i < groupInfo.data.length;i++) {
                                for(var x = 0;x < groupranks.length;i++) {
                                    if ((groupranks[x].group.includes(groupInfo.data[i].Id)) && (groupranks[x].rank.includes(groupInfo.data[i].Rank))) {
                                        groupRank = groupInfo.data[i].Rank
                                        message.member.addRole(groupranks[x].role)
                                    }
                                }
                            }
                        })
                        .catch(e => console.error(e.stack))
                        if (gamepasses) {
                            for (let i = 0;i < gamepasses.length;i++) {
                                request(`https://inventory.roblox.com/v1/users/${RobloxID}/items/GamePass/${gamepasses[i]}`)
                                .then(gamepassData => {
                                    if (gamepassData.data.data) {
                                        if (!message.member.roles.cache.has(gamepasses[i].role)) message.member.roles.add(gamepasses[i].role).catch(e => console.error(e.stack))
                                    }
                                })
                                .catch(e => console.error(e.stack))
                            }
                        }
                        if (badges) {
                            for (let i = 0;i < badges.length;i++) {
                                request(`https://inventory.roblox.com/v1/users/${RobloxID}/items/Badge/${badges[i]}`)
                                .then(badgeData => {
                                    if (badgeData.data.data) {
                                        if (!message.member.roles.cache.has(badges[i].role)) message.member.roles.add(badges[i].role).catch(e => console.error(e.stack))
                                    }
                                })
                                .catch(e => console.error(e.stack))
                            }
                        }
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
                                message.member.addRole(groupranks[x].role).catch(e => console.error(e.stack))
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