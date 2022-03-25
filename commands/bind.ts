import { CommandInteraction } from "discord.js";
import axios from "axios";
import { createHash, randomBytes } from "crypto";
import mongo from "../mongo";

export = {
  name: "bind",
  permissions: ["MANAGE_GUILD"],
  interactionData: {
    name: "bind",
    name_localizations: {
      "es-ES": "enlazar",
      "sv-SE": "binda",
    },
    description: "Create a Roblox role bind",
    description_localizations: {
      "es-ES": "Crea una enlace de rol de Roblox",
      "sv-SE": "Skapa en Roblox roll binda",
    },
    options: [
      {
        type: 1,
        name: "group",
        name_localizations: {
          "es-ES": "grupo",
          "sv-SE": "grupp",
        },
        description: "Create a group rank bind",
        description_localizations: {
          "es-ES": "Crea una enlace de rango de grupo",
          "sv-SE": "Skapa en grupp rank binda",
        },
        options: [
          {
            type: 4,
            name: "group_id",
            name_localizations: {
              "es-ES": "id_del_grupo",
              "sv-SE": "grupp_id",
            },
            description: "ID of Roblox group",
            description_localizations: {
              "es-ES": "ID del grupo de Roblox",
              "sv-SE": "Roblox grupp id",
            },
            required: true,
          },
          {
            type: 8,
            name: "role",
            name_localizations: {
              "es-ES": "rol",
              "sv-SE": "roll",
            },
            description: "The discord role to bind",
            description_localizations: {
              "es-ES": "El rol de discord a enlazar",
              "sv-SE": "Discord roll att binda",
            },
            required: true,
          },
          {
            type: 4,
            name: "rank",
            name_localizations: {
              "es-ES": "rango",
              "sv-SE": "rank",
            },
            description: "Optional rank of group role",
            description_localizations: {
              "es-ES": "Rango opcional del rol de grupo",
              "sv-SE": "Frivillig rank för grupp roll",
            },
          },
        ],
      },
      {
        type: 1,
        name: "badge",
        name_localizations: {
          "es-ES": "medalla",
          "sv-SE": "badge",
        },
        description: "Create an experience badge bind",
        description_localizations: {
          "es-ES": "Crea una enlace de medalla de experiencia",
          "sv-SE": "Skapa en erfarenhetsbadge binda",
        },
        options: [
          {
            type: 4,
            name: "badge_id",
            name_localizations: {
              "es-ES": "id_de_la_medalla",
              "sv-SE": "badge_id",
            },
            description: "ID of experience badge",
            description_localizations: {
              "es-ES": "ID de la medalla de experiencia",
              "sv-SE": "Erfarenhetsbadge id",
            },
            required: true,
          },
          {
            type: 8,
            name: "role",
            name_localizations: {
              "es-ES": "rol",
              "sv-SE": "roll",
            },
            description: "Discord role to bind",
            description_localizations: {
              "es-ES": "El rol de discord a enlazar",
              "sv-SE": "Discord roll att binda",
            },
            required: true,
          },
        ],
      },
      {
        type: 1,
        name: "bundle",
        name_localizations: {
          "es-ES": "manojo",
          "sv-SE": "bunt",
        },
        description: "Create a bind tied to ownership of a bundle",
        description_localizations: {
          "es-ES": "Crea una enlace con la propiedad de poseer un manojo",
          "sv-SE": "Skapa en bind med ägandet av en bunt",
        },
        options: [
          {
            type: 4,
            name: "bundle_id",
            name_localizations: {
              "es-ES": "id_del_manojo",
              "sv-SE": "bunt_id",
            },
            description: "ID of bundle",
            description_localizations: {
              "es-ES": "ID del manojo",
              "sv-SE": "Bunt id",
            },
            required: true,
          },
          {
            type: 8,
            name: "role",
            name_localizations: {
              "es-ES": "rol",
              "sv-SE": "roll",
            },
            description: "Discord role to bind",
            description_localizations: {
              "es-ES": "El rol de Discord a enlazar",
              "sv-SE": "Discord roll att binda",
            },
            required: true,
          },
        ],
      },
      {
        type: 1,
        name: "gamepass",
        name_localizations: {
          "es-ES": "paso_de_juego",
          "sv-SE": "spelpass",
        },
        description: "Creates a bind tied to ownership of a gamepass",
        description_localizations: {
          "es-ES":
            "Crea una enlace con la propiedad de poseer un paso de juego",
          "sv-SE": "Skapa en bind med ägandet av ett spelpass",
        },
        options: [
          {
            type: 4,
            name: "gamepass_id",
            name_localizations: {
              "es-ES": "id_del_paso_de_juego",
              "sv-SE": "spelpass_id",
            },
            description: "ID of gamepass",
            description_localizations: {
              "es-ES": "ID del paso de juego",
              "sv-SE": "Spelpass id",
            },
            required: true,
          },
          {
            type: 8,
            name: "role",
            name_localizations: {
              "es-ES": "rol",
              "sv-SE": "roll",
            },
            description: "Discord role to bind",
            description_localizations: {
              "es-ES": "El rol de Discord a enlazar",
              "sv-SE": "Discord roll att binda",
            },
          },
        ],
      },
      {
        type: 1,
        name: "asset",
        name_localizations: {
          "es-ES": "activo",
          "sv-SE": "tillgång",
        },
        description:
          "Creates a bind tied to a generic asset such an image, sound, or clothing article",
        description_localizations: {
          "es-ES":
            "Crea un enlace vinculado a un activo genérico (cualquier activo que no esté en la lista)",
          "sv-SE":
            "Skapa en bind med ägandet av en generell tillgång, som en bild, ljud eller kläderartikel",
        },
        options: [
          {
            type: 4,
            name: "asset_id",
            name_localizations: {
              "es-ES": "id_del_activo",
              "sv-SE": "tillgång_id",
            },
            description: "ID of asset",
            description_localizations: {
              "es-ES": "ID del activo",
              "sv-SE": "Tillgång id",
            },
            required: true,
          },
          {
            type: 8,
            name: "role",
            name_localizations: {
              "es-ES": "rol",
              "sv-SE": "roll",
            },
            description: "Discord role to bind",
            description_localizations: {
              "es-ES": "El rol de Discord a enlazar",
              "sv-SE": "Discord roll att binda",
            },
            required: true,
          },
        ],
      },
      {
        type: 1,
        name: "verified_status",
        name_localizations: {
          "es-ES": "estado_de_verificación",
          "sv-SE": "verifieringsstatus",
        },
        description:
          "Creates a bind tied to being verified with the RoVer registry",
        description_localizations: {
          "es-ES":
            "Crea una enlace con la propiedad de ser verificado con el registro RoVer",
          "sv-SE": "Skapa en bind med att verifieras med RoVer registret",
        },
        options: [
          {
            type: 8,
            name: "role",
            name_localizations: {
              "es-ES": "rol",
              "sv-SE": "roll",
            },
            description: "Role to use for verified users",
            description_localizations: {
              "es-ES": "Rol a usar para usuarios verificados",
              "sv-SE": "Roll att använda för verifierade användare",
            },
            required: true,
          },
        ],
      },
      {
        type: 1,
        name: "unverified_status",
        name_localizations: {
          "es-ES": "estado_de_no_verificación",
          "sv-SE": "ej_verifieringsstatus",
        },
        description: "Creates a bind tied to not being verified",
        description_localizations: {
          "es-ES": "Crea una enlace con la propiedad de no ser verificado",
          "sv-SE": "Skapa en bind med att inte verifieras",
        },
        options: [
          {
            type: 8,
            name: "role",
            name_localizations: {
              "es-ES": "rol",
              "sv-SE": "roll",
            },
            description: "Role to use for unverified users",
            description_localizations: {
              "es-ES": "Rol a usar para usuarios no verificados",
              "sv-SE": "Roll att använda för ej verifierade användare",
            },
            required: true,
          },
        ],
      },
      {
        type: 1,
        name: "friend_status",
        name_localizations: {
          "es-ES": "estado_de_amistad",
          "sv-SE": "vänstatus",
        },
        description: "Creates a bind tied to being friends with a user",
        description_localizations: {
          "es-ES":
            "Crea una enlace con la propiedad de ser amigo de un usuario",
          "sv-SE": "Skapa en bind med att vara vän med en användare",
        },
        options: [
          {
            type: 3,
            name: "username",
            name_localizations: {
              "es-ES": "nombre_de_usuario",
              "sv-SE": "användarnamn",
            },
            description: "Username of target user",
            description_localizations: {
              "es-ES": "Nombre de usuario de la persona a la que se amigas",
              "sv-SE": "Användarnamn på mål användare",
            },
            required: true,
          },
          {
            type: 8,
            name: "role",
            name_localizations: {
              "es-ES": "rol",
              "sv-SE": "roll",
            },
            description: "Discord role to bind",
            description_localizations: {
              "es-ES": "El rol de Discord a enlazar",
              "sv-SE": "Discord roll att binda",
            },
            required: true,
          },
        ],
      },
    ],
  },
  async exec(i: CommandInteraction): Promise<void> {
    if (!i.guild) throw Error("<CommandInteraction>.guild is null");
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
        if (i.options.getInteger("group_id", true) < 1)
          return await i.reply({
            content: "Group IDs cannot be negative!",
            ephemeral: true,
          });
        if (i.options.getInteger("group_id", true) === 0)
          return await i.reply({
            content:
              "You cannot use group 0, please bind another verified role.",
            ephemeral: true,
          });
        const groupRequest = await axios(
          "https://groups.roblox.com/v2/groups?groupIds=" +
            i.options.getInteger("group_id", true)
        ).catch((e) => console.error(e));
        if (!groupRequest)
          return await i.reply({
            content: "The group could not be validated!",
            ephemeral: true,
          });
        if (!groupRequest.data.data?.length)
          return await i.reply({
            content: "This group does not exist!",
            ephemeral: true,
          });
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
        if (i.options.getInteger("badge_id", true) < 0)
          return await i.reply({
            content: "Badge IDs cannot be negative!",
            ephemeral: true,
          });
        const badgeVerify = await axios(
          `https://badges.roblox.com/v1/badges/${i.options.getInteger(
            "badge_id"
          )}`
        ).catch(() => {});
        if (!badgeVerify)
          return await i.reply({
            content: "Badge could not be validated! Does it exist?",
            ephemeral: true,
          });
        await bindDb.insertOne({
          id: bindId,
          server: i.guildId,
          type: "badge",
          role: i.options.getRole("role", true).id,
          asset: i.options.getInteger("badge_id", true),
        });
        break;

      case "bundle":
        if (i.options.getInteger("bundle_id", true) < 1)
          return await i.reply({
            content: "Bundle IDs cannot be less than 1!",
          });
        const bundleVerify = await axios(
          `https://catalog.roblox.com/v1/bundles/${i.options.getInteger(
            "bundle_id",
            true
          )}/details`,
          {
            validateStatus: (s) => {
              return [200, 400].includes(s);
            },
          }
        ).catch(() => {});
        if (!bundleVerify)
          return await i.reply({
            content:
              "An error occured when looking up the bundle! Please try again later.",
            ephemeral: true,
          });
        if (bundleVerify.status === 400)
          return await i.reply({
            content: "The bundle you specified does not exist.",
            ephemeral: true,
          });
        await bindDb.insertOne({
          id: bindId,
          server: i.guildId,
          type: "bundle",
          role: i.options.getRole("role", true).id,
          asset: i.options.getInteger("bundle_id", true),
        });
        break;

      case "gamepass":
        if (i.options.getInteger("gamepass_id", true) < 1)
          return await i.reply({
            content: "GamePass IDs cannot be less than 1!",
            ephemeral: true,
          });
        const gamePassVerify = await axios(
          `https://api.roblox.com/marketplace/game-pass-product-info?gamePassId=${i.options.getInteger(
            "gamepass_id",
            true
          )}`,
          {
            validateStatus: (s) => {
              return [200, 400].includes(s);
            },
          }
        ).catch((e) => console.error(e));
        if (!gamePassVerify)
          return await i.reply({
            content:
              "An error occurred when looking up that GamePass! Please try again later.",
          });
        if (gamePassVerify.status === 400)
          return await i.reply({
            content: "GamePass does not exist! Try again.",
            ephemeral: true,
          });
        await bindDb.insertOne({
          id: bindId,
          server: i.guildId,
          type: "gamepass",
          role: i.options.getRole("role", true).id,
          asset: i.options.getInteger("gamepass_id", true),
        });
        break;

      case "asset":
        if (i.options.getInteger("asset_id", true) < 1)
          return await i.reply({
            content: "Asset IDs cannot be less than 1!",
            ephemeral: true,
          });
        const assetVerify = await axios(
          `https://api.roblox.com/marketplace/productinfo?assetId=${i.options.getInteger(
            "asset_id",
            true
          )}`,
          {
            validateStatus: (s) => {
              return [200, 400].includes(s);
            },
          }
        ).catch(() => {});
        if (!assetVerify)
          return await i.reply({
            content:
              "An error occurred when looking up that asset! Please try again later.",
            ephemeral: true,
          });
        if (assetVerify.status === 400)
          return await i.reply({
            content: "This asset does not exist! Try again.",
            ephemeral: true,
          });
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
        const userVerifyReq = await axios(
          "https://users.roblox.com/v1/usernames/users",
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            data: JSON.stringify({
              usernames: [i.options.getString("username", true)],
              excludeBannedUsers: false,
            }),
          }
        ).catch(() => {});
        if (!userVerifyReq)
          return await i.reply({
            content:
              "An error occurred when looking up that user! Please try again later.",
            ephemeral: true,
          });
        if (!userVerifyReq.data.data?.length)
          return await i.reply({
            content:
              "This user does not exist! Please make sure that you spelled it correctly.",
            ephemeral: true,
          });
        await bindDb.insertOne({
          id: bindId,
          server: i.guildId,
          type: "friend",
          role: i.options.getRole("role", true).id,
          friend: userVerifyReq.data.data[0].id,
        });
        break;
    }
    await i.reply({ content: "Bind created! ID: " + bindId });
  },
};
