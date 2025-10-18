import {
  ApplicationCommandType,
  BaseInteraction,
  ButtonInteraction,
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  GuildMFALevel,
  InteractionType,
  MessageContextMenuCommandInteraction,
  PermissionResolvable,
  UserContextMenuCommandInteraction,
} from "discord.js";
import db from "../mongo";
import Logger from "../logger";
import SendLog from "../send_log";
import Sentry from "../sentry";
import { readdirSync } from "fs";
import { join } from "path";
import common from "../common";

const mongo = db.db("bot");

const cmds: Map<
  string,
  {
    name: string;
    privileged?: boolean;
    exec(i: ChatInputCommandInteraction): Promise<void>;
  }
> = new Map();

const userContextCommands: Map<
  string,
  {
    name: string;
    permissions?: PermissionResolvable[];
    exec(i: UserContextMenuCommandInteraction): Promise<void>;
  }
> = new Map();

const messageContextCommands: Map<
  string,
  {
    name: string;
    permissions?: PermissionResolvable[];
    exec(i: MessageContextMenuCommandInteraction): Promise<void>;
  }
> = new Map();

const buttonCommands: Map<
  string,
  {
    name: string;
    permissions?: PermissionResolvable[];
    exec(i: ButtonInteraction): Promise<void>;
  }
> = new Map();

for (const file of readdirSync(join(__dirname, "../commands")).filter((f) =>
  f.endsWith(".js"),
)) {
  const commandFile = require(`../commands/${file}`);
  cmds.set(commandFile.name, commandFile);
}

for (const file of readdirSync(join(__dirname, "../usercontext")).filter((f) =>
  f.endsWith(".js"),
)) {
  const ucFile = require(`../usercontext/${file}`);
  userContextCommands.set(ucFile.name, ucFile);
}

for (const file of readdirSync(join(__dirname, "../messagecontext")).filter(
  (f) => f.endsWith(".js"),
)) {
  const mcFile = require(`../messagecontext/${file}`);
  messageContextCommands.set(mcFile.name, mcFile);
}

for (const file of readdirSync(join(__dirname, "../button")).filter((f) =>
  f.endsWith(".js"),
)) {
  const bFile = require(`../button/${file}`);
  buttonCommands.set(bFile.name, bFile);
}

module.exports = async function (i: BaseInteraction) {
  if (i.isUserContextMenuCommand()) {
    if (!userContextCommands.has(i.commandName)) return;
    const contextCommand = userContextCommands.get(i.commandName);
    const contextMember = await i.guild?.members
      .fetch(i.user.id)
      .catch(console.error);

    if (
      contextCommand?.permissions?.length &&
      !contextMember?.permissions.has(contextCommand.permissions)
    ) {
      return await i
        .reply({ content: "You cannot run this command!", ephemeral: true })
        .catch(Logger);
    }

    try {
      await contextCommand?.exec(i);
    } catch (e) {
      if (!process.env.DSN) console.error(e);
      await i
        .reply({
          content: `Oops! An error occurred when running this command! If you contact the developer, give them this information: \`Error: ${
            process.env.DSN ? Sentry.captureException(e) : e
          }`,
          ephemeral: true,
        })
        .catch(Logger);
    }
    return;
  }

  if (i.isMessageContextMenuCommand()) {
    const msgCommand = messageContextCommands.get(i.commandName);
    if (!msgCommand) {
      await i.reply({
        content:
          "Uh oh! The command could not be found! This might mean that a command was removed from the bot but the context app still exists.",
        ephemeral: true,
      });
      return;
    }

    if (!i.member) {
      await i.reply({
        content:
          "No guild member was found! Was this command run in a dm? If so that shouldn't have happened.",
        ephemeral: true,
      });
      return;
    }

    try {
      await msgCommand.exec(i);
    } catch (e) {
      if (!process.env.DSN) console.error(e);
      await i
        .reply({
          content: `Oops! An error occurred when running this command! If you contact the developer, give them this information: \`Error: ${
            process.env.DSN ? Sentry.captureException(e) : e
          },`,
          ephemeral: true,
        })
        .catch(Logger);
    }
    return;
  }

  if (i.isButton()) {
    const buttonCommand = buttonCommands.get(i.customId);
    if (!buttonCommand) {
      await i.reply({
        content:
          "Uh oh! Looks like this button is no longer active! This means that the command associated with this button was removed.",
        ephemeral: true,
      });
      return;
    }

    await buttonCommand.exec(i).catch(Logger);
  }

  if (!i.isChatInputCommand() || !cmds.has(i.commandName)) return;
  try {
    const command = cmds.get(i.commandName);
    if (
      !i.channel ||
      ![
        ChannelType.GuildText,
        ChannelType.GuildVoice,
        ChannelType.PrivateThread,
        ChannelType.PublicThread,
      ].includes(i.channel.type)
    ) {
      await i
        .reply({
          content:
            "Hey! You can't run commands here! They may only be run in a thread or a standard text/voice text channel.",
          ephemeral: true,
        })
        .catch(Logger);
      return;
    }

    if (
      i.guild?.mfaLevel === GuildMFALevel.Elevated &&
      command?.privileged &&
      process.env.MFA_API_TOKEN &&
      process.env.MFA_CLIENT_ID &&
      process.env.MFA_CLIENT_SECRET &&
      process.env.MFA_VERIFY_SITE
    ) {
      if (!(await common.isMFAEnabled(i.user)))
        return await i.reply({
          content: `Sorry, but you must verify that you have MFA enabled to use this command!\n\nVisit ${process.env.MFA_VERIFY_SITE} to verify.`,
          ephemeral: true,
        });
    }

    await command?.exec(i);
    if (!command?.privileged || !i.guild) return;
    const settings = await mongo
      .collection("settings")
      .findOne({ guild: i.guild?.id })
      .catch(Logger);
    if (!settings?.commandLogChannelWebhook) return;
    const embed = new EmbedBuilder({
      author: {
        name: i.user.username,
        iconURL: i.user.displayAvatarURL(),
      },
      description: `Ran the \`${command.name}\` command.`,
      footer: { text: `ID: ${i.id}` },
    });
    if (i.member instanceof GuildMember) embed.setColor(i.member.displayColor);
    await SendLog(
      settings.commandLogChannelWebhook,
      embed,
      i.guild,
      "commandLogChannelWebhook",
    );
  } catch (e) {
    if (!process.env.DSN) console.error(e);
    await i
      .reply({
        content: `Oops! An error occurred when running this command! If you contact the developer, give them this information: \`Error: ${
          process.env.DSN ? Sentry.captureException(e) : e
        }\``,
        ephemeral: true,
      })
      .catch(console.error);
  }
};
