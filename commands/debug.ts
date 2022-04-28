import { CommandInteraction, MessageEmbed, Team, User } from "discord.js";
import { execSync } from "child_process";

function getUptime(): string {
  let uptime = Math.floor(process.uptime());
  const hours = Math.floor(uptime / 3600);
  uptime -= hours * 3600;
  const minutes = Math.floor(uptime / 60);
  uptime -= minutes * 60;
  const seconds = uptime;
  return `${hours}h ${minutes}m ${seconds}s`;
}

function getMemoryUsage(): string {
  let memoryUsage = Math.floor(process.memoryUsage().heapUsed / 1024 / 1024);
  let memstring = `${memoryUsage} MB`;
  if (memoryUsage > 1024) {
    let gigs = Math.floor(memoryUsage / 1024);
    memoryUsage %= gigs * 1024;
    memstring = `${gigs} GB ${memoryUsage} MB`;
  }
  return memstring;
}

function getGitBranch(): string {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
  } catch {
    // .git was removed
    return "Unknown";
  }
}

function getGitRemote(): string {
  try {
    return execSync("git config --get remote.origin.url").toString().trim();
  } catch {
    // .git was removed
    return "Unknown";
  }
}

function getGitVersion(): string {
  try {
    return execSync("git rev-parse HEAD").toString().trim();
  } catch {
    // .git was removed
    return "Unknown";
  }
}

export = {
  name: "debug",
  async exec(i: CommandInteraction): Promise<void> {
    const clientApplication = await i.client.application?.fetch();
    let applicationOwner = "Unknown";
    if (clientApplication?.owner instanceof Team) {
      applicationOwner = clientApplication.owner.name + " (Team)";
    } else if (clientApplication?.owner instanceof User) {
      applicationOwner = clientApplication.owner.tag;
    }

    const embed = new MessageEmbed()
      .setAuthor({
        name: i.client.user?.tag ?? "Unknown Bot",
        iconURL: i.client.user?.displayAvatarURL(),
      })
      .addFields(
        { name: "Operator", value: applicationOwner },
        { name: "Node Version", value: process.version },
        { name: "Uptime", value: getUptime() },
        { name: "Memory Usage", value: getMemoryUsage() },
        { name: "Version", value: getGitVersion() },
        { name: "Repository", value: getGitRemote() },
        { name: "Branch", value: getGitBranch() },
        { name: "Server ID", value: i.guild?.id ?? "N/A" },
        {
          name: "Shard ID",
          value: i.client.shard
            ? `${i.client.shard.ids[0]} (${i.client.options.shardCount} total)`
            : "N/A",
        }
      );

    await i.reply({ embeds: [embed] });
  },
};
