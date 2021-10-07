import { config as dotenv } from 'dotenv'
import { ShardingManager } from 'discord.js'
import { join } from 'path'
import mongo from './mongo'
import { WebRiskServiceClient } from '@google-cloud/web-risk'
import Sentry from './sentry'

dotenv()

mongo.connect()

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

if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const WRClient = new WebRiskServiceClient()
  const wrStore = mongo.db('bot').collection('webrisk')
  setInterval(async function (): Promise<void> {
    const nextDiffTime = await wrStore.findOne({ malwareRecommendedNextDiff: { $lte: Date.now() } }).catch(() => {})
    if (!nextDiffTime) {
      const malwareListArr = await WRClient.computeThreatListDiff({ threatType: 'MALWARE' }).catch(e => {
        process.env.DSN ? Sentry.captureException(e) : console.error(e)
      })
      if (!malwareListArr) return
      const malwareList = malwareListArr[0]
      const malwareChecksum = malwareList.checksum?.sha256
    }
  }, 45000)
}
