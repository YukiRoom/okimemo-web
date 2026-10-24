// Protect this Worker (including preview and static assets) with Cloudflare Access.
// Restrict the Access policy to the single intended user before publishing.
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
export default {
 async fetch(request,env,ctx){
  const url=new URL(request.url);
  if(!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
  if(!ctx.access) return json({error:'Cloudflare Access authentication required'},401);
  const identity=await ctx.access.getIdentity();
  const email=identity?.email?.toLowerCase();
  if(!email || !env.ALLOWED_EMAIL || email!==env.ALLOWED_EMAIL.toLowerCase()) return json({error:'Forbidden'},403);
  const user=email;
  try {
   if(url.pathname==='/api/me' && request.method==='GET') return json({id:user,email});
   if(url.pathname==='/api/notes' && request.method==='GET'){
    const {results}=await env.DB.prepare('SELECT * FROM notes WHERE user_id=? ORDER BY created_at DESC').bind(user).all();
    return json(results.map(n=>({...n,done:!!n.done,important:!!n.important})));
   }
   if(url.pathname==='/api/notes' && request.method==='PUT'){
    const n=await request.json();
    if(typeof n.id!=='string'||!n.id||n.id.length>150||typeof n.text!=='string'||n.text.length>100000) return json({error:'Invalid note'},400);
    const now=new Date().toISOString();
    // Existing owner cannot be overwritten by another user.
    const existing=await env.DB.prepare('SELECT user_id,created_at FROM notes WHERE id=?').bind(n.id).first();
    if(existing && existing.user_id!==user)return json({error:'Forbidden'},403);
    const allowedKind=['action','waiting','idea','memo'],allowedLayer=['today','soon','outside','memo','warehouse'];
    if(!allowedKind.includes(n.kind)||!allowedLayer.includes(n.layer))return json({error:'Invalid category'},400);
    await env.DB.prepare(`INSERT INTO notes(id,user_id,text,kind,layer,done,important,deadline,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET text=excluded.text,kind=excluded.kind,layer=excluded.layer,
    done=excluded.done,important=excluded.important,deadline=excluded.deadline,updated_at=excluded.updated_at
    WHERE notes.user_id=excluded.user_id`).bind(n.id,user,n.text,n.kind,n.layer,!!n.done?1:0,!!n.important?1:0,n.deadline||null,existing?.created_at||n.created_at||now,now).run();
    return json({ok:true});
   }
   if(url.pathname.startsWith('/api/notes/') && request.method==='DELETE'){
    const id=decodeURIComponent(url.pathname.slice('/api/notes/'.length));
    await env.DB.prepare('DELETE FROM notes WHERE id=? AND user_id=?').bind(id,user).run();
    return json({ok:true});
   }
   return json({error:'Not found'},404);
  } catch(e){console.error(e);return json({error:'Server error'},500);}
 }
};