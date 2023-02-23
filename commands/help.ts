import { CommandInteraction } from "discord.js";
import { execSync } from "child_process";

export = {
  name: "help",
  async exec(i: CommandInteraction): Promise<void> {
    const remote = execSync("git config --get remote.origin.url")
      .toString()
      .trim()
      .replace(/\.git$/, "");
    const branch = execSync("git rev-parse --abbrev-ref HEAD")
      .toString()
      .trim();
    await i.reply({
      content: `Read the manual at ${remote}/blob/${branch}/MANUAL.md`,
    });
  },
};
