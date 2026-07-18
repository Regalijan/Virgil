const logNameMap = new Map()
  .set("banLogChannel", "ban")
  .set("deleteLogChannel", "delete")
  .set("editLogChannel", "edit")
  .set("memberJoinLogChannel", "member_join")
  .set("memberLeaveLogChannel", "member_leave")
  .set("messageReportActionLogChannel", "message_report_actions")
  .set("messageReportChannel", "message_reports")
  .set("nicknameLogChannel", "nickname")
  .set("roleLogChannel", "role")
  .set("threadCreateLogChannel", "thread_create")
  .set("threadDeleteLogChannel", "thread_delete")
  .set("threadUpdateLogChannel", "thread_update")
  .set("unbanLogChannel", "unban")
  .set("voiceDeafenLogChannel", "voice_deafen")
  .set("voiceJoinLogChannel", "voice_join")
  .set("voiceLeaveLogChannel", "voice_leave")
  .set("voiceMuteLogChannel", "voice_mute")
  .set("voiceSwitchLogChannel", "voice_switch")
  .set("voiceVideoLogChannel", "voice_video")
  .set("warnLogChannel", "warn");

/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const up = async (db, client) => {
  const allSettingsArray = await db.collection("settings").find().toArray();
  const bulkMoveOps = [];

  for (const settingsObj of allSettingsArray) {
    if (settingsObj.banMessage) {
      bulkMoveOps.push({
        namespace: "bot.ban_messages",
        name: "insertOne",
        document: {
          guild: settingsObj.guild,
          message_content: settingsObj.banMessage,
        },
      });
    }

    if (settingsObj.nicknameformat) {
      bulkMoveOps.push({
        namespace: "bot.nickname_settings",
        name: "insertOne",
        document: {
          guild: settingsObj.guild,
          lock_nicknames: settingsObj.lockNicknames,
          nickname_format: settingsObj.nicknameformat,
        },
      });

      for (const [k, v] of Object.entries(settingsObj)) {
        if (!logNameMap.has(k)) continue;

        bulkMoveOps.push({
          namespace: "bot.log_channels",
          name: "insertOne",
          document: {
            channel: v,
            guild: settingsObj.guild,
            type: logNameMap.get(k),
            webhook: settingsObj[k + "Webhook"],
          },
        });
      }
    }
  }

  await client.bulkWrite(bulkMoveOps);
  await db.collection("settings").drop();
};

/**
 * @param db {import('mongodb').Db}
 * @param client {import('mongodb').MongoClient}
 * @returns {Promise<void>}
 */
export const down = async (db, client) => {};
