import { CommandInteraction } from 'discord.js'
import axios from 'axios'
import { createHash, randomBytes } from 'crypto'
import mongo from '../mongo'

export = {
  name: 'bind',
  permissions: ['MANAGE_GUILD'],
  interactionData: {
    name: 'bind',
    description: 'Create a Roblox role bind',
    options: [
      {
        type: 1,
        name: 'group',
        description: 'Create a group rank bind',
        options: [
          {
            type: 4,
            name: 'group_id',
            description: 'ID of Roblox group',
            required: true
          },
          {
            type: 8,
            name: 'role',
            description: 'The discord role to bind',
            required: true
          },
          {
            type: 4,
            name: 'rank',
            description: 'Optional rank of group role'
          }
        ]
      },
      {
        type: 1,
        name: 'badge',
        description: 'Create an experience badge bind',
        options: [
          {
            type: 4,
            name: 'badge_id',
            description: 'ID of experience badge',
            required: true
          },
          {
            type: 8,
            name: 'role',
            description: 'Discord role to bind',
            required: true
          }
        ]
      },
      {
        type: 1,
        name: 'bundle',
        description: 'Create a bind tied to ownership of a bundle',
        options: [
          {
            type: 4,
            name: 'bundle_id',
            description: 'ID of bundle',
            required: true
          },
          {
            type: 8,
            name: 'role',
            description: 'Discord role to bind',
            required: true
          }
        ]
      },
      {
        type: 1,
        name: 'gamepass',
        description: 'Creates a bind tied to ownership of a gamepass',
        options: [
          {
            type: 4,
            name: 'gamepass_id',
            description: 'ID of gamepass',
            required: true
          },
          {
            type: 8,
            name: 'role',
            description: 'Discord role to bind'
          }
        ]
      },
      {
        type: 1,
        name: 'asset',
        description: 'Creates a bind tied to a generic asset such an image, sound, or clothing article',
        options: [
          {
            type: 4,
            name: 'asset_id',
            description: 'ID of asset',
            required: true
          },
          {
            type: 8,
            name: 'role',
            description: 'Discord role to bind',
            required: true
          }
        ]
      },
      {
        type: 1,
        name: 'verified_status',
        description: 'Creates a bind tied to being verified with the RoVer registry',
        options: [
          {
            type: 8,
            name: 'role',
            description: 'Role to use for verified users',
            required: true
          }
        ]
      },
      {
        type: 1,
        name: 'unverified_status',
        description: 'Creates a bind tied to not being verified',
        options: [
          {
            type: 8,
            name: 'role',
            description: 'Role to use for unverified users',
            required: true
          }
        ]
      }
    ]
  },
  async exec (i: CommandInteraction): Promise<void> {
    if (!i.guild) throw Error('<CommandInteraction>.guild is null')
    const subc = i.options.getSubcommand(true)
    const bindDb = mongo.db().collection('binds')
      const bindId = createHash('sha256').update(randomBytes(256)).digest('base64')
      switch (subc) {
        case 'group':
          if (i.options.getInteger('group_id', true) < 1) return await i.reply({ content: 'Group IDs cannot be negative!', ephemeral: true })
          if (i.options.getInteger('group_id', true) === 0) return await i.reply({ content: 'You cannot use group 0, please bind another verified role.', ephemeral: true })
          const groupRequest = await axios('https://groups.roblox.com/v2/groups?groupIds=' + i.options.getInteger('group_id', true)).catch(e => console.error(e))
          if (!groupRequest) return await i.reply({ content: 'The group could not be validated!', ephemeral: true })
          if (!groupRequest.data.data?.length) return await i.reply({ content: 'This group does not exist!', ephemeral: true })
          await bindDb.insertOne({ id: bindId, server: i.guildId, type: 'group', role: i.options.getRole('role', true).id, group: i.options.getInteger('group_id', true), rank: i.options.getInteger('rank') })
          break

        case 'badge':
          if (i.options.getInteger('badge_id', true) < 0) return await i.reply({ content: 'Badge IDs cannot be negative!', ephemeral: true })
          const badgeVerify = await axios(`https://badges.roblox.com/v1/badges/${i.options.getInteger('badge_id')}`).catch(() => {})
          if (!badgeVerify) return await i.reply({ content: 'Badge could not be validated! Does it exist?', ephemeral: true })
          await bindDb.insertOne({ id: bindId, server: i.guildId, type: 'badge', role: i.options.getRole('role', true).id, asset: i.options.getInteger('badge_id', true) })
          break

        case 'bundle':
          if (i.options.getInteger('bundle_id', true) < 1) return await i.reply({ content: 'Bundle IDs cannot be less than 1!' })
          const bundleVerify = await axios(`https://catalog.roblox.com/v1/bundles/${i.options.getInteger('bundle_id', true)}/details`, {
            validateStatus: ((s) => {
              if (s === 400) return false
              return true
            })
          }).catch(e => console.error(e))
          if (!bundleVerify) return await i.reply({ content: 'An error occured when looking up the bundle! Please try again later.', ephemeral: true })
          if (bundleVerify.status === 400) return await i.reply({ content: 'The bundle you specified does not exist.', ephemeral: true })
          await bindDb.insertOne({ id: bindId, server: i.guildId, type: 'bundle', role: i.options.getRole('role', true).id, asset: i.options.getInteger('bundle_id', true) })
          break

        case 'gamepass':
          if (i.options.getInteger('gamepass_id', true) < 1) return await i.reply({ content: 'GamePass IDs cannot be less than 1!', ephemeral: true })
          const gamePassVerify = await axios(`https://api.roblox.com/marketplace/game-pass-product-info?gamePassId=${i.options.getInteger('gamepass_id', true)}`, {
            validateStatus: (s) => {
              if (s === 400) return false
              return true
            }
          }).catch(e => console.error(e))
          if (!gamePassVerify) return await i.reply({ content: 'An error occured when looking up that GamePass! Please try again later.' })
          if (gamePassVerify.status === 400) return await i.reply({ content: 'GamePass does not exist! Try again.', ephemeral: true })
          await bindDb.insertOne({ id: bindId, server: i.guildId, type: 'gamepass', role: i.options.getRole('role', true).id, asset: i.options.getInteger('gamepass_id', true) })
          break

        case 'asset':
          if (i.options.getInteger('asset_id', true) < 1) return await i.reply({ content: 'Asset IDs cannot be less than 1!', ephemeral: true })
          const assetVerify = await axios(`https://api.roblox.com/marketplace/productinfo?assetId=${i.options.getInteger('asset_id', true)}`, {
            validateStatus: (s) => {
              if (s === 400) return false
              return true
            }
          }).catch(e => console.error(e))
          if (!assetVerify) return await i.reply({ content: 'An error occured when looking up that asset! Please try again later.', ephemeral: true })
          if (assetVerify.status === 400) return await i.reply({ content: 'This asset does not exist! Try again.', ephemeral: true })
          await bindDb.insertOne({ id: bindId, server: i.guildId, type: 'asset', role: i.options.getRole('role', true).id, asset: i.options.getInteger('asset_id', true) })
          break

        case 'verified_status':
          await bindDb.insertOne({ id: bindId, server: i.guildId, type: 'verified', role: i.options.getRole('role', true).id })
          break

        case 'unverified_status':
          await bindDb.insertOne({ id: bindId, server: i.guildId, type: 'unverified', role: i.options.getRole('role', true).id })
          break

      }
      await i.reply({ content: 'Bind created! ID: ' + bindId })
  }
}
