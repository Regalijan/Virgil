import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  Team,
  User,
} from "discord.js";
import common from "../common";
import Sentry from "../sentry";

export = {
  name: "roblox",
  description: "Whois command but for Roblox",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    const user = i.options.getUser("user") ?? i.user;
    const embed = new EmbedBuilder({
      footer: {
        text: "Information provided by Roblox Corporation and Virgil Registry",
      },
    });
    const verifyRegistryReq = await fetch(
      "https://registry.virgil.gg/api/discord/" + user.id,
      {
        headers: {
          authorization: `Bearer ${process.env.REGISTRY_API_KEY}`,
        },
      },
    ).catch((e) => {
      console.error(e);
      Sentry.captureException(e);
    });
    if (!verifyRegistryReq?.ok && verifyRegistryReq?.status !== 404) {
      await i.reply({
        content:
          "An error occurred when looking up this user! Please try again later.",
        ephemeral: true,
      });
      return;
    }

    if (verifyRegistryReq.status === 404) {
      await i.reply({
        content: "This user is not verified!",
        ephemeral: true,
      });
      return;
    }

    const registryData = await verifyRegistryReq.json();

    embed.setURL(`https://www.roblox.com/users/${registryData.id}/profile`);
    embed.setTitle("View Profile");
    const robloxData = await common.getRobloxUserProfile(registryData.id);
    if (!robloxData) {
      await i.reply({
        content:
          "An error occurred when retrieving information from Roblox! Please try again later.",
        ephemeral: true,
      });
      return;
    }

    embed.setAuthor({ name: robloxData.name });
    if (i.member instanceof GuildMember) embed.setColor(i.member.displayColor);
    let bio = robloxData.description;

    // Stop newline spam
    while ((bio.match(/\n/gm) || []).length > 15 || bio.match(/\n\n\n/gm)) {
      const lastN = bio.lastIndexOf("\n");
      bio = bio.slice(0, lastN) + bio.slice(lastN + 1);
    }

    embed.setDescription(bio || "\u200B");
    await i.deferReply();

    const pastNamesReq = await fetch(
      `https://users.roblox.com/v1/users/${registryData.id}/username-history?limit=25&sortOrder=Desc`,
    ).catch((e) => console.error(e));
    embed.addFields({
      name: "Join Date",
      value: new Intl.DateTimeFormat(i.guild?.preferredLocale ?? "en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(robloxData.created.getTime()),
      inline: true,
    });

    if (pastNamesReq?.ok) {
      const pastNamesData = await pastNamesReq.json();

      if (pastNamesData.data?.length) {
        const pastNames: string[] = [];
        for (const { name } of pastNamesData.data) pastNames.push(name);

        embed.addFields({
          name: "Past Usernames",
          value: pastNames.join(", "),
          inline: true,
        });
      }
    }
    const thumbnailReq = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar?userIds=${registryData.id}&size=720x720&format=Png&isCircular=false`,
    ).catch(console.error);
    if (thumbnailReq?.ok) {
      const thumbnailData = await thumbnailReq.json();
      embed.setThumbnail(thumbnailData.data[0].imageUrl);
    }
    const headshotReq = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${registryData.id}&size=720x720&format=Png&isCircular=false`,
    ).catch(console.error);
    if (headshotReq?.ok) {
      const headshotData = await headshotReq.json();

      embed.setAuthor({
        name: robloxData.name,
        iconURL: headshotData.data[0].imageUrl,
        url: `https://www.roblox.com/users/${registryData.id}/profile`,
      });
    }
    if (robloxData.isBanned)
      embed.addFields({ name: "Account Status", value: "Terminated" });
    await i.client.application?.fetch().catch(() => {});
    if (i.client.application?.owner instanceof Team) {
      if (i.client.application.owner.members.has(user.id))
        embed.addFields({
          name: "User Tags",
          value:
            i.client.application.owner.ownerId === user.id
              ? "Bot Owner"
              : "Bot Development Team Member",
        });
    } else if (
      i.client.application?.owner instanceof User &&
      i.client.application.owner.id === i.user.id
    )
      embed.addFields({ name: "User Tags", value: "Bot Owner" });
    await i.followUp({ embeds: [embed] });
  },
};
