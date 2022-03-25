import {
  CommandInteraction,
  GuildMember,
  MessageEmbed,
  ThreadChannel,
} from "discord.js";
import mongo from "../mongo";
import axios from "axios";

const settingsDB = mongo.db("bot").collection("settings");
const ignoredDB = mongo.db("bot").collection("ignored");

const logTypes = [
  {
    name: "ban",
    name_localizations: {
      "es-ES": "Interdicto",
      "sv-SE": "Bann",
    },
    value: "ban",
  },
  {
    name: "delete",
    name_localizations: {
      "es-ES": "Borrado",
      "sv-SE": "Raderad",
    },
    value: "delete",
  },
  {
    name: "edit",
    name_localizations: {
      "es-ES": "Editado",
      "sv-SE": "Redigerad",
    },
    value: "edit",
  },
  {
    name: "member_join",
    name_localizations: {
      "es-ES": "Unido",
      "sv-SE": "Gick med",
    },
    value: "member_join",
  },
  {
    name: "member_leave",
    name_localizations: {
      "es-ES": "Dejado",
      "sv-SE": "Gick ur",
    },
    value: "member_leave",
  },
  {
    name: "message_report_actions",
    name_localizations: {
      "es-ES": "Reporte de acciones",
      "sv-SE": "Rapportering av åtgärder",
    },
    value: "message_report_actions",
  },
  {
    name: "message_reports",
    name_localizations: {
      "es-ES": "Reporte de mensajes",
      "sv-SE": "Rapportering av meddelanden",
    },
    value: "message_reports",
  },
  {
    name: "nickname",
    name_localizations: {
      "es-ES": "Nombre de usuario",
      "sv-SE": "Användarnamn",
    },
    value: "nickname",
  },
  {
    name: "role",
    name_localizations: {
      "es-ES": "Rol",
      "sv-SE": "Roll",
    },
    value: "role",
  },
  {
    name: "thread_create",
    name_localizations: {
      "es-ES": "Creado hilo",
      "sv-SE": "Skapad tråd",
    },
    value: "thread_create",
  },
  {
    name: "thread_delete",
    name_localizations: {
      "es-ES": "Borrado hilo",
      "sv-SE": "Raderad tråd",
    },
    value: "thread_delete",
  },
  {
    name: "thread_update",
    name_localizations: {
      "es-ES": "Actualizado hilo",
      "sv-SE": "Uppdaterad tråd",
    },
    value: "thread_update",
  },
  {
    name: "unban",
    name_localizations: {
      "es-ES": "Desinterdicto",
      "sv-SE": "Avbann",
    },
    value: "unban",
  },
  {
    name: "voice_deafen",
    name_localizations: {
      "es-ES": "Ensordecido",
      "sv-SE": "Ljudavakt",
    },
    value: "voice_deafen",
  },
  {
    name: "voice_join",
    name_localizations: {
      "es-ES": "Unido a canal de voz",
      "sv-SE": "Gick med i röstkanal",
    },
    value: "voice_join",
  },
  {
    name: "voice_leave",
    name_localizations: {
      "es-ES": "Dejado de canal de voz",
      "sv-SE": "Gick ur röstkanal",
    },
    value: "voice_leave",
  },
  {
    name: "voice_mute",
    name_localizations: {
      "es-ES": "Enmudecido",
      "sv-SE": "Ljudavakt",
    },
    value: "voice_mute",
  },
  {
    name: "voice_switch",
    name_localizations: {
      "es-ES": "Canal de voz cambiado",
      "sv-SE": "Röstkanal bytt",
    },
    value: "voice_switch",
  },
  {
    name: "voice_video",
    name_localizations: {
      "es-ES": "Canal de voz a video",
      "sv-SE": "Röstkanal till video",
    },
    value: "voice_video",
  },
  {
    name: "warn",
    name_localizations: {
      "es-ES": "Advertido",
      "sv-SE": "Varnad",
    },
    value: "warn",
  },
];

export = {
  name: "logs",
  description: "View, set, or remove a log channel",
  permissions: ["MANAGE_GUILD"],
  interactionData: {
    name: "logs",
    name_localizations: {
      "es-ES": "Registros",
      "sv-SE": "Loggar",
    },
    description: "View, set, ignore, unignore, or remove a log channel",
    description_localizations: {
      "es-ES": "Muestra, configura, ignora, o designora un canal de registros",
      "sv-SE": "Visa, konfigurera, ignorera, eller avignorera en loggkanal",
    },
    options: [
      {
        type: 1,
        name: "ignore",
        name_localizations: {
          "es-ES": "Ignorar",
          "sv-SE": "Ignorera",
        },
        description: "Ignores a channel from logs",
        description_localizations: {
          "es-ES": "Ignora un canal de registros",
          "sv-SE": "Ignorerar en loggkanal",
        },
        options: [
          {
            type: 7,
            name: "channel",
            name_localizations: {
              "es-ES": "Canal",
              "sv-SE": "Kanal",
            },
            description: "Channel to ignore",
            description_localizations: {
              "es-ES": "Canal a ignorar",
              "sv-SE": "Kanal att ignorera",
            },
            required: true,
          },
          {
            type: 3,
            name: "log",
            name_localizations: {
              "es-ES": "Registro",
              "sv-SE": "Logg",
            },
            description: "Log to ignore",
            choices: logTypes,
          },
        ],
      },
      {
        type: 1,
        name: "list",
        name_localizations: {
          "es-ES": "Listar",
          "sv-SE": "Lista",
        },
        description: "Lists set log channels",
        description_localizations: {
          "es-ES": "Lista los canales de registros configurados",
          "sv-SE": "Listar konfigurerade loggar",
        },
      },
      {
        type: 1,
        name: "remove",
        name_localizations: {
          "es-ES": "Eliminar",
          "sv-SE": "Ta bort",
        },
        description: "Disable a log",
        description_localizations: {
          "es-ES": "Desactiva un registro",
          "sv-SE": "Inaktivera en logg",
        },
        options: [
          {
            type: 3,
            name: "log",
            name_localizations: {
              "es-ES": "Registro",
              "sv-SE": "Logg",
            },
            description: "Log to disable",
            description_localizations: {
              "es-ES": "Registro a desactivar",
              "sv-SE": "Logg att inaktivera",
            },
            required: true,
            choices: logTypes,
          },
        ],
      },
      {
        type: 1,
        name: "set",
        name_localizations: {
          "es-ES": "Configurar",
          "sv-SE": "Konfigurera",
        },
        description: "Sets a log channel",
        description_localizations: {
          "es-ES": "Configura un canal de registros",
          "sv-SE": "Konfigurera en loggkanal",
        },
        options: [
          {
            type: 3,
            name: "log",
            name_localizations: {
              "es-ES": "Registro",
              "sv-SE": "Logg",
            },
            description: "Type of log to enable",
            description_localizations: {
              "es-ES": "Tipo de registro a activar",
              "sv-SE": "Typ av logg att aktivera",
            },
            required: true,
            choices: logTypes,
          },
          {
            type: 7,
            name: "channel",
            name_localizations: {
              "es-ES": "Canal",
              "sv-SE": "Kanal",
            },
            description: "Channel to enable logs in",
            description_localizations: {
              "es-ES": "Canal en el que activar los registros",
              "sv-SE": "Kanal att aktivera loggar i",
            },
            required: true,
          },
        ],
      },
      {
        type: 1,
        name: "show_ignored",
        name_localizations: {
          "en-US": "Show ignored",
          "es-ES": "Mostrar ignorados",
          "sv-SE": "Visa ignorerade",
        },
        description: "List all ignored channels and the log type",
        description_localizations: {
          "es-ES": "Lista todos los canales ignorados y el tipo de registro",
          "sv-SE": "Listar alla ignorerade kanaler och loggtyp",
        },
      },
      {
        type: 1,
        name: "unignore",
        name_localizations: {
          "es-ES": "Designorar",
          "sv-SE": "Ta bort ignorering",
        },
        description: "Unignore a channel",
        description_localizations: {
          "es-ES": "Designorar un canal",
          "sv-SE": "Ta bort ignorering av en kanal",
        },
        options: [
          {
            type: 7,
            name: "channel",
            name_localizations: {
              "es-ES": "Canal",
              "sv-SE": "Kanal",
            },
            description: "Channel to unignore",
            description_localizations: {
              "es-ES": "Canal a designorar",
              "sv-SE": "Kanal att ta bort ignorering av",
            },
            required: true,
          },
          {
            type: 3,
            name: "log",
            name_localizations: {
              "es-ES": "Registro",
              "sv-SE": "Logg",
            },
            description: "Log to unignore",
            description_localizations: {
              "es-ES": "Registro a designorar",
              "sv-SE": "Logg att ta bort ignorering av",
            },
            choices: logTypes,
          },
        ],
      },
    ],
  },
  async exec(i: CommandInteraction): Promise<void> {
    const embed = new MessageEmbed();
    if (!i.guild?.me)
      return await i.reply({
        content: "Log configuration commands can only be run in a server!",
        ephemeral: true,
      });
    if (i.member instanceof GuildMember) embed.setColor(i.member.displayColor);
    const settingsList = await settingsDB.findOne({ guild: i.guildId });
    if (!settingsList)
      return await i.reply({
        content: `The server settings are not ready, ${
          i.member instanceof GuildMember
            ? i.member.permissions.has("MANAGE_GUILD")
              ? ""
              : "ask your server admin to"
            : "ask your server admin to"
        } run the \`/initialize\` command.`,
      });
    const choiceToSettingMap: Map<string, string> = new Map()
      .set("ban", "banLogChannel")
      .set("delete", "deleteLogChannel")
      .set("edit", "editLogChannel")
      .set("member_join", "memberJoinLogChannel")
      .set("member_leave", "memberLeaveLogChannel")
      .set("message_report_actions", "messageReportActionLogChannel")
      .set("message_reports", "messageReportChannel")
      .set("nickname", "nicknameLogChannel")
      .set("role", "roleLogChannel")
      .set("thread_create", "threadCreateLogChannel")
      .set("thread_delete", "threadDeleteLogChannel")
      .set("thread_update", "threadUpdateLogChannel")
      .set("unban", "unbanLogChannel")
      .set("voice_deafen", "voiceDeafenLogChannel")
      .set("voice_join", "voiceJoinLogChannel")
      .set("voice_leave", "voiceLeaveLogChannel")
      .set("voice_mute", "voiceMuteLogChannel")
      .set("voice_switch", "voiceSwitchLogChannel")
      .set("voice_video", "voiceVideoLogChannel")
      .set("warn", "warnLogChannel");

    switch (i.options.getSubcommand(true)) {
      case "ignore":
        const ignoringChannel = i.options.getChannel("channel", true);
        if (ignoringChannel instanceof ThreadChannel)
          return await i.reply({
            content:
              "Threads cannot be ignored (they inherit the settings of their parent channel)",
            ephemeral: true,
          });
        const doesIgnoreExist = await ignoredDB.findOne({
          channel: ignoringChannel.id,
          log: i.options.getString("log", false),
        });
        if (doesIgnoreExist)
          return await i.reply({
            content:
              "An ignore of that type or a global ignore was already set for the channel!",
            ephemeral: true,
          });
        await ignoredDB.insertOne({
          channel: ignoringChannel.id,
          guild: i.guildId,
          log: i.options.getString("log", false),
        });
        break;

      case "list":
        embed.setTitle("Log channels for " + i.guild?.name);
        embed.setDescription("\u200B");
        embed.addFields(
          {
            name: "Ban logs",
            value: settingsList.banLogChannel
              ? `<#${settingsList.banLogChannel}>`
              : "Not set",
            inline: true,
          },
          {
            name: "Delete logs",
            value: settingsList.deleteLogChannel
              ? `<#${settingsList.deleteLogChannel}>`
              : "Not set",
            inline: true,
          },
          {
            name: "Edit logs",
            value: settingsList.editLogChannel
              ? `<#${settingsList.editLogChannel}>`
              : "Not set",
            inline: true,
          },
          {
            name: "Member join logs",
            value: settingsList.memberJoinLogChannel
              ? `<#${settingsList.memberJoinLogChannel}>`
              : "Not set",
            inline: true,
          },
          {
            name: "Member leave logs",
            value: settingsList.memberLeaveLogChannel
              ? `<#${settingsList.memberLeaveLogChannel}>`
              : "Not set",
            inline: true,
          },
          {
            name: "Message report action logs",
            value: settingsList.messageReportActionLogChannel
              ? `<#${settingsList.messageReportActionLogChannel}>`
              : "Not set",
            inline: true,
          },
          {
            name: "Message reports",
            value: settingsList.messageReportChannel
              ? `<#${settingsList.messageReportChannel}>`
              : "Not set",
            inline: true,
          },
          {
            name: "Mute role",
            value: settingsList.muteRole
              ? `<@&${settingsList.muteRole}>`
              : "Not set",
            inline: true,
          },
          {
            name: "Nickname logs",
            value: settingsList.nicknameLogChannel
              ? `<#${settingsList.nicknameLogChannel}>`
              : "Not set",
            inline: true,
          },
          {
            name: "Role logs",
            value: settingsList.roleLogChannel
              ? `<#${settingsList.roleLogChannel}>`
              : "Not set",
            inline: true,
          },
          {
            name: "Thread creation logs",
            value: settingsList.threadCreateLogChannel
              ? `<#${settingsList.threadCreateLogChannel}>`
              : "Not set",
            inline: true,
          },
          {
            name: "Thread delete logs",
            value: settingsList.threadDeleteLogChannel
              ? `<#${settingsList.threadDeleteLogChannel}>`
              : "Not set",
            inline: true,
          },
          {
            name: "Thread update logs",
            value: settingsList.threadUpdateLogChannel
              ? `<#${settingsList.threadUpdateLogChannel}>`
              : "Not set",
            inline: true,
          },
          {
            name: "Unban logs",
            value: settingsList.unbanLogChannel
              ? `<#${settingsList.unbanLogChannel}>`
              : "Not set",
            inline: true,
          },
          {
            name: "Voice deafen logs",
            value: settingsList.voiceDeafenLogChannel
              ? `<#${settingsList.voiceDeafenLogChannel}>`
              : "Not set",
            inline: true,
          },
          {
            name: "Voice join logs",
            value: settingsList.voiceJoinLogChannel
              ? `<#${settingsList.voiceJoinLogChannel}>`
              : "Not set",
            inline: true,
          },
          {
            name: "Voice leave logs",
            value: settingsList.voiceLeaveLogChannel
              ? `<#${settingsList.voiceLeaveLogChannel}>`
              : "Not set",
            inline: true,
          },
          {
            name: "Voice mute logs",
            value: settingsList.voiceMuteLogChannel
              ? `<#${settingsList.voiceMuteLogChannel}>`
              : "Not set",
            inline: true,
          },
          {
            name: "Voice channel switch logs",
            value: settingsList.voiceSwitchLogChannel
              ? `<#${settingsList.voiceSwitchLogChannel}>`
              : "Not set",
            inline: true,
          },
          {
            name: "Voice video logs",
            value: settingsList.voiceVideoLogChannel
              ? `<#${settingsList.voiceVideoLogChannel}>`
              : "Not set",
            inline: true,
          },
          {
            name: "Warn logs",
            value: settingsList.warnLogChannel
              ? `<#${settingsList.warnLogChannel}>`
              : "Not set",
            inline: true,
          }
        );
        return await i.reply({ embeds: [embed] });

      case "remove":
        const removalChoice = i.options.getString("log", true);
        if (
          settingsList[
            (choiceToSettingMap.get(removalChoice) ?? "") + "Webhook"
          ]
        ) {
          await axios
            .delete(
              settingsList[
                (choiceToSettingMap.get(removalChoice) ?? "") + "Webhook"
              ]
            )
            .catch(console.error);
        }
        const $yeet: any = { $unset: {} };
        $yeet.$unset[choiceToSettingMap.get(removalChoice) ?? ""] = "";
        $yeet.$unset[
          (choiceToSettingMap.get(removalChoice) ?? "") + "Webhook"
        ] = "";
        await settingsDB.updateOne({ guild: i.guildId }, $yeet);
        return await i.reply({ content: `\`${removalChoice}\` log disabled!` });

      case "set":
        const setChannel = await i.guild.channels.fetch(
          i.options.getChannel("channel", true).id
        );
        if (setChannel?.type !== "GUILD_TEXT")
          return await i.reply({
            content: "The log channel must be a normal text channel!",
            ephemeral: true,
          });
        const setChoice = i.options.getString("log", true);
        const $set: any = { $set: {} };
        $set.$set[choiceToSettingMap.get(setChoice) ?? ""] = setChannel?.id;
        if (!setChannel?.permissionsFor(i.guild.me.id)?.has("MANAGE_WEBHOOKS"))
          return await i.reply({
            content:
              "I cannot create the webhook for the log! Please grant me permission to manage webhooks!",
            ephemeral: true,
          });
        const newWebhook = await setChannel.createWebhook(
          `${i.client.user?.username} Logs`
        );
        $set.$set[(choiceToSettingMap.get(setChoice) ?? "") + "Webhook"] =
          newWebhook.url;
        await settingsDB.updateOne({ guild: i.guildId }, $set);
        return await i.reply({
          content: `\`${setChoice}\` log set to <#${
            i.options.getChannel("channel", true).id
          }>!`,
        });

      case "show_ignored":
        const allIgnored = await (
          await ignoredDB.find({
            guild: i.guildId,
          })
        ).toArray();
        embed.setDescription("All ignored channels for " + i.guild.name);
        for (const ignored of allIgnored) {
          const ignoredChannel = await i.guild.channels
            .fetch(ignored.channel)
            .catch(() => {});
          if (!ignoredChannel) continue;
          embed.addField(
            `#${ignoredChannel.name}`,
            "Log: " + ignored.log ?? "All"
          );
        }
        return await i.reply({ embeds: [embed] });

      case "unignore":
        const unignoringChannel = i.options.getChannel("channel", true);
        await ignoredDB.deleteOne({
          channel: unignoringChannel.id,
          log: i.options.getString("log", false),
        });
        await i.reply({ content: "Channel unignored!" });
    }
  },
};
