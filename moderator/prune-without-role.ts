import { env } from '../src/env.ts';

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
        const endpoint = `https://discord.com/api/v10/guilds/${env.GUILD_ID}/members?limit=1000`;
        const suffix = after === null ? '' : `&after=${after}`;

        const response = await fetch(endpoint + suffix, {
            method: 'GET',
            headers: { 'Authorization': env.ACCESS_TOKEN },
        });

        const members: GuildMember[] = await response.json();
        yield members;
        if (members.length < 1000) break;

        const last = members.at(-1)?.user.id;
        if (last === undefined) break;
        after = last;
    }
}

// Get audit log reason
const reason = globalThis.prompt('Why are we kicking these users?');
if (!reason)
    throw new Error('must provide valid reason');

// Parse the set of required roles
const input = globalThis.prompt('Required Roles:')?.split(',');
const requiredRoles = new Set(input);
for await (const page of getMembers())
    for (const { user, roles } of page) {
        // Skip non-user accounts
        if (user.bot || user.system) continue;

        // Skip users that **have** the required role
        if (roles.some(role => requiredRoles.has(role))) continue;

        // Otherwise kick this user
        const res = await fetch(`https://discord.com/api/v10/guilds/${env.GUILD_ID}/members/${user.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': env.ACCESS_TOKEN,
                'X-Audit-Log-Reason': reason,
            },
        });

        // Stop the script for any errors
        if (res.status !== 204)
            throw new Error(`[@${user.id}]: ${res.status} ${res.statusText}`);
    }
