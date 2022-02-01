import {
  ApplicationCommandData,
  ButtonInteraction,
  CommandInteraction,
  ContextMenuInteraction,
  GuildMember,
  Interaction,
  MessageEmbed,
  PermissionResolvable,
} from "discord.js";
import db from "../mongo";
import SendLog from "../send_log";
import Sentry from "../sentry";
import { readdirSync } from "fs";
import { join } from "path";

const mongo = db.db("bot");

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

for (const file of readdirSync(join(__dirname, "../commands")).filter((f) =>
  f.endsWith(".js")
)) {
  const commandFile = require(`../commands/${file}`);
  cmds.set(commandFile.name, commandFile);
}

for (const file of readdirSync(join(__dirname, "../usercontext")).filter((f) =>
  f.endsWith(".js")
)) {
  const ucFile = require(`../usercontext/${file}`);
  userContextCommands.set(ucFile.name, ucFile);
}

for (const file of readdirSync(join(__dirname, "../messagecontext")).filter(
  (f) => f.endsWith(".js")
)) {
  const mcFile = require(`../messagecontext/${file}`);
  messageContextCommands.set(mcFile.name, mcFile);
}

for (const file of readdirSync(join(__dirname, "../button")).filter((f) =>
  f.endsWith(".js")
)) {
  const bFile = require(`../button/${file}`);
  buttonCommands.set(bFile.name, bFile);
}

module.exports = async function (i: Interaction) {
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
    if (!settings?.commandLogChannelWebhook) return;
    const embed = new MessageEmbed({
      author: {
        name: i.user.tag,
        iconURL: i.user.displayAvatarURL({ dynamic: true }),
      },
      description: `Ran the \`${command.name}\` command.`,
    });
    if (i.member instanceof GuildMember) embed.setColor(i.member.displayColor);
    await SendLog(
      settings.commandLogChannelWebhook,
      embed,
      i.guildId ?? "0", // It should never be zero, since we would return before if the guild id is null, as there would be no server settings
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
  if (process.env.DSN) {
    Sentry.captureEvent({
      user: { id: i.user.id },
      timestamp: Date.now(),
      message: `${i.commandName} was ran`,
    });
  }
};
