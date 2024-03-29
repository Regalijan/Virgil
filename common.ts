import redis from "./redis";
import mongo from "./mongo";
import Logger from "./logger";
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
        .findOne({ user: user.id })
        .catch(Logger);
      if (!access_data) {
        const bridgeDataReq = await fetch(
          (process.env.MFA_API ?? "https://mfa.virgil.gg/bridge/") + user.id,
          {
            headers: {
              authorization: process.env.MFA_API_TOKEN,
            },
          },
        ).catch(console.error);
        if (bridgeDataReq?.status !== 200) return false;
        access_data = {
          ...(await bridgeDataReq.json()),
          user: user.id,
        };
        await mongo
          .db("bot")
          .collection("mfa_access_credentials")
          .insertOne({ ...access_data })
          .catch(Logger);
      }
      if (access_data?.expires_at < Date.now()) {
        const refreshReq = await fetch(
          "https://discord.com/api/v10/oauth2/token",
          {
            body: `grant_type=refresh_token&refresh_token=${access_data?.refresh_token}`,
            headers: {
              authorization: `Basic ${Buffer.from(
                process.env.MFA_CLIENT_ID + ":" + process.env.MFA_CLIENT_SECRET,
              ).toString("base64")}`,
              "content-type": "application/x-www-form-urlencoded",
            },
            method: "POST",
          },
        ).catch(console.error);
        if (!refreshReq) return false;
        if ([400, 401].includes(refreshReq.status)) {
          await mongo
            .db("bot")
            .collection("mfa_access_credentials")
            .deleteOne({ user: user.id })
            .catch(Logger);
          return false;
        }

        const refreshData = await refreshReq.json();
        const expires_at = Date.now() + refreshData.expires_in * 1000;
        delete refreshData.expires_in;
        access_data = {
          ...refreshData,
          expires_at,
          user: user.id,
        };
        await mongo
          .db("bot")
          .collection("mfa_access_credentials")
          .insertOne({ ...access_data })
          .catch(Logger);
      }
      const mfaCheckReq = await fetch("https://discord.com/api/v10/users/@me", {
        headers: {
          authorization: `${access_data?.token_type} ${access_data?.access_token}`,
        },
      }).catch(console.error);
      if (!mfaCheckReq) return false;
      if (mfaCheckReq.status === 401) {
        await mongo
          .db("bot")
          .collection("mfa_access_credentials")
          .deleteOne({ user: user.id })
          .catch(Logger);
        return false;
      }

      const mfaCheckData = await mfaCheckReq.json();
      const isEnabled = Boolean(mfaCheckData.mfa_enabled);
      await redis.set(
        `mfaEnabled_${user.id}`,
        JSON.stringify(isEnabled),
        "EX",
        1800,
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
      .catch(console.error);
    if (cachedData) return JSON.parse(cachedData);
    try {
      const apiResponse = await fetch(
        `https://groups.roblox.com/v2/users/${user}/groups/roles`,
      );
      const apiData = await apiResponse.json();
      await redis
        .set(`robloxgroups_${user}`, JSON.stringify(apiData.data), "EX", 900)
        .catch(console.error);
      return apiData.data;
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
      .catch(console.error);
    if (cachedData) return JSON.parse(cachedData);
    try {
      const apiResponse = await fetch(
        `https://friends.roblox.com/v1/users/${user}/friends`,
      );
      const apiData = await apiResponse.json();
      const friendIds: number[] = [];
      for (const friend of apiData.data) friendIds.push(friend.id);
      await redis
        .set(`robloxfriends_${user}`, JSON.stringify(friendIds), "EX", 1800)
        .catch(console.error);
      return friendIds;
    } catch (e) {
      Logger(e);
      return [];
    }
  },

  async getRobloxAssetOwnership(
    user: number,
    item: number,
    itemType?: string,
  ): Promise<boolean> {
    const cachedData = await redis
      .get(`${itemType}_${item}_${user}`)
      .catch(console.error);
    if (cachedData) return JSON.parse(cachedData);
    try {
      const apiResponse = await fetch(
        `https://inventory.roblox.com/v1/users/${user}/items/${itemType}/${item}/is-owned`,
      );
      const ownsItem = await apiResponse.json();
      await redis
        .set(`${itemType}_${item}_${user}`, JSON.stringify(ownsItem), "EX", 900)
        .catch(console.error);
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
      .catch(console.error);
    if (cachedData) return JSON.parse(cachedData);
    try {
      const apiResponse = await fetch(
        `https://accountinformation.roblox.com/v1/users/${user}/roblox-badges`,
      );
      const badgeIds: number[] = [];
      for (const badge of await apiResponse.json()) badgeIds.push(badge.id);
      await redis.set(
        `robloxplatformbadges_${user}`,
        JSON.stringify(badgeIds),
        "EX",
        900,
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
      .catch(console.error);
    if (cachedData) {
      const parsedCache = JSON.parse(cachedData);
      parsedCache.created = new Date(parsedCache.created);
      return parsedCache;
    }
    try {
      const apiResponse = await fetch(
        `https://users.roblox.com/v1/users/${user}`,
      );
      const apiData = await apiResponse.json();
      apiData.created = new Date(apiData.created);
      await redis
        .set(`robloxprofile_${user}`, JSON.stringify(apiData), "EX", 900)
        .catch(console.error);
      return apiData;
    } catch (e) {
      Logger(e);
      return;
    }
  },

  async getRobloxGroupAffiliates(
    group: number,
    relationship: "allies" | "enemies" = "allies",
  ): Promise<number[]> {
    if (!["allies", "enemies"].includes(relationship.toLowerCase()))
      throw new TypeError(
        'relationship must be a value of "allies" or "enemies"',
      );
    const cachedData = await redis
      .get(`${relationship}_${group}`)
      .catch(console.error);
    if (cachedData) return JSON.parse(cachedData);
    try {
      const apiResponse = await fetch(
        `https://groups.roblox.com/v1/groups/${group}/relationships/${relationship}?model.startRowIndex=0&model.maxRows=100`,
      );
      const groups: number[] = [];
      for (const group of (await apiResponse.json()).relatedGroups)
        groups.push(group.id);
      await redis
        .set(`${relationship}_${group}`, JSON.stringify(groups), "EX", 3600)
        .catch(console.error);
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
    displayName: string,
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
          : `${displayName} (${robloxUsername})`,
      );

    return name.length > 32 ? name.substring(0, 32) : name;
  },

  async verify(
    member: GuildMember,
    self: boolean = true,
    interaction?:
      | ButtonInteraction
      | CommandInteraction
      | UserContextMenuCommandInteraction,
  ): Promise<{ content: string; errored: boolean; verified: boolean }> {
    if (
      !member.guild.members.me?.permissions.has(
        PermissionsBitField.Flags.ManageRoles,
      )
    )
      return {
        content: "I do not have permission to manage roles!",
        errored: true,
        verified: false,
      };

    const bypassesDB = mongo.db("bot").collection("bind_bypasses");

    if (
      !self &&
      (await bypassesDB.findOne({
        guild: member.guild.id,
        $or: [
          {
            id: member.id,
          },
          {
            id: { $in: member.roles.cache.map((r) => r.id) },
          },
        ],
      }))
    ) {
      return {
        content: "User matches a bypass condition",
        errored: false,
        verified: false,
      };
    }

    const db = mongo.db("bot").collection("binds");
    const verifyApiData = await fetch(
      `https://registry.virgil.gg/api/discord/${member.id}`,
      {
        headers: {
          authorization: `Bearer ${process.env.REGISTRY_API_KEY}`,
        },
      },
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
    if (!verifyApiData?.ok) {
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
      }

      if (rolesToRemove.length)
        await member.roles.remove(rolesToRemove).catch(Logger);

      for (const unverifiedBind of unvBinds) {
        const unvRole = await member.guild.roles
          .fetch(unverifiedBind.role)
          .catch(console.error);
        if (
          !unvRole ||
          unvRole.comparePositionTo(member.guild.members.me?.roles.highest) <=
            0 ||
          member.roles.cache.has(unvRole.id)
        )
          continue;
        unvRoles.push(unvRole);
      }

      if (unvRoles.length)
        await member.roles.add(unvRoles).catch(console.error);
      return {
        content: self
          ? "You must be new, click the button to get started."
          : `${member.user.username} appears to not be verified.`,
        errored: false,
        verified: false,
      };
    }
    await interaction?.deferReply({ ephemeral: !self });

    const {
      id: robloxUserId,
      username: robloxUsername,
    }: { id: number; username: string } = await verifyApiData.json();
    const userProfileData = await this.getRobloxUserProfile(robloxUserId);
    if (!userProfileData?.id)
      return {
        content: `An error occurred when verifying ${
          self ? "you" : member.user.username
        }, please try again later.`,
        errored: true,
        verified: false,
      };
    const serversettings = await mongo
      .db("bot")
      .collection("settings")
      .findOne({ guild: member.guild.id })
      .catch(console.error);
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
        PermissionsBitField.Flags.ManageNicknames,
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
            userProfileData.name ?? robloxUsername,
            robloxUserId,
            userProfileData.displayName ?? robloxUsername,
          ),
        )
        .catch(console.error);

    const groupData = await this.getRobloxMemberGroups(robloxUserId);

    if (!groupData)
      return {
        content: `An error occurred when verifying ${
          self ? "you" : member.user.username
        }, please try again later.`,
        errored: true,
        verified: false,
      };

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
        bindRole.comparePositionTo(member.guild.members.me.roles.highest) >= 0
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

        case "friend":
          if (!bind.friend) continue;
          const friends = await this.getRobloxUserFriends(robloxUserId);
          giveRole = friends.includes(bind.friend);
          break;

        default:
          if (!bind.asset) continue;
          giveRole = await this.getRobloxAssetOwnership(
            robloxUserId,
            bind.asset,
            bind.type,
          );
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

    await redis.set(`recentlyverified_${member.id}`, "1", "EX", 7200);

    return {
      content: self
        ? `Welcome ${robloxUsername}!`
        : `${robloxUsername} has been updated.`,
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
      .catch(Logger);

    return Boolean(premiumDoc);
  },
};
