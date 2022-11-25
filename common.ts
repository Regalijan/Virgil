import axios from "axios";
import redis from "./redis";
import mongo from "./mongo";
import Logger from "./logger";
import Sentry from "./sentry";
import {
  ButtonInteraction,
  CommandInteraction,
  Guild,
  GuildMember,
  PermissionsBitField,
  RoleResolvable,
  Team,
  User,
  UserContextMenuCommandInteraction,
} from "discord.js";

export = {
  async isDeveloper(user: User): Promise<boolean> {
    const cachedDevData = await redis.get("developers");
    if (cachedDevData) {
      const cachedDevs = JSON.parse(cachedDevData);
      return cachedDevs.includes(user.id);
    }
    const app = await user.client.application?.fetch();
    if (!app) return false;
    const devs: string[] = [];
    if (app.owner instanceof Team) {
      devs.push(...app.owner.members.map((m) => m.id));
    } else if (app.owner instanceof User) {
      devs.push(app.owner.id);
    }
    await redis.set("developers", JSON.stringify(devs));
    return devs.includes(user.id);
  },

  async isMFAEnabled(user: User): Promise<boolean> {
    if (
      !process.env.MFA_API_TOKEN ||
      !process.env.MFA_CLIENT_ID ||
      !process.env.MFA_CLIENT_SECRET
    )
      return false;
    let enabled = await redis.get(`mfaEnabled_${user.id}`);
    if (!enabled) {
      let access_data = await mongo
        .db("bot")
        .collection("mfa_access_credentials")
        .findOne({ user: user.id });
      if (!access_data) {
        const bridgeDataReq = await axios(
          (process.env.MFA_API ?? "https://mfa.virgil.gg/bridge/") + user.id,
          {
            headers: {
              authorization: process.env.MFA_API_TOKEN,
            },
          }
        ).catch(console.error);
        if (bridgeDataReq?.status !== 200) return false;
        access_data = {
          ...bridgeDataReq.data,
          user: user.id,
        };
        await mongo
          .db("bot")
          .collection("mfa_access_credentials")
          .insertOne({ ...access_data });
      }
      if (access_data?.expires_at < Date.now()) {
        const refreshReq = await axios(
          "https://discord.com/api/v10/oauth2/token",
          {
            headers: {
              authorization: `Basic ${Buffer.from(
                process.env.MFA_CLIENT_ID + ":" + process.env.MFA_CLIENT_SECRET
              ).toString("base64")}`,
              "content-type": "application/x-www-form-urlencoded",
            },
            method: "POST",
            data: `grant_type=refresh_token&refresh_token=${access_data?.refresh_token}`,
          }
        ).catch(console.error);
        if (!refreshReq) return false;
        if ([400, 401].includes(refreshReq.status)) {
          await mongo
            .db("bot")
            .collection("mfa_access_credentials")
            .deleteOne({ user: user.id });
          return false;
        }
        const expires_at = Date.now() + refreshReq.data.expires_in * 1000;
        delete refreshReq.data.expires_in;
        access_data = {
          ...refreshReq.data,
          expires_at,
          user: user.id,
        };
        await mongo
          .db("bot")
          .collection("mfa_access_credentials")
          .insertOne({ ...access_data });
      }
      const mfaCheckReq = await axios("https://discord.com/api/v10/users/@me", {
        headers: {
          authorization: `${access_data?.token_type} ${access_data?.access_token}`,
        },
      }).catch(console.error);
      if (!mfaCheckReq) return false;
      if (mfaCheckReq.status === 401) {
        await mongo
          .db("bot")
          .collection("mfa_access_credentials")
          .deleteOne({ user: user.id });
        return false;
      }
      const isEnabled = Boolean(mfaCheckReq.data.mfa_enabled);
      await redis.set(
        `mfaEnabled_${user.id}`,
        JSON.stringify(isEnabled),
        "EX",
        1800
      );
      return isEnabled;
    } else return JSON.parse(enabled);
  },

  async getRobloxMemberGroups(user: number): Promise<
    {
      group: { id: number; name: string; memberCount: number };
      role: { id: number; name: string; rank: number };
    }[]
  > {
    const cachedData = await redis
      .get(`robloxgroups_${user}`)
      .catch((e) => console.error(e));
    if (cachedData) return JSON.parse(cachedData);
    try {
      const apiResponse = await axios(
        `https://groups.roblox.com/v2/users/${user}/groups/roles`
      );
      await redis
        .set(
          `robloxgroups_${user}`,
          JSON.stringify(apiResponse.data.data),
          "EX",
          900
        )
        .catch((e) => console.error(e));
      return apiResponse.data.data;
    } catch (e) {
      Logger(e);
      return [];
    }
  },

  async isUserInGroup(user: number, group: number): Promise<boolean> {
    const userGroupData = await this.getRobloxMemberGroups(user);
    if (!userGroupData.length) return false;
    const groupIds = [];
    for (const group of userGroupData) groupIds.push(group.group.id);
    return groupIds.includes(group);
  },

  async getRobloxUserFriends(user: number): Promise<number[]> {
    const cachedData = await redis
      .get(`robloxfriends_${user}`)
      .catch((e) => console.error(e));
    if (cachedData) return JSON.parse(cachedData);
    try {
      const apiResponse = await axios(
        `https://friends.roblox.com/v1/users/${user}/friends`
      );
      const friendIds: number[] = [];
      for (const friend of apiResponse.data.data) friendIds.push(friend.id);
      await redis
        .set(`robloxfriends_${user}`, JSON.stringify(friendIds), "EX", 1800)
        .catch((e) => console.error(e));
      return friendIds;
    } catch (e) {
      Logger(e);
      return [];
    }
  },

  async getRobloxAssetOwnership(
    user: number,
    item: number,
    itemType: "Asset" | "Badge" | "Bundle" | "GamePass" = "Badge"
  ): Promise<boolean> {
    // Accepted values are "Asset", "Badge", "Bundle", and "GamePass"
    const cachedData = await redis
      .get(`${itemType}_${item}_${user}`)
      .catch((e) => console.error(e));
    if (cachedData) return JSON.parse(cachedData);
    try {
      const apiResponse = await axios(
        `https://inventory.roblox.com/v1/users/${user}/items/${itemType}/${item}/is-owned`
      );
      const ownsItem = apiResponse.data;
      await redis
        .set(`${itemType}_${item}_${user}`, JSON.stringify(ownsItem), "EX", 900)
        .catch((e) => console.error(e));
      return ownsItem;
    } catch (e) {
      Logger(e);
      return false;
    }
  },

  async getRobloxPlatformBadges(user: number): Promise<number[]> {
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
    const cachedData = await redis
      .get(`robloxplatformbadges_${user}`)
      .catch((e) => console.error(e));
    if (cachedData) return JSON.parse(cachedData);
    try {
      const apiResponse = await axios(
        `https://accountinformation.roblox.com/v1/users/${user}/roblox-badges`
      );
      const badgeIds: number[] = [];
      for (const badge of apiResponse.data) badgeIds.push(badge.id);
      await redis.set(
        `robloxplatformbadges_${user}`,
        JSON.stringify(badgeIds),
        "EX",
        900
      );
      return badgeIds;
    } catch (e) {
      Logger(e);
      return [];
    }
  },

  async getRobloxUserProfile(user: number): Promise<{
    description: string;
    created: Date;
    isBanned: boolean;
    externalAppDisplayName: string;
    id: number;
    name: string;
    displayName: string;
  } | void> {
    const cachedData = await redis
      .get(`robloxprofile_${user}`)
      .catch((e) => console.error(e));
    if (cachedData) {
      const parsedCache = JSON.parse(cachedData);
      parsedCache.created = new Date(parsedCache.created);
      return parsedCache;
    }
    try {
      const apiResponse = await axios(
        `https://users.roblox.com/v1/users/${user}`
      );
      apiResponse.data.created = new Date(apiResponse.data.created);
      await redis
        .set(
          `robloxprofile_${user}`,
          JSON.stringify(apiResponse.data),
          "EX",
          900
        )
        .catch((e) => console.error(e));
      return apiResponse.data;
    } catch (e) {
      Logger(e);
      return;
    }
  },

  async getRobloxGroupAffiliates(
    group: number,
    relationship: "allies" | "enemies" = "allies"
  ): Promise<number[]> {
    if (!["allies", "enemies"].includes(relationship.toLowerCase()))
      throw new TypeError(
        'relationship must be a value of "allies" or "enemies"'
      );
    const cachedData = await redis
      .get(`${relationship}_${group}`)
      .catch((e) => console.error(e));
    if (cachedData) return JSON.parse(cachedData);
    try {
      const apiResponse = await axios(
        `https://groups.roblox.com/v1/groups/${group}/relationships/${relationship}?model.startRowIndex=0&model.maxRows=100`
      );
      const groups: number[] = [];
      for (const group of apiResponse.data.relatedGroups) groups.push(group.id);
      await redis
        .set(`${relationship}_${group}`, JSON.stringify(groups), "EX", 3600)
        .catch((e) => console.error(e));
      return groups;
    } catch (e) {
      Logger(e);
      return [];
    }
  },

  formatName(
    template: string,
    discordUsername: string,
    discordId: string,
    serverName: string,
    robloxUsername: string,
    robloxId: number,
    displayName: string
  ): string {
    const name = template
      .replaceAll("{{USERNAME}}", robloxUsername)
      .replaceAll("{{DISPLAYNAME}}", displayName)
      .replaceAll("{{ROBLOXID}}", robloxId.toString())
      .replaceAll("{{DISCORDNAME}}", discordUsername)
      .replaceAll("{{DISCORDID}}", discordId)
      .replaceAll("{{SERVER}}", serverName)
      .replaceAll(
        "{{SMARTNAME}}",
        robloxUsername === displayName
          ? robloxUsername
          : `${displayName} (${robloxUsername})`
      );

    return name.length > 32 ? name.substring(0, 32) : name;
  },

  async verify(
    member: GuildMember,
    self: boolean = true,
    interaction:
      | ButtonInteraction
      | CommandInteraction
      | UserContextMenuCommandInteraction
  ): Promise<{ content: string; errored: boolean; verified: boolean }> {
    if (
      !member.guild.members.me?.permissions.has(
        PermissionsBitField.Flags.ManageRoles
      )
    )
      return {
        content: "I do not have permission to manage roles!",
        errored: true,
        verified: false,
      };
    const db = mongo.db("bot").collection("binds");
    const verifyApiData = await axios(
      `https://registry.virgil.gg/api/discord/${member.id}`,
      {
        headers: {
          authorization: `Bearer ${process.env.REGISTRY_API_KEY}`,
        },
      }
    ).catch(() => {});
    const bindCursorDoc = db.find({ server: member.guild.id });
    const binds: {
      server: string;
      type: string;
      role: string;
      friend?: number;
      asset?: number;
      group?: number;
      rank?: number;
    }[] = [];
    for (const doc of await bindCursorDoc.toArray()) {
      const anyDoc: any = doc;
      binds.push(anyDoc);
    }
    if (!verifyApiData) {
      const unvBinds: any = [];
      const unvRoles: RoleResolvable[] = [];
      const rolesToRemove: RoleResolvable[] = [];
      for (const b of binds) {
        if (b.type === "unverified") unvBinds.push(b);
        else {
          const roleToRemove = member.guild.roles.cache.get(b.role);
          if (
            roleToRemove &&
            roleToRemove.position <
              member.guild.members.me?.roles.highest?.position
          ) {
            rolesToRemove.push(roleToRemove);
          }
        }
        if (rolesToRemove.length)
          await member.roles.remove(rolesToRemove).catch((e) => {
            process.env.DSN ? Sentry.captureException(e) : console.error(e);
          });
      }
      for (const unverifiedBind of unvBinds) {
        const unvRole = await member.guild.roles
          .fetch(unverifiedBind.role)
          .catch((e) => console.error(e));
        if (
          !unvRole ||
          unvRole.comparePositionTo(member.guild.members.me?.roles.highest) <=
            0 ||
          member.roles.cache.has(unvRole.id)
        )
          continue;
        unvRoles.push(unvRole);
      }
      await member.roles.add(unvRoles).catch((e) => {
        Logger(e);
      });
      return {
        content: self
          ? "You must be new, click the button to get started."
          : `${member.user.username} appears to not be verified.`,
        errored: false,
        verified: false,
      };
    }
    await interaction.deferReply({ ephemeral: !self });

    const robloxUserId: number = verifyApiData.data.id;
    const userProfileData = await this.getRobloxUserProfile(robloxUserId);
    if (!userProfileData)
      return {
        content: `An error occured when verifying ${
          self ? "you" : member.user.username
        }, please try again later.`,
        errored: true,
        verified: false,
      };
    const serversettings = await mongo
      .db("bot")
      .collection("settings")
      .findOne({ guild: member.guild.id })
      .catch((e) => console.error(e));
    if (!serversettings)
      return {
        content: `The server settings are not ready, ${
          member.permissions.has(PermissionsBitField.Flags.ManageGuild)
            ? ""
            : "ask your server admin to"
        } run the \`/initialize\` command.`,
        errored: true,
        verified: false,
      };
    if (
      member.manageable &&
      member.guild.members.me.permissions.has(
        PermissionsBitField.Flags.ManageNicknames
      ) &&
      serversettings.lockNicknames
    )
      await member
        .setNickname(
          this.formatName(
            serversettings.nicknameformat ?? "{{SMARTNAME}}",
            member.user.username,
            member.id,
            member.guild.name,
            userProfileData.name ?? verifyApiData.data.username,
            verifyApiData.data.id,
            userProfileData.displayName ?? verifyApiData.data.robloxUsername
          )
        )
        .catch((e) => console.error(e));

    const groupData = await this.getRobloxMemberGroups(robloxUserId);
    const groupObjs: { [k: number]: number } = {};
    for (const group of groupData) groupObjs[group.group.id] = group.role.rank;
    const rolesToAdd: RoleResolvable[] = [];
    const rolesToRemove: RoleResolvable[] = [];
    for (const bind of binds) {
      const bindRole = await member.guild.roles
        .fetch(bind.role)
        .catch(console.error);
      if (
        !bindRole ||
        bindRole.comparePositionTo(member.guild.members.me.roles.highest) >=
          0 ||
        member.roles.cache.has(bindRole.id)
      )
        continue;
      let giveRole = false;
      switch (bind.type) {
        case "verified":
          giveRole = true;
          break;

        case "group":
          if (typeof bind.group === "undefined") continue;
          if (
            (!groupObjs[bind.group] && bind.rank === 0) ||
            (groupObjs[bind.group] && !bind.rank) ||
            bind.rank === groupObjs[bind.group]
          ) {
            giveRole = true;
          }
          break;

        case "badge":
          if (!bind.asset) continue;
          const ownsBadge = await this.getRobloxAssetOwnership(
            robloxUserId,
            bind.asset
          );
          giveRole = ownsBadge;
          break;

        case "gamepass":
          if (!bind.asset) continue;
          const ownsGamePass = await this.getRobloxAssetOwnership(
            robloxUserId,
            bind.asset,
            "GamePass"
          );
          giveRole = ownsGamePass;
          break;

        case "bundle":
          if (!bind.asset) continue;
          const ownsBundle = await this.getRobloxAssetOwnership(
            robloxUserId,
            bind.asset,
            "Bundle"
          );
          giveRole = ownsBundle;
          break;

        case "asset":
          if (!bind.asset) continue;
          const ownsAsset = await this.getRobloxAssetOwnership(
            robloxUserId,
            bind.asset,
            "Asset"
          );
          giveRole = ownsAsset;
          break;

        case "friend":
          if (!bind.friend) continue;
          const friends = await this.getRobloxUserFriends(robloxUserId);
          giveRole = friends.includes(bind.friend);
          break;
      }
      if (giveRole && !member.roles.cache.has(bindRole.id))
        rolesToAdd.push(bindRole.id);
      else if (
        !giveRole &&
        member.roles.cache.has(bindRole.id) &&
        !rolesToAdd.includes(bindRole.id)
      )
        rolesToRemove.push(bindRole.id);
    }
    await member.roles.add(rolesToAdd);
    await member.roles.remove(rolesToRemove);
    return {
      content: self
        ? `Welcome ${verifyApiData.data.username}!`
        : `${verifyApiData.data.username} has been updated.`,
      errored: false,
      verified: true,
    };
  },

  async isPremium(guild: Guild): Promise<boolean> {
    function getTeamMemberIds(): string[] {
      if (!(guild.client.application?.owner instanceof Team)) return [];
      const ids: string[] = [];
      guild.client.application.owner.members.each((member) => {
        ids.push(member.id);
      });
      return ids;
    }

    if (!guild.client.application?.owner)
      await guild.client.application?.fetch();

    if (
      guild.client.application?.owner instanceof User &&
      (await guild.members
        .fetch(guild.client.application?.owner.id)
        .catch(() => {}))
    )
      return true;

    if (
      guild.client.application?.owner instanceof Team &&
      getTeamMemberIds().length &&
      guild.members.cache.hasAny(...getTeamMemberIds())
    )
      return true;

    const premiumStore = mongo.db("bot").collection("premium");
    const premiumDoc = await premiumStore
      .findOne({ guild: guild.id })
      .catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });

    return Boolean(premiumDoc);
  },
};
