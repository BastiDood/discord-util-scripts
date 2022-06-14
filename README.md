# Discord HTTP API Utility Scripts
This repository contains an assorted collection of utility scripts for directly interacting with the Discord HTTP API. It is mainly for one-off scripts that simply need to invoke a specific HTTP endpoint.

# General Instructions
Before proceeding, [Deno](https://deno.land) must first be installed on the machine. A bot user must then be created via the [Discord Developer Portal](https://discord.com/developers/applications), from which we will retrieve the required bot token.

```bash
# Set the bot token and guild ID we want to interact with.
BOT_TOKEN=
GUILD_ID=

# Invoke the utility script with the correct permissions.
# Note that we may choose any other script instead.
deno run --allow-env --allow-net moderator/prune-without-roles.ts
```
