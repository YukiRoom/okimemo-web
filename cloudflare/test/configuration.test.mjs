import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=file=>fs.readFile(path.join(root,file),'utf8');
test('D1 and Worker identifiers',async()=>{
 const s=await read('wrangler.jsonc');
 assert.match(s,/"name"\s*:\s*"okimemo-web"/);
 assert.match(s,/"binding"\s*:\s*"DB"/);
 assert.match(s,/"database_name"\s*:\s*"okimemo"/);
});
test('JWT and ownership checks',async()=>{
 const s=await read('worker.js');
 assert.match(s,/jwtVerify\(/);
 assert.match(s,/issuer:team\.origin/);
 assert.match(s,/audience:env\.POLICY_AUD/);
 assert.match(s,/WHERE notes\.user_id=excluded\.user_id/);
 assert.match(s,/DELETE FROM notes WHERE id=\? AND user_id=\?/);
});
test('client recovery',async()=>{
 const s=await read('public/index.html');
 assert.match(s,/const previous = state\.notes\.map/);
 assert.match(s,/state\.notes = previous/);
 assert.match(s,/Recovery sync failed/);
});
test('schema',async()=>{
 const s=await read('schema.sql');
 for(const field of ['id TEXT PRIMARY KEY','user_id TEXT NOT NULL','updated_at TEXT NOT NULL'])assert.ok(s.includes(field));
});
