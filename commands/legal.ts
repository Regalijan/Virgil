import { ChatInputCommandInteraction } from "discord.js";
import { execSync } from "child_process";

export = {
  name: "legal",
  async exec(i: ChatInputCommandInteraction) {
    const remote = execSync("git config --get remote.origin.url")
      .toString()
      .trim()
      .replace(/\.git$/, "");
    const branch = execSync("git rev-parse --abbrev-ref HEAD")
      .toString()
      .trim();
    return await i.reply({
      content: `View the Terms of Service at ${remote}/blob/${branch}/Terms.md\nView the Privacy Policy at ${remote}/blob/${branch}/Privacy.md`,
      ephemeral: true,
    });
  },
};
