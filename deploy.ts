import axios from "axios";
import { config as dotenv } from "dotenv";
import { readdirSync } from "fs";
import { join } from "path";
import { ApplicationCommandData } from "discord.js";

dotenv();

if (!process.env.DISCORDTOKEN) throw Error("No token found in environment!");

if (process.env.SKIPDEPLOY) {
  console.log("Skipping deploy...");
  process.exit();
}

const commands: ApplicationCommandData[] = [];

for (const file of readdirSync(join(__dirname, "interaction_data")).filter(
  (f) => f.endsWith(".json")
)) {
  const data = require(join(__dirname, "interaction_data", file));
  commands.push(data);
}

axios("https://discord.com/api/v10/users/@me", {
  headers: {
    authorization: `Bot ${process.env.DISCORDTOKEN}`,
  },
}).then((me) => {
  axios(`https://discord.com/api/v10/applications/${me.data.id}/commands`, {
    headers: {
      authorization: `Bot ${process.env.DISCORDTOKEN}`,
      "content-type": "application/json",
    },
    method: "PUT",
    data: JSON.stringify(commands),
    validateStatus: () => {
      return true;
    },
  }).then((regResponse) => {
    console.log(
      regResponse.status === 200
        ? "Deployment Succeeded"
        : `${JSON.stringify(
            regResponse.data
          )}\nAn error occurred while deploying! Read the logs above.`
    );
    process.exit(); // ioredis starts for some unknown reason and the process continues to run because of it
  });
});
