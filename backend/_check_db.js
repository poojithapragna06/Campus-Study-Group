import { sql } from './dbUtils/sql_utl/sql_connector.js';

try {
    const requests = await sql`SELECT * FROM friend_requests`;
    console.log('FRIEND_REQUESTS:', JSON.stringify(requests, null, 2));

    const friends = await sql`SELECT * FROM friends`;
    console.log('FRIENDS:', JSON.stringify(friends, null, 2));

    const users = await sql`SELECT userID, username FROM users`;
    console.log('USERS:', JSON.stringify(users, null, 2));
} catch (e) {
    console.error('ERROR:', e.message);
}
process.exit(0);
