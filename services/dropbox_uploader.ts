import Logger from "../logger";
import mongo from "../mongo";

const credDB = mongo.db("bot").collection("credentials");

export default async function (
  guild: string,
  content: Buffer,
  name: string,
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
      body: `grant_type=refresh_token&refresh_token=${credentials}`,
      headers: {
        authorization: `Basic ${Buffer.from(
          process.env.DROPBOX_KEY + ":" + process.env.DROPBOX_SECRET,
        )}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    };

    let refreshReq = await fetch(
      "https://api.dropboxapi.com/oauth2/token",
      refreshConf,
    );

    if (refreshReq.status === 429) {
      await new Promise((r) =>
        setTimeout(
          r,
          5 + parseInt(refreshReq.headers.get("Retry-After") ?? "0"),
        ),
      );

      refreshReq = await fetch(
        "https://api.dropboxapi.com/oauth2/token",
        refreshConf,
      );

      if (refreshReq.status !== 200) return true;
    }

    const refreshData = await refreshReq.json();

    await credDB
      .replaceOne(
        { guild, service: "dropbox" },
        {
          guild,
          service: "dropbox",
          ...refreshData,
          expires_at: Math.floor(Date.now() / 1000) + refreshData.expires_in,
        },
      )
      .catch(Logger);

    credentials = refreshData;
  }

  const uploadConf = {
    data: content,
    headers: {
      authorization: `Bearer ${credentials?.access_token}`,
      "content-type": "application/octet-stream",
      "dropbox-api-arg": `{"autorename":true,"mute":true,"path":"/${name}"}`,
    },
    method: "POST",
  };

  let uploadReq = await fetch(
    "https://content.dropboxapi.com/2/files/upload",
    uploadConf,
  );

  if (uploadReq.status === 429) {
    await new Promise((p) =>
      setTimeout(p, 5 + parseInt(uploadReq.headers.get("Retry-After") ?? "0")),
    );

    uploadReq = await fetch(
      "https://content.dropboxapi.com/2/files/upload",
      uploadConf,
    );
  } else if (uploadReq.status === 401) {
    await credDB.deleteOne({ guild, service: "dropbox" }).catch(Logger);
  } else if (uploadReq.status !== 200)
    return [false, { error: "Unknown error" }];

  return true;
}
