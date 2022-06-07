import {
  CommandInteraction,
  GuildMember,
  MessageEmbed,
  Role,
  User,
} from "discord.js";
import { createHash, randomBytes } from "crypto";
import mongo from "../mongo";

const filterBypasses = mongo.db("bot").collection("filter_bypass");
const wordsDB = mongo.db("bot").collection("banned_words");

function getMentionableID(mentionable: any): string {
  if (mentionable instanceof GuildMember) return mentionable.user.id;
  if (mentionable instanceof Role || mentionable instanceof User)
    return mentionable.id;
  throw new Error("Failed to find suitable snowflake.");
}

export = {
  name: "filter",
  async exec(i: CommandInteraction): Promise<void> {
    const command = i.options.getSubcommand(true);

    switch (command) {
      case "add":
        const word = i.options.getString("word", true);
        const case_sensitive =
          i.options.getBoolean("case_sensitive", false) ?? false;
        if (word.length > 250)
          return await i.reply({
            content: "Filtered words must be 250 characters or less.",
            ephemeral: true,
          });
        const filterID = createHash("sha256")
          .update(randomBytes(512))
          .digest("base64url");
        await wordsDB.insertOne({
          case_sensitive,
          filter: word,
          id: filterID,
          server: i.guildId,
          type: i.options.getInteger("filter_type", true),
        });
        return await i.reply({
          content: `Filter created! ID: ${filterID}`,
          ephemeral: true,
        });

      case "add_bypass":
        const addMentionable = i.options.getMentionable("entity", true);
        const addMentionableId = getMentionableID(addMentionable);
        const hasBypassToAddDoc = await filterBypasses.findOne({
          id: addMentionableId,
          server: i.guildId,
        });
        if (hasBypassToAddDoc)
          return await i.reply({
            content: "That entity already has a bypass applied!",
            ephemeral: true,
          });
        await filterBypasses.insertOne({
          id: addMentionableId,
          server: i.guildId,
        });
        return await i.reply({ content: "Bypass applied!", ephemeral: true });

      case "list":
        const filterList = await wordsDB.find({ server: i.guildId }).toArray();
        const embeds: MessageEmbed[] = [new MessageEmbed()];
        embeds[0].setDescription(
          filterList.length
            ? "List of word filters for this server"
            : "No word filters set for this server"
        );
        if (i.member instanceof GuildMember)
          embeds[0].setColor(i.member.displayColor);
        let embedIndex = 0;
        const typeMap: { [k: number]: any } = {
          1: "exact",
          2: "wildcard",
        };
        for (const filter of filterList) {
          if (embeds[embedIndex].fields.length >= 25) {
            if (embeds.length >= 10) break;
            embedIndex++;
            embeds.push(new MessageEmbed());
          }
          embeds[embedIndex].addField(
            filter.id,
            `${filter.filter} - (${typeMap[filter.type]}, ${
              filter.case_sensitive ? "" : "not "
            }case sensitive)`
          );
        }
        return await i.reply({ embeds });

      case "list_bypasses":
        const bypasses = await filterBypasses
          .find({
            server: i.guildId,
          })
          .toArray();
        const bypassEmbed = new MessageEmbed().setTitle("Filter Bypasses");
        let bypassString = "";
        for (const bypass of bypasses) {
          if (bypass.id.length + bypassString.length > 4096) {
            bypassString = bypassString.substring(0, 4093) + "...";
            break;
          }
          bypassString += `\n${bypass.id}`;
        }

        return await i.reply({ embeds: [bypassEmbed] });

      case "remove":
        const idToRemove = i.options.getString("id", true);
        await wordsDB.deleteOne({
          id: idToRemove,
          server: i.guildId,
        });
        return await i.reply({ content: "Filter deleted!", ephemeral: true });

      case "remove_bypass":
        const removeMentionable = i.options.getMentionable("entity", true);
        const removeMentionableId = getMentionableID(removeMentionable);
        await filterBypasses.deleteOne({
          id: removeMentionableId,
          server: i.guildId,
        });
        return await i.reply({ content: "Bypass deleted!", ephemeral: true });

      default:
        return await i.reply({
          content: "Unrecognized command!",
          ephemeral: true,
        });
    }
  },
};
