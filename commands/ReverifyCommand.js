module.exports = {
  name: 'reverify',
  description: 'Sends links to change your verified account(s)',
  guildOnly: true,
  async execute (message) {
    message.reply('To change your verified account, please visit <https://verify.eryn.io> or <https://blox.link/verify> if you have verified on BloxLink but not RoVer.')
  }
}
