# User Manual

Virgil is a multipurpose bot designed to do it all. Obviously we're not quite there yet as this bot is a major work-in-progress.

Legend:

- `?` - Optional
- `<blah: $type>` - Argument (with type)

### Roblox Commands

- `/verify` - Does what you think it does
- `/update` - Updates a user's Roblox roles (has a user context equivalent)
- `/reverify` - Sends instructions to change linked Roblox account
- `/roblox` - Displays Roblox profile information
- `/troubleshoot` - Generates a troubleshooting link to fix Roblox account connection issues

### Server Management

- `/antiphish status` - Display current antiphish settings
- `/antiphish toggle-antiphish` - Toggles antiphish on/off
- `/antiphish toggle-autoban` - Toggles autoban on/off
- `/antiphish set-message <message: string>` - Sets the antiphish ban message
- `/banmessage set <message: string>` - Sets the message to send when a user is banned (displayed before reason)
- `/banmessage clear` - Clears the ban message
- `/bind group <group_id: integer> <role: RoleResolvable> <rank?: integer>` - Bind a role to a group and rank
- `/bind badge <badge_id: integer> <role: RoleResolvable>` - Bind a role to a badge
- `/bind bundle <bundle_id: integer> <role: RoleResolvable>` - Bind a role to a bundle
- `/bind gamepass <gamepass_id: integer> <role: RoleResolvable>` - Bind a role to a GamePass
- `/bind asset <asset_id: integer> <role: RoleResolvable>` - Bind a role to a generic asset (any type not previously mentioned)
- `/bind unverified_status <role: RoleResolvable>` - Bind a role to not being verified (should not be used as a replacement for appropriate channel permissions)
- `/bind verified_status <role: RoleResolvable>` - Bind a role to being verified
- `/bind friend_status <role: RoleResolvable>` - Bind a role to being a friend with a user
- `/deletebind <id: string>` - Deletes a bind
- `/factoryreset` - Deletes **ALL** settings and leaves the server
- `/filter add <word: string> <filter_type: exact | wildcard> <case_sensitive?: boolean>` - Adds a word filter
- `/filter add_bypass <entity: Mentionable>` - Adds a bypass to the word filter
- `/filter list` - List all word filters
- `/filter list_bypasses` - List all entities that bypass the word filter
- `/filter remove <id: string>` - Remove a word filter
- `/filter remove_bypass` - Remove a bypass from the word filter-
- `/initialize` - Initializes the server's settings in the database (this is only used if the bot is added when it is offline)
- `/listbinds` - Lists all binds
- `/nicknameformat <format: string>` - Sets the nickname format (see [nickname formatting](#nickname-formatting))
- `/nicknamelock` - Sets whether usernames should periodically be updated

### Moderation

- `/autosilence <channel: VoiceChannel> <decibels: integer>` - Mutes users in a voice channel at a given decibel level (NOT WORKING YET)
- `/ban <user: UserResolvable> <reason?: string> <days?: integer> <hours?: integer> <minutes?: integer>` - Bans a user (for time specified - otherwise permanent)
- `/kick <user: UserResolvable> <reason?: string>` - Kicks a user
- `/mute <user: UserResolvable> <reason?: string> <hours?: integer> <minutes?: integer>` - Mutes a user

### Utility

- `/avatar <user?: UserResolvable>` - Displays a user's avatar
- `/help` - Sends link to this document
- `/ping` - Displays the bot's ping
- `/serverinfo` - Displays server information
- `/whois <user?: UserResolvable>` - Displays information about a user

### Fun

- `/8ball <question: string>` - Answers a question
- `/birb` - Displays a random bird image
- `/bonk <user: UserResolvable>` - Bonks a user
- `/cat` - Displays a random cat image
- `/dog` - Displays a random dog image
- `/duck` - Displays a random duck image
- `/fact` - Displays a random fact
- `/httpcat` - Displays an HTTP cat image
- `/hug <user: UserResolvable>` - Hugs a user
- `/internetspeed` - Displays your current internet speed (not really)
- `/legal` - Sends a link to the Privacy Policy and Terms of Service
- `/noobdetector <user: UserResolvable>` - Detects noobiness of user
- `/owoify <text: string>` - Owoifies your message
- `/say <text: string>` - Says something (Admin only)

### Log Configuration

Log configuration is more complex compared to the other commands, which is why there is a dedicated section.

The general syntax is `/logs {action} <channel: Channel> <log_type: string>`. Not choosing a log type is interpreted as selecting all of them.

Actions:

- `ignore` - Ignores specified log type in specified channel
- `list` - Lists all log settings
- `remove` - Removes specified log type from specified channel
- `set` - Set a channel to receive specified log type
- `show_ignored` - Lists all ignored channels and the associated log types
- `unignore` - Unignores specified log type in specified channel

The channel types vary depending on the log type. For instance, you cannot ignore voice logs for a text channel.

Log types:

- `ban` - Bans (GUILD_BAN_ADD)
- `delete` - Message deletions (MESSAGE_DELETE)
- `edit` - Message edits (MESSAGE_UPDATE)
- `member_join` - Member joins (GUILD_MEMBER_ADD)
- `member_leave` - Member leaves (GUILD_MEMBER_REMOVE) - Note: This is also triggered by banning or kicking a user
- `message_report_actions` - Reported message is acted on by a moderator
- `message_reports` - A message is reported to server moderators
- `nickname` - Nickname changes (GUILD_MEMBER_UPDATE)
- `role` - Member roles are updated (GUILD_MEMBER_UPDATE)
- `thread_create` - Threads are created (THREAD_CREATE)
- `thread_delete` - Threads are deleted (THREAD_DELETE)
- `thread_update` - Threads are updated (THREAD_UPDATE)
- `unban` - Ban is removed (GUILD_BAN_REMOVE)
- `voice_deafen` - User was deafened/undeafened (VOICE_STATE_UPDATE)
- `voice_join` - User joined a voice channel (VOICE_STATE_UPDATE)
- `voice_leave` - User left a voice channel (VOICE_STATE_UPDATE)
- `voice_mute` - User was muted/unmuted (VOICE_STATE_UPDATE)
- `voice_switch` - User switched voice channels (VOICE_STATE_UPDATE)
- `voice_video` - User started/stopped streaming video (VOICE_STATE_UPDATE)
- `warn` - A moderator warned a user

### Nickname Formatting

The following variables can be used in the nickname format:

- `{{USERNAME}}` - The user's Roblox username
- `{{DISPLAYNAME}}` - The user's Roblox display name
- `{{ROBLOXID}}` - The user's Roblox ID (an integer)
- `{{DISCORDNAME}}` - The user's Discord username
- `{{DISCORDID}}` - The user's Discord ID (a snowflake)
- `{{SERVER}}` - The server's name
- `{{SMARTNAME}}` - The user's Roblox display name, if the same as their Roblox username, otherwise displays as `{{DISPLAYNAME}} ({{USERNAME}})`

The default format is `{{SMARTNAME}}`.
