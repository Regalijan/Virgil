import { config as dotenv } from 'dotenv'
import { ShardingManager } from 'discord.js'
import { join } from 'path'

dotenv()

if (!process.env.DISCORDTOKEN) throw Error('No token was detected in the environment!')

const shardMgr = new ShardingManager(join(__dirname, 'shard.js'), {
  token: process.env.DISCORDTOKEN
})

shardMgr.on('shardCreate', function (shard) {
  console.log(`Launching shard ${shard.id + 1} of ${shardMgr.totalShards}.`)
})

shardMgr.spawn()

process.on('SIGTERM', function () {
  shardMgr.broadcastEval(bot => bot.destroy())
  process.exit()
})

process.on('SIGINT', function () {
  shardMgr.broadcastEval(bot => bot.destroy())
  process.exit()
})

process.on('SIGHUP', function () {
  shardMgr.broadcastEval(bot => bot.destroy())
  process.exit()
})