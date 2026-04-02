import { pool  } from "./db.js";
import {sql, txq, sql_transact} from "./sql_connector.js";
const x="pass123"
const rows = await sql`SELECT * FROM users WHERE password = ${x}`;
for(const row of rows){
    console.log(row.username);
}
console.log(rows.length);
// console.log(rows[0]);
// console.log(rows[0]);