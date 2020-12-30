module.exports = {
  name: 'nowplaying',
  description: 'Shows the currently playing track',
  guildOnly: true,
  async execute (message, args) {
    const db = require('../database')
    const { MessageEmbed } = require('discord.js')
    const player = require('./PlayCommand')
    const ytdl = require('ytdl-core')
    const queue = await db.query('SELECT * FROM music_queue WHERE guild = $1;', [message.guild.id])
    const timepassed = Math.floor(Date.now() / 1000) - Math.floor(player.startedAt / 1000)
    const metadata = await ytdl.getInfo(queue.rows[0].media)
    const minutes = Math.floor(timepassed / 60)
    const embed = new MessageEmbed()
      .setTitle('Now Playing')
      .setDescription(`[${queue.rows[0].title}](${queue.rows[0].media})\n\nRequested by <@${queue.rows[0].requester}>`)
      .setColor(3756250)
      .setFooter(`:arrow_forward: ${minutes}:${timepassed - (minutes * 60)} / ${Math.floor(metadata.videoDetails.lengthSeconds / 60)}:${metadata.videoDetails.lengthSeconds % 60}`)
    message.channel.send(embed)
  }
}
