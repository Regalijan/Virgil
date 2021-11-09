import { config as dotenv } from "dotenv";
import { readdirSync } from "fs";
import { unlink, writeFile } from "fs/promises";
import { join } from "path";
import {
  ApplicationCommandData,
  ButtonInteraction,
  CategoryChannel,
  Client,
  CommandInteraction,
  ContextMenuInteraction,
  GuildMember,
  Interaction,
  MessageEmbed,
  NewsChannel,
  PermissionResolvable,
  ShardClientUtil,
  StageChannel,
  StoreChannel,
  TextChannel,
  VoiceChannel,
} from "discord.js";
import axios from "axios";
import Sentry from "./sentry";
import db from "./mongo";
import redis from "./redis";
import { randomBytes } from "crypto";
import { Agent } from "https";

db.connect();
dotenv();

const cmds: Map<
  string,
  {
    name: string;
    permissions?: PermissionResolvable[];
    interactionData: ApplicationCommandData;
    privileged?: boolean;
    exec(i: CommandInteraction): Promise<void>;
  }
> = new Map();

const userContextCommands: Map<
  string,
  {
    name: string;
    permissions?: PermissionResolvable[];
    interactionData: ApplicationCommandData;
    exec(i: ContextMenuInteraction): Promise<void>;
  }
> = new Map();

const messageContextCommands: Map<
  string,
  {
    name: string;
    permissions?: PermissionResolvable[];
    interactionData: ApplicationCommandData;
    exec(i: ContextMenuInteraction): Promise<void>;
  }
> = new Map();

const buttonCommands: Map<
  string,
  {
    name: string;
    permissions?: PermissionResolvable[];
    interactionData: ApplicationCommandData;
    exec(i: ButtonInteraction): Promise<void>;
  }
> = new Map();

for (const file of readdirSync(join(__dirname, "commands")).filter((f) =>
  f.endsWith(".js")
)) {
  const commandFile = require(`./commands/${file}`);
  cmds.set(commandFile.name, commandFile);
}

for (const file of readdirSync(join(__dirname, "usercontext")).filter((f) =>
  f.endsWith(".js")
)) {
  const ucFile = require(`./usercontext/${file}`);
  userContextCommands.set(ucFile.name, ucFile);
}

for (const file of readdirSync(join(__dirname, "messagecontext")).filter((f) =>
  f.endsWith(".js")
)) {
  const mcFile = require(`./messagecontext/${file}`);
  messageContextCommands.set(mcFile.name, mcFile);
}

for (const file of readdirSync(join(__dirname, "button")).filter((f) =>
  f.endsWith(".js")
)) {
  const bFile = require(`./button/${file}`);
  buttonCommands.set(bFile.name, bFile);
}

const bot = new Client({
  intents: [
    "GUILDS",
    "GUILD_BANS",
    "GUILD_MEMBERS",
    "GUILD_MESSAGES",
    "GUILD_VOICE_STATES",
  ],
});

bot.login().catch((e) => {
  process.env.DSN ? Sentry.captureException(e) : console.error(e);
  process.exit();
});

const mongo = db.db("bot");

if (process.env.ENABLEDEBUG)
  bot.on("debug", function (m) {
    console.log(m);
  });

bot.once("ready", function (client) {
  console.log(
    `Shard ${client.shard?.ids[0]} ready with ${client.guilds.cache.size} guilds.`
  );
});

bot.on("interactionCreate", async function (i: Interaction): Promise<void> {
  if (i.isContextMenu()) {
    if (i.targetType === "USER") {
      if (!userContextCommands.has(i.commandName)) return;
      const contextCommand = userContextCommands.get(i.commandName);
      const contextMember = await i.guild?.members
        .fetch(i.user.id)
        .catch((e) => {
          process.env.DSN ? Sentry.captureException(e) : console.error(e);
        });
      if (
        contextCommand?.permissions?.length &&
        !contextMember?.permissions.has(contextCommand.permissions)
      ) {
        return await i
          .reply({ content: "You cannot run this command!", ephemeral: true })
          .catch((e) => {
            process.env.DSN ? Sentry.captureException(e) : console.error(e);
          });
      }
      try {
        await contextCommand?.exec(i);
      } catch (e) {
        if (!process.env.DSN) console.error(e);
        await i
          .reply({
            content: `Oops! An error occurred when running this command! If you contact the developer, give then this information: \`Error: ${
              process.env.DSN ? Sentry.captureException(e) : e
            }\``,
            ephemeral: true,
          })
          .catch((e) => {
            process.env.DSN ? Sentry.captureException(e) : console.error(e);
          });
      }
    } else if (i.targetType === "MESSAGE") {
      const msgCommand = messageContextCommands.get(i.commandName);
      if (!msgCommand)
        return await i.reply({
          content:
            "Uh oh! The command could not be found! This might mean that a command was removed from the bot but the context app still exists.",
          ephemeral: true,
        });
      const msgContextMember = await i.guild?.members
        .fetch(i.user.id)
        .catch((e) => {
          process.env.DSN ? Sentry.captureException(e) : console.error(e);
        });
      if (
        msgCommand?.permissions?.length &&
        !msgContextMember?.permissions.has(msgCommand.permissions)
      ) {
        return await i
          .reply({ content: "You cannot run this command!", ephemeral: true })
          .catch((e) => {
            process.env.DSN ? Sentry.captureException(e) : console.error(e);
          });
      }
      try {
        await msgCommand?.exec(i);
      } catch (e) {
        if (!process.env.DSN) console.error(e);
        await i
          .reply({
            content: `Oops! An error occurred when running this command! If you contact the developer, give them this information: \`Error: ${
              process.env.DSN ? Sentry.captureException(e) : e
            }\``,
            ephemeral: true,
          })
          .catch((e) => {
            process.env.DSN ? Sentry.captureException(e) : console.error(e);
          });
      }
    }
    if (process.env.DSN) {
      Sentry.captureEvent({
        user: { id: i.user.id },
        timestamp: Date.now(),
        message: `${i.commandName} was ran`,
      });
    }
    return;
  }

  if (i.isButton()) {
    const buttonCommand = buttonCommands.get(i.customId);
    if (!buttonCommand) {
      return await i.reply({
        content:
          "Uh oh! Looks like this button is no longer active! This means that the command associated with this button was removed.",
        ephemeral: true,
      });
    }
    if (
      buttonCommand?.permissions?.length &&
      !i.memberPermissions?.has(buttonCommand.permissions)
    ) {
      return await i.reply({
        content: "You cannot run this command!",
        ephemeral: true,
      });
    }
    try {
      await buttonCommand.exec(i);
    } catch (e) {
      if (!process.env.DSN) console.error(e);
    }
    if (process.env.DSN) {
      Sentry.captureEvent({
        user: { id: i.user.id },
        timestamp: Date.now(),
        message: `Button ${i.customId} was ran`,
      });
    }
  }

  if (!i.isCommand() || !cmds.has(i.commandName)) return;
  try {
    const command = cmds.get(i.commandName);
    if (
      !i.channel ||
      !["GUILD_PRIVATE_THREAD", "GUILD_PUBLIC_THREAD", "GUILD_TEXT"].includes(
        i.channel.type
      )
    ) {
      await i
        .reply({
          content:
            "Hey! You can't run commands here! They may only be run in a thread or a standard text channel.",
          ephemeral: true,
        })
        .catch((e: any) => {
          process.env.DSN ? Sentry.captureException(e) : console.error(e);
        });
      return;
    }

    const interactionUser = await i.guild?.members.fetch(i.user.id);
    if (
      command?.permissions?.length &&
      !interactionUser?.permissions.has(command.permissions)
    ) {
      await i
        .reply({ content: "You cannot run this command!", ephemeral: true })
        .catch((e: any) => {
          process.env.DSN ? Sentry.captureException(e) : console.error(e);
        });
      return;
    }

    await command?.exec(i);
    if (!command?.privileged) return;
    const settings = await mongo
      .collection("settings")
      .findOne({ guild: i.guild?.id });
    if (!settings?.commandLogChannel) return;
    const logChannel = await i.guild?.channels
      .fetch(settings.commandLogChannel)
      .catch((e) => console.error(e));
    if (
      !logChannel ||
      logChannel.type !== "GUILD_TEXT" ||
      !bot.user ||
      !logChannel.permissionsFor(bot.user.id)?.has("SEND_MESSAGES")
    )
      return;
    const embed = new MessageEmbed({
      author: {
        name: i.user.tag,
        iconURL: i.user.displayAvatarURL({ dynamic: true }),
      },
      description: `Ran the \`${command.name}\` command.`,
    });
    if (i.member instanceof GuildMember) embed.setColor(i.member.displayColor);
    await logChannel.send({ embeds: [embed] }).catch((e) => console.error(e));
  } catch (e) {
    if (!process.env.DSN) console.error(e);
    await i
      .reply({
        content: `Oops! An error occurred when running this command! If you contact the developer, give them this information: \`Error: ${
          process.env.DSN ? Sentry.captureException(e) : e
        }\``,
        ephemeral: true,
      })
      .catch((e: any) => console.error(e));
  }
  if (process.env.DSN) {
    Sentry.captureEvent({
      user: { id: i.user.id },
      timestamp: Date.now(),
      message: `${i.commandName} was ran`,
    });
  }
});

bot.on("channelCreate", async function (channel): Promise<void> {
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: channel.guild.id })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (!settings?.channelCreateLogChannel) return;
  const logChannel = await channel.guild.channels
    .fetch(settings.channelCreateLogChannel)
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (
    !logChannel ||
    logChannel.type !== "GUILD_TEXT" ||
    !channel.guild.me ||
    !channel.permissionsFor(channel.guild.me.id)?.has("SEND_MESSAGES")
  )
    return;
  const embed = new MessageEmbed().setDescription(
    `${channel} has been created.`
  );
  if (settings.embedColor) embed.setColor(settings.embedColor);
  if (channel.guild.me.permissions.has("VIEW_AUDIT_LOG")) {
    const auditlogs = await channel.guild
      .fetchAuditLogs({ limit: 1, type: 10 })
      .catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });
    if (auditlogs?.entries.size) {
      const auditEntry = auditlogs.entries.first();
      embed.setAuthor(
        `${auditEntry?.executor?.tag}`,
        auditEntry?.executor?.displayAvatarURL({ dynamic: true })
      );
    }
  }
  await logChannel.send({ embeds: [embed] }).catch((e) => {
    process.env.DSN ? Sentry.captureException(e) : console.error(e);
  });
});

bot.on("channelDelete", async function (channel): Promise<void> {
  if (channel.type === "DM") return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: channel.guild.id })
    .catch((e) => console.error(e));
  if (!settings?.channelDeleteLogChannel) return;
  const logChannel = await channel.guild.channels
    .fetch(settings.channelDeleteLogChannel)
    .catch((e) => console.error(e));
  if (
    !logChannel ||
    logChannel.type !== "GUILD_TEXT" ||
    !channel.guild.me ||
    !channel.permissionsFor(channel.guild.me.id)?.has("SEND_MESSAGES")
  )
    return;
  const embed = new MessageEmbed().setDescription(
    `${channel} has been deleted.`
  );
  if (settings.embedColor) embed.setColor(settings.embedColor);
  if (channel.guild.me.permissions.has("VIEW_AUDIT_LOG")) {
    const auditlogs = await channel.guild
      .fetchAuditLogs({ limit: 1, type: 12 })
      .catch((e) => console.error(e));
    if (auditlogs?.entries.size) {
      const auditEntry = auditlogs.entries.first();
      embed.setAuthor(
        `${auditEntry?.executor?.tag}`,
        auditEntry?.executor?.displayAvatarURL({ dynamic: true })
      );
    }
  }
  await logChannel.send({ embeds: [embed] }).catch((e) => console.error(e));
});

bot.on("channelUpdate", async function (oldChannel, newChannel): Promise<void> {
  if (newChannel.type === "DM") return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: newChannel.guild.id })
    .catch((e) => console.error(e));
  if (!settings?.channelUpdateLogChannel) return;
  const logChannel = await newChannel.guild.channels
    .fetch(settings.channelUpdateLogChannel)
    .catch((e) => console.error(e));
  if (
    !logChannel ||
    logChannel.type !== "GUILD_TEXT" ||
    !newChannel.guild.me ||
    !logChannel.permissionsFor(newChannel.guild.me).has("SEND_MESSAGES")
  )
    return;
  const embed = new MessageEmbed().setDescription(
    `${newChannel} has been updated. See audit logs for details.`
  );
  if (settings.embedColor) embed.setColor(settings.embedColor);
  if (newChannel.guild.me.permissions.has("VIEW_AUDIT_LOG")) {
    const auditlogs = await newChannel.guild
      .fetchAuditLogs({ limit: 1, type: 11 })
      .catch((e) => console.error(e));
    if (auditlogs?.entries.size) {
      const auditEntry = auditlogs.entries.first();
      embed.setAuthor(
        `${auditEntry?.executor?.tag}`,
        auditEntry?.executor?.displayAvatarURL({ dynamic: true })
      );
    }
  }
  await logChannel.send({ embeds: [embed] }).catch((e) => console.error(e));
});

bot.on("guildBanAdd", async function (ban): Promise<void> {
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: ban.guild.id })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (!settings?.banLogChannel) return;
  const banChannel = await ban.guild.channels
    .fetch(settings.banLogChannel)
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });

  if (banChannel?.type !== "GUILD_TEXT") return;
  if (
    !ban.guild.me ||
    !banChannel.permissionsFor(ban.guild.me).has("SEND_MESSAGES")
  )
    return;

  const embed = new MessageEmbed()
    .setTitle("Member Banned")
    .setAuthor(ban.user.tag, ban.user.displayAvatarURL({ dynamic: true }))
    .setDescription(`<@${ban.user.id}> ${ban.user.tag}`)
    .addField("Reason", ban.reason ?? "No reason provided");

  if (ban.guild.me?.permissions.has("VIEW_AUDIT_LOG")) {
    const auditEntry = (
      await ban.guild.fetchAuditLogs({ type: 22, limit: 1 }).catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      })
    )?.entries.first();
    if (auditEntry?.executor?.id === ban.guild.me.id) return;
    embed.setAuthor(auditEntry?.executor?.tag ?? "Unknown");
  }
  await banChannel.send({ embeds: [embed] }).catch((e) => {
    process.env.DSN ? Sentry.captureException(e) : console.error(e);
  });
});

bot.on("guildCreate", async function (guild): Promise<void> {
  const existingSettings = await mongo
    .collection("settings")
    .findOne({ guild: guild.id })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (typeof existingSettings === "undefined" || existingSettings) return;
  await mongo
    .collection("settings")
    .insertOne({ guild: guild.id })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
});

bot.on(
  "guildMemberUpdate",
  async function (oldMember, newMember): Promise<void> {
    const settings = await mongo
      .collection("settings")
      .findOne({ guild: newMember.guild.id })
      .catch((e) => console.error(e));
    if (!settings) return;
    const embed = new MessageEmbed();
    embed.setAuthor(
      newMember.user.tag,
      newMember.user.displayAvatarURL({ dynamic: true })
    );
    if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
      if (!settings.roleLogChannel) return;
      const roleLogChannel = await newMember.guild.channels
        .fetch(settings.roleLogChannel)
        .catch((e) => {
          process.env.DSN ? Sentry.captureException(e) : console.error(e);
        });
      if (roleLogChannel?.type !== "GUILD_TEXT") return;
      if (
        !newMember.client.user ||
        !roleLogChannel
          .permissionsFor(newMember.client.user.id)
          ?.has("SEND_MESSAGES")
      )
        return;
      embed.setTitle("Roles Updated");
      let oldrolesstring = "";
      oldMember.roles.cache.forEach((r) => {
        oldrolesstring += ` <@&${r.id}>`;
      });
      embed.addField("Old Roles", oldrolesstring);
      if (oldMember.roles.cache.size > newMember.roles.cache.size) {
        let rolesremoved = "";
        oldMember.roles.cache.each((r) => {
          if (!newMember.roles.cache.has(r.id)) rolesremoved += ` <@&${r.id}>`;
        });
        embed.addField("Roles Removed", rolesremoved);
      } else {
        let rolesadded = "";
        newMember.roles.cache.each((r) => {
          if (!oldMember.roles.cache.has(r.id)) rolesadded += ` <@&${r.id}>`;
        });
        embed.addField("Roles Added", rolesadded);
      }
      await roleLogChannel.send({ embeds: [embed] }).catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });
    } else if (oldMember.nickname !== newMember.nickname) {
      if (!settings.nicknameLogChannel) return;
      const nicknameLogChannel = await newMember.guild.channels
        .fetch(settings.nicknameLogChannel)
        .catch((e) => {
          process.env.DSN ? Sentry.captureException(e) : console.error(e);
        });
      if (nicknameLogChannel?.type !== "GUILD_TEXT") return;
      if (
        !newMember.client.user ||
        !nicknameLogChannel
          .permissionsFor(newMember.client.user.id)
          ?.has("SEND_MESSAGES")
      )
        return;
      embed.setTitle("Nickname Updated");
      embed.setDescription(
        `\`${oldMember.nickname ?? "None"}\` -> \`${
          newMember.nickname ?? "None"
        }\``
      );
      await newMember.fetch().catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });
      embed.setColor(newMember.displayColor);
      await nicknameLogChannel.send({ embeds: [embed] }).catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });
    }
  }
);

bot.on("messageCreate", async function (message): Promise<void> {
  if (
    !message.content ||
    !message.author ||
    message.channel.type !== "GUILD_TEXT"
  )
    return;
  const settings = await db
    .db("bot")
    .collection("settings")
    .findOne({ guild: message.guildId })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (!settings?.antiphish) return;
  const linkMatches = message.content.match(
    /https?:\/\/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/g
  );
  if (!linkMatches) return;
  for (let link of linkMatches) {
    let malicious = false;
    const cache = await redis
      .get(`linkcheck_${link.replace(/^https?:\/\//, "")}`)
      .catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });
    if (!cache) {
      const redirReq = await axios(link, {
        headers: {
          "user-agent": Buffer.from(randomBytes(16)).toString("base64"), // Prevent UA blocking
        },
        httpsAgent: new Agent({ rejectUnauthorized: false }), // Prevent self-signed certs from breaking validation
        validateStatus: () => true,
      }).catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      }); // Axios will follow up to 5 redirects by default
      if (!redirReq) continue;
      link = redirReq.request.host;
      const phishCheckReq = await axios(
        `https://api.phisherman.gg/v1/domains/${link}`,
        {
          headers: {
            "user-agent":
              "Virgil Bot +https://github.com/Wolftallemo/Virgil/tree/rewrite",
          },
          validateStatus: () => true,
        }
      ).catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });
      if (phishCheckReq?.status !== 200) continue;
      if (phishCheckReq.data) malicious = true;
      await redis
        .set(
          `linkcheck_${link}`,
          JSON.stringify(phishCheckReq.data),
          "EX",
          1800
        )
        .catch((e) => {
          process.env.DSN ? Sentry.captureException(e) : console.error(e);
        });
    } else {
      malicious = JSON.parse(cache);
    }
    if (malicious) {
      if (message.deletable) {
        await message.delete().catch((e) => {
          process.env.DSN ? Sentry.captureException(e) : console.error(e);
        });
      }
      if (!settings?.autobanPhishers) return;
      const member =
        message.member ||
        (await message.guild?.members.fetch(message.author.id).catch((e) => {
          process.env.DSN ? Sentry.captureException(e) : console.error(e);
        }));
      if (!member?.bannable) return;
      await member.send({
        content: `You were banned from ${
          message.guild?.name
        } for sending a phishing link.${
          settings.antiphishMessage ? "\n\n" + settings.antiphishMessage : ""
        }`,
      });
      await member
        .ban({ reason: "User posted a phishing link", days: 1 })
        .catch((e) => {
          process.env.DSN ? Sentry.captureException(e) : console.error(e);
        });
      break;
    }
  }
});

bot.on("messageDelete", async function (message): Promise<void> {
  if (!message.guild || !message.author || message.author.bot) return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: message.guild.id })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (!settings?.deleteLogChannel) return;
  const embed = new MessageEmbed()
    .setAuthor(
      `${message.author.tag} (${message.author.id})`,
      message.author.displayAvatarURL({ dynamic: true })
    )
    .setDescription(
      `Message ${message.id} deleted from <#${message.channel.id}>${
        message.thread ? ` - Thread ${message.thread.name}` : ""
      }${message.content ? `\n**Content:** ${message.content}` : ""}`
    );
  if (message.member) embed.setColor(message.member.displayColor);
  message.attachments.forEach((att) => {
    embed.addField("Attachment", att.url);
  });
  const channel = await message.guild.channels
    .fetch(settings.deleteLogChannel)
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (!(channel instanceof TextChannel)) return;
  if (!message.client.user?.id) return;
  if (!channel?.permissionsFor(message.client.user.id)?.has("SEND_MESSAGES"))
    return;
  await channel.send({ embeds: [embed] }).catch((e) => {
    process.env.DSN ? Sentry.captureException(e) : console.error(e);
  });
});

bot.on("messageDeleteBulk", async function (messages): Promise<void> {
  if (!messages.first() || messages.first()?.channel.type === "DM") return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: messages.first()?.guild?.id })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (!settings?.deleteLogChannel) return;
  let fileBody = `${new Intl.DateTimeFormat(
    messages.first()?.guild?.preferredLocale ?? "en-US",
    {
      minute: "2-digit",
      hour: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(Date.now())}`;
  messages.each(function (msg) {
    fileBody += `\n\n${msg.author?.tag ?? "Unknown#0000"} (${
      msg.author?.id ?? "Unknown"
    }): ${msg.content}`;
  });
  const filePath = join(
    __dirname,
    Date.now().toString() +
      Math.round(Math.random() * 1000000).toString() +
      ".txt"
  );
  try {
    await writeFile(filePath, fileBody);
  } catch (e) {
    process.env.DSN ? Sentry.captureException(e) : console.error(e);
    return;
  }
  const logChannel = await messages
    .first()
    ?.guild?.channels.fetch(settings.deleteLogChannel)
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (
    logChannel?.type !== "GUILD_TEXT" ||
    !logChannel.client.user ||
    !logChannel.permissionsFor(logChannel.client.user.id)?.has("SEND_MESSAGES")
  )
    return;
  await logChannel.send({ files: [filePath] }).catch((e) => {
    process.env.DSN ? Sentry.captureException(e) : console.error(e);
  });
  await unlink(filePath).catch((e) => {
    process.env.DSN ? Sentry.captureException(e) : console.error(e);
  });
});

bot.on("messageUpdate", async function (oldMessage, newMessage): Promise<void> {
  if (
    !oldMessage ||
    !oldMessage.content ||
    !oldMessage.author ||
    oldMessage.content === newMessage.content ||
    !newMessage.guild ||
    oldMessage.author.bot
  )
    return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: newMessage.guild.id })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (!settings?.editLogChannel) return;
  const embed = new MessageEmbed()
    .setAuthor(
      `${oldMessage.author.tag} (${oldMessage.author.id})`,
      oldMessage.author.displayAvatarURL({ dynamic: true })
    )
    .setDescription(
      `Message edited in <#${newMessage.channel.id}> [Go to message](${newMessage.url})`
    )
    .addFields(
      {
        name: "Before",
        value: oldMessage.content
          ? oldMessage.content.length > 1024
            ? oldMessage.content.substr(0, 1021) + "..."
            : oldMessage.content
          : "Unknown content",
      },
      {
        name: "After",
        value: newMessage.content
          ? newMessage.content.length > 1024
            ? newMessage.content.substr(0, 1021) + "..."
            : newMessage.content
          : "Unknown content",
      }
    );
  if (newMessage.member) embed.setColor(newMessage.member.displayColor);
  const channel = await newMessage.guild.channels
    .fetch(settings.editLogChannel)
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (
    !channel ||
    !(channel instanceof TextChannel) ||
    !newMessage.client.user?.id ||
    !channel.permissionsFor(newMessage.client.user.id)?.has("SEND_MESSAGES")
  )
    return;
  await channel.send({ embeds: [embed] }).catch((e) => {
    process.env.DSN ? Sentry.captureException(e) : console.error(e);
  });
});

bot.on("threadCreate", async function (thread): Promise<void> {
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: thread.guildId })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (!settings?.threadCreateLogChannel) return;
  const embed = new MessageEmbed()
    .setDescription(`Thread <#${thread.id}> created by <@${thread.ownerId}>`)
    .setFooter(`Thread ${thread.id}`)
    .setColor([0, 255, 0]);

  const channel = await thread.guild.channels
    .fetch(settings.threadCreateLogChannel)
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (
    !channel ||
    channel.type !== "GUILD_TEXT" ||
    !thread.guild.me?.permissionsIn(channel).has("SEND_MESSAGES")
  )
    return;
  await channel.send({ embeds: [embed] }).catch((e) => {
    process.env.DSN ? Sentry.captureException(e) : console.error(e);
  });
});

bot.on("threadDelete", async function (thread): Promise<void> {
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: thread.guildId })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (!settings?.threadDeleteLogChannel) return;
  const embed = new MessageEmbed()
    .setDescription(`Thread ${thread.name} deleted.`)
    .setFooter(`Thread ${thread.id}`)
    .setColor([255, 0, 0]);

  const channel = await thread.guild.channels
    .fetch(settings.threadDeleteLogChannel)
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (
    !channel ||
    channel.type !== "GUILD_TEXT" ||
    !thread.guild.me?.permissionsIn(channel).has("SEND_MESSAGES")
  )
    return;
  await channel.send({ embeds: [embed] }).catch((e) => {
    process.env.DSN ? Sentry.captureException(e) : console.error(e);
  });
});

bot.on("threadUpdate", async function (oldThread, newThread): Promise<void> {
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: newThread.guildId })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (!settings?.threadUpdateLogChannel) return;
  const embed = new MessageEmbed()
    .setTitle("Thread Updated")
    .setColor([0, 0, 255])
    .setFooter(`Thread ${newThread.id}`);

  let actionstring = "";
  if (!oldThread.archived && newThread.archived) {
    actionstring = `Thread <#${newThread.id}> archived.`;
  } else if (oldThread.members.cache.size < newThread.members.cache.size) {
    actionstring += `Members added to thread <#${newThread.id}>:\n`;
    newThread.members.cache.each((threadmember) => {
      if (!oldThread.members.cache.has(threadmember.id))
        actionstring += `<@${threadmember.id}> `;
    });
  } else if (oldThread.members.cache.size > newThread.members.cache.size) {
    actionstring += `Members removed from thread <#${newThread.id}>:\n`;
    oldThread.members.cache.each((threadmember) => {
      if (newThread.members.cache.has(threadmember.id))
        actionstring += `<@${threadmember.id}> `;
    });
  } else if (oldThread.name !== newThread.name) {
    actionstring += `Thread ${oldThread.name} changed to ${newThread.name}.`;
  } else if (oldThread.archived && !newThread.archived) {
    actionstring = `Thread <#${newThread.id}> unarchived.`;
  } else if (oldThread.autoArchiveDuration !== newThread.autoArchiveDuration) {
    actionstring = `Auto archive timer of <#${newThread.id}> changed from ${oldThread.autoArchiveDuration} minutes to ${newThread.autoArchiveDuration} minutes.`;
  }
  if (!actionstring) return;
  embed.setDescription(actionstring);
  const channel = await newThread.guild.channels
    .fetch(settings.threadUpdateLogChannel)
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (
    !channel ||
    channel.type !== "GUILD_TEXT" ||
    !newThread.guild.me?.permissionsIn(channel).has("SEND_MESSAGES")
  )
    return;
  await channel.send({ embeds: [embed] }).catch((e) => {
    process.env.DSN ? Sentry.captureException(e) : console.error(e);
  });
});

bot.on("voiceStateUpdate", async function (oldState, newState): Promise<void> {
  if (!newState.member) return;
  const settings = await mongo
    .collection("settings")
    .findOne({ guild: newState.guild.id })
    .catch((e) => {
      process.env.DSN ? Sentry.captureException(e) : console.error(e);
    });
  if (!settings) return;
  const embed = new MessageEmbed()
    .setColor(newState.member.displayColor)
    .setAuthor(
      newState.member.user.tag,
      newState.member.user.displayAvatarURL({ dynamic: true })
    )
    .setFooter(`ID: ${newState.member.id}`);

  let actionstring = `<@${newState.member.id}> `;
  let logChannel:
    | void
    | TextChannel
    | NewsChannel
    | VoiceChannel
    | CategoryChannel
    | StoreChannel
    | StageChannel
    | null;
  if (newState.channel && !oldState.channel && settings.voiceJoinLogChannel) {
    actionstring += `joined <#${newState.channelId}>`;
    logChannel = await newState.guild.channels
      .fetch(settings.voiceJoinLogChannel)
      .catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });
  } else if (
    !newState.channel &&
    oldState.channel &&
    settings.voiceLeaveLogChannel
  ) {
    actionstring += `left <#${oldState.channelId}>`;
    logChannel = await newState.guild.channels
      .fetch(settings.voiceLeaveLogChannel)
      .catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });
  } else if (
    newState.selfMute !== oldState.selfMute &&
    settings.voiceMuteLogChannel
  ) {
    actionstring += `${newState.mute ? "muted" : "unmuted"} themself.`;
    logChannel = await newState.guild.channels
      .fetch(settings.voiceMuteLogChannel)
      .catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });
  } else if (
    newState.selfDeaf !== oldState.selfDeaf &&
    settings.voiceDeafenLogChannel
  ) {
    actionstring += `${newState.deaf ? "deafened" : "undeafened"} themself.`;
    logChannel = await newState.guild.channels
      .fetch(settings.voiceDeafenLogChannel)
      .catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });
  } else if (
    newState.serverMute !== oldState.serverMute &&
    settings.voiceMuteLogChannel
  ) {
    actionstring += `was ${
      newState.serverMute ? "muted" : "unmuted"
    } by a server moderator.`;
    logChannel = await newState.guild.channels
      .fetch(settings.voiceMuteLogChannel)
      .catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });
  } else if (
    newState.serverDeaf !== oldState.serverDeaf &&
    settings.voiceDeafenLogChannel
  ) {
    actionstring += `was ${
      newState.serverDeaf ? "deafened" : "undeafened"
    } by a server moderator.`;
    logChannel = await newState.guild.channels
      .fetch(settings.voiceDeafenLogChannel)
      .catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });
  } else if (
    newState.selfVideo !== oldState.selfVideo &&
    settings.voiceVideoLogChannel
  ) {
    actionstring += `${
      newState.selfVideo ? "enabled" : "disabled"
    } their camera.`;
    logChannel = await newState.guild.channels
      .fetch(settings.voiceVideoLogChannel)
      .catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });
  } else if (
    newState.channel &&
    oldState.channel &&
    settings.voiceSwitchLogChannel &&
    newState.channelId !== oldState.channelId
  ) {
    actionstring += `switched from <#${oldState.channelId}> to <#${newState.channelId}>`;
    logChannel = await newState.guild.channels
      .fetch(settings.voiceSwitchLogChannel)
      .catch((e) => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e);
      });
  }
  if (
    actionstring === `<@${newState.member.id}> ` ||
    logChannel?.type !== "GUILD_TEXT" ||
    !newState.client.user ||
    !logChannel?.permissionsFor(newState.client.user.id)?.has("SEND_MESSAGES")
  )
    return;
  embed.setDescription(actionstring);
  await logChannel.send({ embeds: [embed] }).catch((e) => {
    process.env.DSN ? Sentry.captureException(e) : console.log(e);
  });
});

setInterval(async function (): Promise<void> {
  try {
    const bans = await mongo
      .collection("bans")
      .find({ unban: { $lte: Date.now() } })
      .toArray();
    for (const ban of bans) {
      const shard = ShardClientUtil.shardIdForGuildId(
        ban.server,
        bot.shard?.count ?? 1
      );
      await bot.shard?.broadcastEval(
        async (c) => {
          const server = await c.guilds.fetch(ban.server).catch(() => {});
          if (!server || !server.me?.permissions.has("BAN_MEMBERS")) return;
          const member = await server.bans.fetch(ban.user).catch(() => {});
          if (!member) return;
          try {
            await server.bans.remove(member.user.id, "Temporary ban expired.");
            await mongo
              .collection("bans")
              .findOneAndDelete({ user: member.user.id });
          } catch (e) {
            console.error(e);
          }
        },
        { shard: shard }
      );
    }
  } catch (e) {
    process.env.DSN ? Sentry.captureException(e) : console.error(e);
    return;
  }
}, 30000);
