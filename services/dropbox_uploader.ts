import axios from "axios";
import Logger from "../logger";
import mongo from "../mongo";

const credDB = mongo.db("bot").collection("credentials");

export default async function (
  guild: string,
  content: Buffer,
  name: string
): Promise<boolean | [boolean, { [k: string]: any }]> {
  let credentials = await credDB
    .findOne({ guild, service: "dropbox" })
    .catch(Logger);

  if (!credentials) return false;

  if (credentials.expires_at <= Math.floor(Date.now() / 1000) - 10) {
    if (!credentials.refresh_token) {
      await credDB.deleteOne({ guild, service: "dropbox" }).catch(Logger);
      return [
        false,
        {
          error:
            "Refresh token was missing, Dropbox uploads are disabled. Please reconnect your Dropbox account on the dashboard.",
        },
      ];
    }

    const refreshConf = {
      data: `grant_type=refresh_token&refresh_token=${credentials}`,
      headers: {
        authorization: `Basic ${Buffer.from(
          process.env.DROPBOX_KEY + ":" + process.env.DROPBOX_SECRET
        )}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      validateStatus: () => true,
    };

    let refreshReq = await axios(
      "https://api.dropboxapi.com/oauth2/token",
      refreshConf
    );

    if (refreshReq.status === 429) {
      await new Promise((r) =>
        setTimeout(r, 5 + parseInt(refreshReq.headers["Retry-After"] ?? "0"))
      );

      refreshReq = await axios(
        "https://api.dropboxapi.com/oauth2/token",
        refreshConf
      );

      if (refreshReq.status !== 200) return true;
    }

    await credDB
      .replaceOne(
        { guild, service: "dropbox" },
        {
          guild,
          service: "dropbox",
          ...refreshReq.data,
          expires_at:
            Math.floor(Date.now() / 1000) + refreshReq.data.expires_in,
        }
      )
      .catch(Logger);

    credentials = refreshReq.data;
  }

  const uploadConf = {
    data: content,
    headers: {
      authorization: `Bearer ${credentials?.access_token}`,
      "content-type": "application/octet-stream",
      "dropbox-api-arg": `{"autorename":true,"mute":true,"path":"/${name}"}`,
    },
    method: "POST",
    validateStatus: () => true,
  };

  let uploadReq = await axios(
    "https://content.dropboxapi.com/2/files/upload",
    uploadConf
  );

  if (uploadReq.status === 429) {
    await new Promise((p) =>
      setTimeout(p, 5 + parseInt(uploadReq.headers["Retry-After"] ?? "0"))
    );

    uploadReq = await axios(
      "https://content.dropboxapi.com/2/files/upload",
      uploadConf
    );
  } else if (uploadReq.status === 401) {
    await credDB.deleteOne({ guild, service: "dropbox" }).catch(Logger);
  } else if (uploadReq.status !== 200)
    return [false, { error: "Unknown error" }];

  return true;
}
