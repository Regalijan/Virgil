import axios from 'axios'
import redis from './redis'
import mongo from './mongo'
import { GuildMember } from 'discord.js'

export = {
  async getRobloxMemberGroups (user: number): Promise<{ group: { id: number, name: string, memberCount: number }, role : { id: number, name: string, rank: number } }[]> {
    const cachedData = await redis.get(`robloxgroups_${user}`).catch(e => console.error(e))
    if (cachedData) return JSON.parse(cachedData)
    try {
      const apiResponse = await axios(`https://groups.roblox.com/v2/users/${user}/groups/roles`)
      await redis.set(`robloxgroups_${user}`, JSON.stringify(apiResponse.data), 'EX', 900).catch(e => console.error(e))
      return apiResponse.data
    } catch (e) {
      console.error(e)
      return []
    }
  },

  async getRobloxUserFriends (user: number): Promise<number[]> {
    const cachedData = await redis.get(`robloxfriends_${user}`).catch(e => console.error(e))
    if (cachedData) return JSON.parse(cachedData)
    try {
      const apiResponse = await axios(`https://friends.roblox.com/v1/users/${user}/friends`)
      const friendIds: number[] = []
      for (const friend of apiResponse.data.data) friendIds.push(friend.id)
      await redis.set(`robloxfriends_${user}`, JSON.stringify(friendIds), 'EX', 1800).catch(e => console.error(e))
      return friendIds
    } catch (e) {
      console.error(e)
      return []
    }
  },

  async getRobloxAssetOwnership (user: number, item: number, itemType: 'Asset' | 'Badge' | 'Bundle' | 'GamePass' = 'Badge'): Promise<boolean> {
    // Accepted values are "Asset", "Badge", "Bundle", and "GamePass"
    const cachedData = await redis.get(`${itemType}_${item}_${user}`).catch(e => console.error(e))
    if (cachedData) return JSON.parse(cachedData)
    try {
      const apiResponse = await axios(`https://inventory.roblox.com/v1/users/${user}/items/${itemType}/${itemType}`)
      const ownsItem = apiResponse.data.data.length ? true : false
      await redis.set(`${itemType}_${item}_${user}`, JSON.stringify(ownsItem), 'EX', 900).catch(e => console.error(e))
      return ownsItem
    } catch (e) {
      console.error(e)
      return false
    }
  },

  async getRobloxPlatformBadges (user: number): Promise<number[]> {
    /*
    Roblox platform badge id list, see https://www.roblox.com/info/roblox-badges
    ----------------------------------------------------------------------------
    1: Administrator
    2: Friendship
    3: Combat Initiation *Deprecated
    4: Warrior *Deprecated
    5: Bloxxer *Deprecated
    6: Homestead
    7: Bricksmith
    8: Inviter *Deprecated
    9: ? *Deleted
    10: ? *Deleted
    11: Builders Club *Deleted
    12: Veteran
    13: ? *Deleted
    14: Ambassador *Deprecated
    15: Turbo Builders Club *Deleted
    16: Outrageous Builders Club *Deleted
    17: Official Model Maker
    18: Welcome To The Club *Deprecated
    (Unknown badge ids are forum, image, and super moderator)
    */
   const cachedData = await redis.get(`robloxplatformbadges_${user}`).catch(e => console.error(e))
   if (cachedData) return JSON.parse(cachedData)
   try {
     const apiResponse = await axios(`https://accountinformation.roblox.com/v1/users/${user}/roblox-badges`)
     const badgeIds: number[] = []
     for (const badge of apiResponse.data) badgeIds.push(badge.id)
     await redis.set(`robloxplatformbadges_${user}`, JSON.stringify(badgeIds), 'EX', 900)
     return badgeIds
   } catch (e) {
     console.error(e)
     return []
   }
  },

  async getRobloxUserProfile (user: number): Promise<{ description: string, created: Date, isBanned: boolean, externalAppDisplayName: string, id: number, name: string, displayName: string } | void> {
    const cachedData = await redis.get(`robloxprofile_${user}`).catch(e => console.error(e))
    if (cachedData) return JSON.parse(cachedData)
    try {
      const apiResponse = await axios(`https://users.roblox.com/v1/users/${user}`)
      await redis.set(`robloxprofile_${user}`, JSON.stringify(apiResponse.data), 'EX', 900).catch(e => console.error(e))
      return apiResponse.data
    } catch (e) {
      console.error(e)
      return
    }
  },

  async getRobloxGroupAffiliates (group: number, relationship: 'allies' | 'enemies' = 'allies'): Promise<number[]> {
    if (!['allies', 'enemies'].includes(relationship.toLowerCase())) throw SyntaxError('relationship must be a value of "allies" or "enemies"')
    const cachedData = await redis.get(`${relationship}_${group}`).catch(e => console.error(e))
    if (cachedData) return JSON.parse(cachedData)
    try {
      const apiResponse = await axios(`https://groups.roblox.com/v1/groups/${group}/relationships/${relationship}?model.startRowIndex=0&model.maxRows=100`)
      const groups: number [] = []
      for (const group of apiResponse.data.relatedGroups) groups.push(group.id)
      await redis.set(`${relationship}_${group}`, groups, 'EX', 3600).catch(e => console.error(e))
      return groups
    } catch (e) {
      console.error(e)
      return []
    }
  },

  formatName (template: string, discordUsername: string, discordId: string, serverName: string, robloxUsername: string, robloxId: number, displayName: string): string {
    const name = template
      .replaceAll('{{USERNAME}}', robloxUsername)
      .replaceAll('{{DISPLAYNAME}}', displayName)
      .replaceAll('{{ROBLOXID}}', robloxId.toString())
      .replaceAll('{{DISCORDNAME}}', discordUsername)
      .replaceAll('{{DISCORDID}}', discordId)
      .replaceAll('{{SERVER}}', serverName)
      .replaceAll('{{SMARTNAME}}', robloxUsername === displayName ? robloxUsername : `${displayName} (${robloxUsername})`)
    
    return name.length > 32 ? name.substr(0, 32) : name
  },

  async verify (member: GuildMember, self: boolean = true): Promise<string> {
    if (!member.guild.me?.permissions.has('MANAGE_ROLES')) return 'I do not have permission to manage roles!'
    const db = mongo.db().collection('binds')
    const verifyApiData = await axios(`https://verify.eryn.io/api/user/${member.id}`).catch(e => console.error(e))
    if (!verifyApiData) {
      const unverifiedBindDoc = db.find({ server: member.guild.id, type: 'unverified' })
      const unvBinds: any = []
      unverifiedBindDoc.forEach(doc => { unvBinds.push(doc) })
      for (const unverifiedBind of unvBinds) {
        const unvRole = await member.guild.roles.fetch(unverifiedBind.role).catch(e => console.error(e))
        if (!unvRole || unvRole.comparePositionTo(member.guild.me.roles.highest) >= 0) continue
        await member.roles.add(unvRole).catch(e => console.error(e))
      }
      return self ? 'You must be new, visit <https://verify.eryn.io> to get started.' : `${member.user.username} appears to not be verified.`
    }
    const userProfileData = await this.getRobloxUserProfile(parseInt(verifyApiData.data.robloxId))
    if (!userProfileData) return `An error occured when verifying ${self ? 'you' : member.user.username}, please try again later.`
    const serversettings = await mongo.db().collection('settings').findOne({ guild: member.guild.id }).catch(e => console.error(e))
    if (!serversettings) return `An error occured when verifying ${self ? 'you' : member.user.username}, please try again later.`
    const bindCursorDoc = db.find({ server: member.guild.id })
    const binds: { server: string, type: string, role: string, asset?: number, group?: number, rank?: number }[] = []
    bindCursorDoc.forEach((doc: any) => { binds.push(doc) })
    const groupData = await this.getRobloxMemberGroups(parseInt(verifyApiData.data.robloxId))
    for (const bind of binds) {
      switch (bind.type) {
        case 'verified':
          const verifiedRole = await member.guild.roles.fetch(bind.role).catch(e => console.error(e))
          if (!verifiedRole) break
          if (verifiedRole.comparePositionTo(member.guild.me.roles.highest) >= 0) await member.roles.add(verifiedRole).catch(e => console.error(e))
          break

        case 'group':

          for (const group of groupData) {
            if ([0, bind.group].includes(group.group.id) && (!bind.rank || group.role.rank === bind.rank)) {
              const groupBindRole = await member.guild.roles.fetch(bind.role).catch(e => console.error(e))
              if (!groupBindRole || groupBindRole.comparePositionTo(member.guild.me.roles.highest) >= 0) continue
              await member.roles.add(groupBindRole).catch(e => console.error(e))
            }
          }

      }
    }
    return self ? `Welcome ${verifyApiData.data.robloxUsername}!` : `${verifyApiData.data.robloxUsername} has been updated.`
  } 
}
