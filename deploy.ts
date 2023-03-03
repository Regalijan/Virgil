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
  // Interaction definitions are copied during container build, this must be done manually without Docker
  (f) => f.endsWith(".json")
)) {
  const data = require(join(__dirname, "interaction_data", file));
  commands.push(data);
}

(async function () {
  const currentUserReq = await fetch("https://discord.com/api/v10/users/@me", {
    headers: {
      authorization: `Bot ${process.env.DISCORDTOKEN}`,
    },
  });

  if (!currentUserReq.ok)
    throw new Error(
      `Failed to retrieve current application information: ${await currentUserReq.json()}`
    );

  const { id } = await currentUserReq.json();
  const registerReq = await fetch(
    `https://discord.com/api/v10/applications/${id}/commands`,
    {
      body: JSON.stringify(commands),
      headers: {
        authorization: `Bot ${process.env.DISCORDTOKEN}`,
        "content-type": "application/json",
      },
      method: "PUT",
    }
  );

  if (!registerReq.ok)
    throw new Error(`Failed to register commands: ${await registerReq.json()}`);

  console.log("Deployment succeeded");
})();
