import Logger from "../logger";
import mongo from "../mongo";

const credDB = mongo.db("bot").collection("credentials");

export default async function (
  guild: string,
  content: Buffer,
  name: string,
): Promise<boolean | [boolean, { [k: string]: any }]> {
  let credentials = await credDB
    .findOne({ guild, service: "google" })
    .catch(Logger);

  if (!credentials) return false;

  if (credentials.expires_at <= Math.floor(Date.now() / 1000) - 10) {
    if (!credentials.refresh_token) {
      await credDB.deleteOne({ guild, service: "google" }).catch(Logger);
      return [
        false,
        {
          error:
            "Refresh token was missing, Google Drive uploads are disabled. Please reconnect your Google account on the dashboard.",
        },
      ];
    }

    const refreshConf = {
      body: `client_id=${process.env.GOOGLE_CLIENT_ID}&client_secret=${process.env.GOOGLE_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${credentials.refresh_token}`,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    };

    const refreshReq = await fetch(
      "https://oauth2.googleapis.com/token",
      refreshConf,
    );

    if (!refreshReq.ok)
      return [
        false,
        {
          error:
            "Google returned an error when refreshing connection. Please reconnect your Google account on the dashboard.",
        },
      ];

    const refreshData = await refreshReq.json();

    await credDB
      .replaceOne(
        { guild, service: "google" },
        {
          guild,
          service: "google",
          ...refreshData,
          expires_at: Math.floor(Date.now() / 1000) + refreshData.expires_in,
        },
      )
      .catch(Logger);

    credentials = refreshData;
  }

  const uploadReq = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      body: `--le_boundary
    content-type: application/json; charset=UTF-8

    {"name":"${name}"}
    --le_boundary
    content-type: text/plain

    ${content}
    --le_boundary--`,
      headers: {
        authorization: `Bearer ${credentials?.access_token}`,
        "content-type": `multipart/related; boundary=le_boundary`,
      },
      method: "POST",
    },
  );

  if (uploadReq.status !== 200) return [false, await uploadReq.json()];

  return true;
}
