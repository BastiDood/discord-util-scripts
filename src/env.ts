const BOT_TOKEN = Deno.env.get('BOT_TOKEN');
const GUILD_ID = Deno.env.get('GUILD_ID');

if (!BOT_TOKEN || !GUILD_ID)
    throw new Error('missing environment variables');

const ACCESS_TOKEN = 'Bot ' + BOT_TOKEN;
export const env = { ACCESS_TOKEN, GUILD_ID };
