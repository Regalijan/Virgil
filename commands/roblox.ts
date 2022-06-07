import {
  CommandInteraction,
  GuildMember,
  MessageEmbed,
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
    const embed = new MessageEmbed({
      footer: {
        text: "Information provided by Roblox Corporation and RoVer Registry",
      },
    });
    const verifyRegistryData = await axios(
      "https://registry.rover.link/discord-to-roblox/" + user.id,
      {
        validateStatus: (s) => {
          return [200, 404].includes(s);
        },
      }
    ).catch((e) => {
      console.error(e);
      Sentry.captureException(e);
    });
    if (!verifyRegistryData)
      return await i.reply({
        content:
          "An error occurred when looking up this user! Please try again later.",
        ephemeral: true,
      });
    if (verifyRegistryData.status === 404)
      return await i.reply({
        content: "This user is not verified!",
        ephemeral: true,
      });
    embed.setURL(
      `https://www.roblox.com/users/${verifyRegistryData.data.robloxId}/profile`
    );
    embed.setTitle("View Profile");
    const robloxData = await common.getRobloxUserProfile(
      verifyRegistryData.data.robloxId
    );
    if (!robloxData)
      return await i.reply({
        content:
          "An error occurred when retrieving information from Roblox! Please try again later.",
        ephemeral: true,
      });
    embed.setAuthor({ name: robloxData.name });
    if (i.member instanceof GuildMember) embed.setColor(i.member.displayColor);
    let bio = robloxData.description;
    while ((bio.match(/\n/gm) || []).length > 15 || bio.match(/\n\n\n/gm)) {
      const lastN = bio.lastIndexOf("\n");
      bio = bio.slice(0, lastN) + bio.slice(lastN + 1);
    }
    embed.setDescription(bio);
    const pastNamesData = await axios(
      `https://users.roblox.com/v1/users/${verifyRegistryData.data.robloxId}/username-history?limit=25&sortOrder=Desc`
    ).catch((e) => console.error(e));
    embed.addField(
      "Join Date",
      new Intl.DateTimeFormat(i.guild?.preferredLocale ?? "en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(robloxData.created.getTime()),
      true
    );
    if (pastNamesData?.data.data?.length) {
      let pastNamesString = "";
      for (let i = 0; i < pastNamesData.data.data.length; i++) {
        pastNamesString += pastNamesData.data.data[i].name;
        if (i < pastNamesData.data.data.length - 1) pastNamesString += ", ";
      }
      embed.addField("Past Usernames", pastNamesString, true);
    }
    const thumbnailData = await axios(
      `https://thumbnails.roblox.com/v1/users/avatar?userIds=${verifyRegistryData.data.robloxId}&size=720x720&format=Png&isCircular=false`
    ).catch((e) => console.error(e));
    if (thumbnailData) {
      embed.setThumbnail(thumbnailData.data.data[0].imageUrl);
      embed.setAuthor({
        name: robloxData.name,
        iconURL: thumbnailData.data.data[0].imageUrl,
        url: `https://www.roblox.com/users/${verifyRegistryData.data.robloxId}/profile`,
      });
    }
    if (robloxData.isBanned) embed.addField("Account Status", "Terminated");
    await i.client.application?.fetch().catch(() => {});
    if (i.client.application?.owner instanceof Team) {
      if (i.client.application.owner.members.has(user.id))
        embed.addField(
          "User Tags",
          i.client.application.owner.ownerId === user.id
            ? "Bot Owner"
            : "Bot Development Team Member"
        );
    } else if (
      i.client.application?.owner instanceof User &&
      i.client.application.owner.id === i.user.id
    )
      embed.addField("User Tags", "Bot Owner");
    await i.reply({ embeds: [embed] });
  },
};
