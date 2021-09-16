import { CommandInteraction } from 'discord.js'

export = {
  name: 'bind',
  permissions: ['MANAGE_GUILD'],
  interactionData: {
    name: 'bind',
    description: 'Modify a Roblox role bind',
    options: [
      {
        type: 2,
        name: 'create',
        description: 'Creates a bind',
        options: [
          {
            type: 2,
            name: 'bind_type',
            description: 'What type of bind to create',
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
          }
        ]
      },
      {
        type: 1,
        name: 'delete',
        description: 'Deletes a bind',
        options: [
          {
            type: 3,
            name: 'id',
            description: 'The id of the bind - can be found with the list subcommand',
            required: true
          }
        ]
      },
      {
        type: 1,
        name: 'list',
        description: 'Lists all binds'
      }
    ]
  },
  async exec (i: CommandInteraction): Promise<void> {
    const subc = i.options.getSubcommand(true)
    switch (subc) {
      case 'group':
        
    }
  }
}
