import { ChatInputCommandInteraction } from "discord.js";
import { createHash, randomBytes } from "crypto";
import mongo from "../mongo";

export = {
  name: "bind",
  async exec(i: ChatInputCommandInteraction): Promise<void> {
    if (!i.guild) throw Error("<ChatInputCommandInteraction>.guild is null");
    const subc = i.options.getSubcommand(true);
    const bindDb = mongo.db("bot").collection("binds");
    const bindId = createHash("sha256")
      .update(randomBytes(512))
      .digest("base64")
      .replaceAll("=", "")
      .replaceAll("/", "_")
      .replaceAll("+", "-");
    switch (subc) {
      case "group":
        if (i.options.getInteger("group_id", true) < 1) {
          await i.reply({
            content: "Group IDs cannot be negative!",
            ephemeral: true,
          });
          return;
        }

        if (i.options.getInteger("group_id", true) === 0) {
          await i.reply({
            content:
              "You cannot use group 0, please bind another verified role.",
            ephemeral: true,
          });
          return;
        }

        const groupRequest = await fetch(
          "https://groups.roblox.com/v2/groups?groupIds=" +
            i.options.getInteger("group_id", true)
        ).catch((e) => console.error(e));
        if (!groupRequest) {
          await i.reply({
            content: "The group could not be validated!",
            ephemeral: true,
          });
          return;
        }

        const groupData = await groupRequest.json();

        if (!groupData.data?.length) {
          await i.reply({
            content: "This group does not exist!",
            ephemeral: true,
          });
          return;
        }

        await bindDb.insertOne({
          id: bindId,
          server: i.guildId,
          type: "group",
          role: i.options.getRole("role", true).id,
          group: i.options.getInteger("group_id", true),
          rank: i.options.getInteger("rank"),
        });
        break;

      case "badge":
        if (i.options.getInteger("badge_id", true) < 0) {
          await i.reply({
            content: "Badge IDs cannot be negative!",
            ephemeral: true,
          });
          return;
        }

        const badgeVerify = await fetch(
          `https://badges.roblox.com/v1/badges/${i.options.getInteger(
            "badge_id"
          )}`
        ).catch(() => {});
        if (!badgeVerify?.ok) {
          await i.reply({
            content: "Badge could not be validated! Does it exist?",
            ephemeral: true,
          });
          return;
        }

        await bindDb.insertOne({
          id: bindId,
          server: i.guildId,
          type: "badge",
          role: i.options.getRole("role", true).id,
          asset: i.options.getInteger("badge_id", true),
        });
        break;

      case "bundle":
        if (i.options.getInteger("bundle_id", true) < 1) {
          await i.reply({
            content: "Bundle IDs cannot be less than 1!",
          });
        }

        const bundleVerify = await fetch(
          `https://catalog.roblox.com/v1/bundles/${i.options.getInteger(
            "bundle_id",
            true
          )}/details`
        ).catch(() => {});
        if (!bundleVerify) {
          await i.reply({
            content:
              "An error occured when looking up the bundle! Please try again later.",
            ephemeral: true,
          });
          return;
        }

        if (!bundleVerify.ok) {
          await i.reply({
            content: "The bundle you specified does not exist.",
            ephemeral: true,
          });
          return;
        }

        await bindDb.insertOne({
          id: bindId,
          server: i.guildId,
          type: "bundle",
          role: i.options.getRole("role", true).id,
          asset: i.options.getInteger("bundle_id", true),
        });
        break;

      case "gamepass":
        if (i.options.getInteger("gamepass_id", true) < 1) {
          await i.reply({
            content: "GamePass IDs cannot be less than 1!",
            ephemeral: true,
          });
          return;
        }

        const gamePassVerify = await fetch(
          `https://apis.roblox.com/game-passes/v1/game-passes/${i.options.getInteger(
            "gamepass_id",
            true
          )}/product-info`
        ).catch(() => {});

        if (!gamePassVerify) {
          await i.reply({
            content:
              "An error occurred when looking up that GamePass! Please try again later.",
          });
          return;
        }

        if (!gamePassVerify.ok) {
          await i.reply({
            content: "GamePass does not exist! Try again.",
            ephemeral: true,
          });
          return;
        }

        await bindDb.insertOne({
          id: bindId,
          server: i.guildId,
          type: "gamepass",
          role: i.options.getRole("role", true).id,
          asset: i.options.getInteger("gamepass_id", true),
        });
        break;

      case "asset":
        if (i.options.getInteger("asset_id", true) < 1) {
          await i.reply({
            content: "Asset IDs cannot be less than 1!",
            ephemeral: true,
          });
          return;
        }

        const assetVerify = await fetch(
          `https://economy.roblox.com/v2/assets/${i.options.getInteger(
            "asset_id",
            true
          )}/details`
        ).catch(() => {});

        if (!assetVerify) {
          await i.reply({
            content:
              "An error occurred when looking up that asset! Please try again later.",
            ephemeral: true,
          });
          return;
        }

        if (!assetVerify.ok) {
          await i.reply({
            content: "This asset does not exist! Try again.",
            ephemeral: true,
          });
          return;
        }

        await bindDb.insertOne({
          id: bindId,
          server: i.guildId,
          type: "asset",
          role: i.options.getRole("role", true).id,
          asset: i.options.getInteger("asset_id", true),
        });
        break;

      case "verified_status":
        await bindDb.insertOne({
          id: bindId,
          server: i.guildId,
          type: "verified",
          role: i.options.getRole("role", true).id,
        });
        break;

      case "unverified_status":
        await bindDb.insertOne({
          id: bindId,
          server: i.guildId,
          type: "unverified",
          role: i.options.getRole("role", true).id,
        });
        break;

      case "friend_status":
        const userVerifyReq = await fetch(
          "https://users.roblox.com/v1/usernames/users",
          {
            body: JSON.stringify({
              usernames: [i.options.getString("username", true)],
              excludeBannedUsers: false,
            }),
            headers: {
              "content-type": "application/json",
            },
            method: "POST",
          }
        ).catch(() => {});

        if (!userVerifyReq) {
          await i.reply({
            content:
              "An error occurred when looking up that user! Please try again later.",
            ephemeral: true,
          });
          return;
        }

        const userVerifyData = await userVerifyReq.json();

        if (!userVerifyData.data?.length) {
          await i.reply({
            content:
              "This user does not exist! Please make sure that you spelled it correctly.",
            ephemeral: true,
          });
          return;
        }

        await bindDb.insertOne({
          id: bindId,
          server: i.guildId,
          type: "friend",
          role: i.options.getRole("role", true).id,
          friend: userVerifyData.data[0].id,
        });
        break;
    }
    await i.reply({ content: "Bind created! ID: " + bindId });
  },
};
