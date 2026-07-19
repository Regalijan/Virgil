import {
  ChatInputCommandInteraction,
  DiscordAPIError,
  GuildMember,
  MessageFlagsBitField,
} from "discord.js";
import logger from "../logger.js";

export const name = "reversesearch";

export async function exec(i: ChatInputCommandInteraction) {
  let targetUser = i.options.getString("username", true);

  if (!targetUser.startsWith("#")) {
    const userResolveReq = await fetch(
      "https://users.roblox.com/v1/usernames/users",
      {
        body: JSON.stringify({
          excludeBannedUsers: false,
          usernames: [targetUser],
        }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      },
    );

    if (!userResolveReq.ok) {
      await i.reply({
        content: "Failed to look up that username",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }

    const resolvedUser = await userResolveReq.json();
    if (!resolvedUser.data?.length) {
      await i.reply({
        content: "No user exists with that name",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }

    targetUser = resolvedUser.data[0].id;
  } else targetUser = targetUser.replace("#", "");

  const registryReq = await fetch(
    `https://registry.virgil.gg/api/roblox/${targetUser}`,
    {
      headers: {
        authorization: `Bearer ${process.env.REGISTRY_API_KEY}`,
      },
    },
  );

  if (registryReq.status === 404) {
    await i.reply({
      content: "This user is not verified",
      flags: [MessageFlagsBitField.Flags.Ephemeral],
    });
    return;
  }

  if (!registryReq.ok) {
    await i.reply({
      content: "Lookup failed, try again later",
      flags: [MessageFlagsBitField.Flags.Ephemeral],
    });
    return;
  }

  const userIds: string[] = await registryReq.json();
  const usersInServer = [];

  for (const user of userIds) {
    let guildUser: GuildMember | undefined;

    try {
      guildUser = await i.guild?.members.fetch(user);

      if (!guildUser) continue;

      usersInServer.push(`<@${guildUser.id}>`);
    } catch (e) {
      if (e instanceof DiscordAPIError && e.status === 404) continue;
      logger(e);
      await i.reply({
        content: "Failed to retrieve users",
        flags: [MessageFlagsBitField.Flags.Ephemeral],
      });
      return;
    }
  }

  await i.reply({
    content: `Accounts in this server are: ${usersInServer.join(", ")}`,
    flags: [MessageFlagsBitField.Flags.Ephemeral],
  });
}
