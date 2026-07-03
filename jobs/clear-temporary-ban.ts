import { backoffStrategies, type Job } from "agenda";
import {
  type Client,
  DiscordAPIError,
  type Guild,
  PermissionsBitField,
} from "discord.js";

export default {
  job: async function (
    job: Job<{ server: string; user: string }>,
    client: Client,
  ) {
    const { data } = job.attrs;
    let guild: Guild;

    try {
      guild = await client.guilds.fetch(data.server);
    } catch (e) {
      // Either cannot access guild (removed) or it no longer exists
      if (e instanceof DiscordAPIError && [403, 404].includes(e.status)) {
        return;
      }
      return job.fail(e as any);
    }

    if (
      !guild.members.me?.permissions.has(PermissionsBitField.Flags.BanMembers)
    )
      return job.fail(`Lack ban permissions in guild ${data.server}`);

    try {
      await guild.bans.remove(data.user);
    } catch (e) {
      if (e instanceof DiscordAPIError && e.status === 404) return;
      return job.fail(e as any);
    }
  },
  options: {
    backoff: backoffStrategies.exponential({
      delay: 60000,
      factor: 2,
      maxRetries: 10,
      jitter: 0.125,
    }),
  },
};
