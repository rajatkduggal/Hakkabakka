const allowedOrigins = new Set([
  "https://www.hakkabakka.in",
  "https://hakkabakka.in",
  "https://hakkabakka-admin-dashboard.pages.dev",
  "https://2153dc98.hakkabakka-admin-dashboard.pages.dev"
]);
function corsHeaders(req) {
  const origin = req.headers.get("Origin");
  const h = new Headers({
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  });
  if (origin && allowedOrigins.has(origin)) h.set("Access-Control-Allow-Origin", origin);
  return h;
}
const json = (req, data, status=200) => {
  const headers = corsHeaders(req);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("Cache-Control", "no-store");
  return new Response(JSON.stringify(data), {status, headers});
};
const cookieName = "hb_admin_session";
function b64(bytes){return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");}
async function sha(text){const d=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(text));return [...new Uint8Array(d)].map(b=>b.toString(16).padStart(2,"0")).join("");}
function parseCookie(req,name){const s=req.headers.get("Cookie")||"";const m=s.split(";").map(x=>x.trim()).find(x=>x.startsWith(name+"="));return m?decodeURIComponent(m.slice(name.length+1)):"";}
function setCookie(token,maxAge){return cookieName+"="+encodeURIComponent(token)+"; Path=/api; HttpOnly; Secure; SameSite=None; Max-Age="+maxAge;}
async function session(req,env){const token=parseCookie(req,cookieName);if(!token)return false;const h=await sha(token);const row=await env.DB.prepare("SELECT token_hash, expires_at FROM admin_sessions WHERE token_hash=?").bind(h).first();if(!row||row.expires_at<Date.now())return false;return true;}
function validOrigin(req){const origin=req.headers.get("Origin");return !origin||allowedOrigins.has(origin);}
async function handle(req,env){
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:corsHeaders(req)});
 if(!validOrigin(req))return json(req,{error:"Origin not allowed"},403);
 const url=new URL(req.url), p=url.pathname;
 if(p==="/api/health"&&req.method==="GET")return json(req,{ok:true,app:"HakkaBakka Admin API",mode:"protected"});
 if(p==="/api/login"&&req.method==="POST"){
   const body=await req.json().catch(()=>null);if(!body||typeof body.password!=="string"||body.password.length>200)return json(req,{error:"Invalid request"},400);
   if(!env.ADMIN_PASSWORD)return json(req,{error:"Admin password secret is not configured"},503);
   const expected=await sha(env.ADMIN_PASSWORD), supplied=await sha(body.password);
   if(expected!==supplied){await new Promise(r=>setTimeout(r,500));return json(req,{error:"Invalid credentials"},401);}
   const token=b64(crypto.getRandomValues(new Uint8Array(32)));
   const expires=Date.now()+8*60*60*1000;
   await env.DB.prepare("INSERT INTO admin_sessions(token_hash,expires_at,created_at) VALUES(?,?,?)").bind(await sha(token),expires,Date.now()).run();
   return new Response(JSON.stringify({ok:true,expiresAt:expires}),{status:200,headers:{"Content-Type":"application/json","Cache-Control":"no-store",...Object.fromEntries(corsHeaders(req)),"Set-Cookie":setCookie(token,28800)}});
 }
 if(p==="/api/logout"&&req.method==="POST"){const token=parseCookie(req,cookieName);if(token)await env.DB.prepare("DELETE FROM admin_sessions WHERE token_hash=?").bind(await sha(token)).run();return new Response(JSON.stringify({ok:true}),{status:200,headers:{"Content-Type":"application/json","Cache-Control":"no-store",...Object.fromEntries(corsHeaders(req)),"Set-Cookie":setCookie("",0)}});}
 if(!await session(req,env))return json(req,{error:"Authentication required"},401);
 if(p==="/api/menu"&&req.method==="GET"){const {results=[]}=await env.DB.prepare("SELECT id,name,category,price,available,updated_at FROM menu_items ORDER BY category,name").all();return json(req,{items:results});}
 if(p==="/api/menu"&&req.method==="POST"){
   const b=await req.json().catch(()=>null);if(!b||typeof b.name!=="string"||!b.name.trim()||b.name.length>120||!Number.isFinite(Number(b.price))||Number(b.price)<0||typeof b.category!=="string"||b.category.length>60)return json(req,{error:"Invalid menu item"},400);
   const id=crypto.randomUUID();await env.DB.prepare("INSERT INTO menu_items(id,name,category,price,available,updated_at) VALUES(?,?,?,?,1,?)").bind(id,b.name.trim(),b.category,Number(b.price),Date.now()).run();return json(req,{ok:true,id},201);
 }
 const menuMatch=p.match(/^\/api\/menu\/([a-f0-9-]+)$/i);
 if(menuMatch&&req.method==="PUT"){const b=await req.json().catch(()=>null);if(!b||typeof b.name!=="string"||!b.name.trim()||!Number.isFinite(Number(b.price))||Number(b.price)<0)return json(req,{error:"Invalid menu item"},400);await env.DB.prepare("UPDATE menu_items SET name=?,category=?,price=?,available=?,updated_at=? WHERE id=?").bind(b.name.trim(),String(b.category||"General"),Number(b.price),b.available===false?0:1,Date.now(),menuMatch[1]).run();return json(req,{ok:true});}
 if(menuMatch&&req.method==="DELETE"){await env.DB.prepare("DELETE FROM menu_items WHERE id=?").bind(menuMatch[1]).run();return json(req,{ok:true});}
 if(p==="/api/offers"&&req.method==="GET"){const {results=[]}=await env.DB.prepare("SELECT id,title,details,active,updated_at FROM offers ORDER BY updated_at DESC").all();return json(req,{items:results});}
 if(p==="/api/offers"&&req.method==="POST"){const b=await req.json().catch(()=>null);if(!b||typeof b.title!=="string"||!b.title.trim()||b.title.length>120)return json(req,{error:"Invalid offer"},400);const id=crypto.randomUUID();await env.DB.prepare("INSERT INTO offers(id,title,details,active,updated_at) VALUES(?,?,?,1,?)").bind(id,b.title.trim(),String(b.details||"").slice(0,1000),Date.now()).run();return json(req,{ok:true,id},201);}
 if(p==="/api/content"&&req.method==="GET"){const row=await env.DB.prepare("SELECT value,updated_at FROM app_content WHERE key='homepage'").first();return json(req,{content:row?JSON.parse(row.value):{latestPosts:[],announcements:[]},updatedAt:row?.updated_at||null});}
 if(p==="/api/content"&&req.method==="PUT"){const b=await req.json().catch(()=>null);if(!b||typeof b!=="object"||JSON.stringify(b).length>100000)return json(req,{error:"Invalid or oversized content"},400);const now=Date.now();await env.DB.prepare("INSERT INTO app_content(key,value,updated_at) VALUES('homepage',?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").bind(JSON.stringify(b),now).run();return json(req,{ok:true,updatedAt:now});}
 if(p==="/api/orders"&&req.method==="POST"){
   const b=await req.json().catch(()=>null);
   if(!b||!Array.isArray(b.items)||b.items.length<1||b.items.length>100||!Number.isFinite(Number(b.total))||Number(b.total)<0||typeof b.orderType!=="string")return json(req,{error:"Invalid POS order"},400);
   const id=crypto.randomUUID(), orderRef="HB-"+Date.now().toString(36).toUpperCase();
   const now=Date.now(), payload=JSON.stringify({source:"admin-pos",orderType:b.orderType,notes:String(b.notes||"").slice(0,1000),items:b.items.map(x=>({name:String(x.name||"").slice(0,120),price:Number(x.price),qty:Math.max(1,Math.min(99,Number(x.qty)||1))}))});
   await env.DB.prepare("INSERT INTO orders(id,order_ref,status,total,payment_status,payload,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)").bind(id,orderRef,"open",""+Number(b.total),"unpaid",payload,now,now).run();
   return json(req,{ok:true,id,orderRef,status:"open",payment_status:"unpaid",total:Number(b.total),created_at:now},201);
 }
 if(p==="/api/orders"&&req.method==="GET"){const {results=[]}=await env.DB.prepare("SELECT id,order_ref,status,total,payment_status,created_at FROM orders ORDER BY created_at DESC LIMIT 100").all();return json(req,{items:results});}
 return json(req,{error:"Not found"},404);
}
export default {async fetch(req,env){try{return await handle(req,env)}catch(e){return json(req,{error:"Server error"},500)}}};
