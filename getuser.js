module.exports = {
  async getuser (member, message, guild) {
    let validmember = true
    let retrievedmember
    if (member.match(/(^<@!?[0-9]+>)/)) retrievedmember = message.mentions.members.first()
    else if (member.match(/[A-z]/)) await guild.members.fetch({ query: member, limit: 1 }).then(result => result.mapValues(values => { member = values }))
    else retrievedmember = await guild.members.fetch(member).catch(e => { if (e.httpStatus === 400) validmember = false })
    if (!validmember) await guild.members.fetch({ query: member, limit: 1 }).then(results => { results.mapValues(values => { member = values }) })
    return retrievedmember
  }
}
