import {
  CommandInteraction,
  EmbedBuilder,
  GuildMember,
  Team,
  User,
} from "discord.js";
import common from "../common";
import axios from "axios";
import Sentry from "../sentry";

export = {
  name: "roblox",
  description: "Whois command but for Roblox",
  async exec(i: CommandInteraction): Promise<void> {
    const user = i.options.getUser("user") ?? i.user;
    const embed = new EmbedBuilder({
      footer: {
        text: "Information provided by Roblox Corporation and Virgil Registry",
      },
    });
    const verifyRegistryData = await axios(
      "https://registry.virgil.gg/api/discord/" + user.id,
      {
        headers: {
          authorization: `Bearer ${process.env.REGISTRY_API_KEY}`,
        },
        validateStatus: (s) => {
          return [200, 404].includes(s);
        },
      }
    ).catch((e) => {
      console.error(e);
      Sentry.captureException(e);
    });
    if (!verifyRegistryData) {
      await i.reply({
        content:
          "An error occurred when looking up this user! Please try again later.",
        ephemeral: true,
      });
      return;
    }

    if (verifyRegistryData.status === 404) {
      await i.reply({
        content: "This user is not verified!",
        ephemeral: true,
      });
      return;
    }

    embed.setURL(
      `https://www.roblox.com/users/${verifyRegistryData.data.id}/profile`
    );
    embed.setTitle("View Profile");
    const robloxData = await common.getRobloxUserProfile(
      verifyRegistryData.data.id
    );
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
    while ((bio.match(/\n/gm) || []).length > 15 || bio.match(/\n\n\n/gm)) {
      const lastN = bio.lastIndexOf("\n");
      bio = bio.slice(0, lastN) + bio.slice(lastN + 1);
    }
    embed.setDescription(bio || "\u200B");
    const pastNamesData = await axios(
      `https://users.roblox.com/v1/users/${verifyRegistryData.data.id}/username-history?limit=25&sortOrder=Desc`
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
    if (pastNamesData?.data.data?.length) {
      let pastNamesString = "";
      for (let i = 0; i < pastNamesData.data.data.length; i++) {
        pastNamesString += pastNamesData.data.data[i].name;
        if (i < pastNamesData.data.data.length - 1) pastNamesString += ", ";
      }
      embed.addFields({
        name: "Past Usernames",
        value: pastNamesString,
        inline: true,
      });
    }
    const thumbnailData = await axios(
      `https://thumbnails.roblox.com/v1/users/avatar?userIds=${verifyRegistryData.data.id}&size=720x720&format=Png&isCircular=false`
    ).catch(console.error);
    if (thumbnailData) {
      embed.setThumbnail(thumbnailData.data.data[0].imageUrl);
    }
    const headshotData = await axios(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${verifyRegistryData.data.id}&size=720x720&format=Png&isCircular=false`
    ).catch(console.error);
    if (headshotData) {
      embed.setAuthor({
        name: robloxData.name,
        iconURL: headshotData.data.data[0].imageUrl,
        url: `https://www.roblox.com/users/${verifyRegistryData.data.id}/profile`,
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
    await i.reply({ embeds: [embed] });
  },
};
