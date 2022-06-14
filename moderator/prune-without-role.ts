import { delay } from 'https://deno.land/std@0.143.0/async/delay.ts';

/**
 * See the [documentation][user].
 * [user]: https://discord.com/developers/docs/resources/user#user-object
 */
interface User {
    /** Snowflake of the user ID. */
    id: string;
    /** Whether the user is a bot account. */
    bot?: boolean;
    /** Whether the user is an Official Discord System user. */
    system?: boolean;
}

/**
 * See the [documentation][guild-member].
 * [guild-member]: https://discord.com/developers/docs/resources/guild#guild-member-object
 */
interface GuildMember {
    /** Partial user information. */
    user: User;
    /** Array of role IDs (snowflakes) */
    roles: string[];
}

async function* getMembers() {
    let after: string | null = null;
    while (true) {
        const endpoint = `https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000`;
        const suffix = after === null ? '' : `&after=${after}`;

        const response = await fetch(endpoint + suffix, {
            method: 'GET',
            headers: { 'Authorization': ACCESS_TOKEN },
        });

        const members: GuildMember[] = await response.json();
        yield members;
        if (members.length < 1000) break;

        const last = members.at(-1)?.user.id;
        if (last === undefined) break;
        after = last;
    }
}

// Retrieve environment variables
const BOT_TOKEN = Deno.env.get('BOT_TOKEN');
const GUILD_ID = Deno.env.get('GUILD_ID');

if (!BOT_TOKEN || !GUILD_ID)
    throw new Error('missing environment variables');

const ACCESS_TOKEN = 'Bot ' + BOT_TOKEN;

// Get audit log reason
const reason = globalThis.prompt('Why are we kicking these users?');
if (!reason)
    throw new Error('must provide valid reason');

// Parse the set of required roles
const input = globalThis.prompt('Required roles IDs (comma-separated):')?.split(',');
const requiredRoles = new Set(input);
for await (const page of getMembers())
    for (const { user, roles } of page) {
        // Skip non-user accounts
        if (user.bot || user.system) continue;

        // Skip users that **have** the required role
        if (roles.some(role => requiredRoles.has(role))) continue;

        // Otherwise kick this user
        const res = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${user.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': ACCESS_TOKEN,
                'X-Audit-Log-Reason': reason,
            },
        });

        // Skip if successful
        if (res.status === 204) continue;

        // Throw if unknown status code
        if (res.status !== 429) throw new Error(`unknown status code: ${res.status}`);

        const scope = res.headers.get('X-RateLimit-Scope') ?? 'some';
        console.error(`Exceeded ${scope} rate limit...`);

        const limit = res.headers.get('X-RateLimit-Limit');
        if (limit) console.error(`Maximum requests: ${limit}...`);

        const reset = res.headers.get('X-RateLimit-Reset');
        if (reset) {
            const millis = Number(reset) * 1000;
            const date = new Date(millis);
            console.error(`Will retry after: ${date.toString()}...`);
        }

        const retry = res.headers.get('Retry-After');
        if (!retry) throw new Error('Retry-After header not present');
        console.error(`Waiting ${retry} seconds...`);

        const millis = Number(retry) * 1000;
        await delay(millis);
        break;
    }
