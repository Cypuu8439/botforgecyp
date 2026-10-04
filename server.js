const express=require('express');
const path=require('path');
const fs=require('fs');
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const cookieParser=require('cookie-parser');
const helmet=require('helmet');

const app=express();
const PORT=process.env.PORT||3000;
const JWT_SECRET=process.env.JWT_SECRET||'change-this-development-secret';
const ROOT=__dirname;
const DATA_DIR=path.join(ROOT,'data');
const DB_FILE=path.join(DATA_DIR,'db.json');

function emptyDb(){return {users:[],deployments:[],transactions:[],notifications:[],audit:[]};}
function readDb(){try{return JSON.parse(fs.readFileSync(DB_FILE,'utf8'));}catch{return emptyDb();}}
function writeDb(db){fs.mkdirSync(DATA_DIR,{recursive:true});fs.writeFileSync(DB_FILE,JSON.stringify(db,null,2));}
function id(p){return p+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);}
function publicUser(u){return {id:u.id,name:u.name,username:u.username,email:u.email,phone:u.phone||'',role:u.role||'user',status:u.status||'active',created:u.created};}
function sign(u){return jwt.sign({sub:u.id},JWT_SECRET,{expiresIn:'7d'});}
function setSession(res,u){res.cookie('bf_session',sign(u),{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:7*24*60*60*1000,path:'/'});}
function auth(req,res,next){
  try{
    const token=req.cookies.bf_session;
    if(!token)return res.status(401).json({error:'Authentication required'});
    const payload=jwt.verify(token,JWT_SECRET);
    const db=readDb(); const u=db.users.find(x=>x.id===payload.sub);
    if(!u)return res.status(401).json({error:'Session expired'});
    if(u.status==='blocked')return res.status(403).json({error:'Account is blocked'});
    if(u.status==='suspended')return res.status(403).json({error:'Account is suspended'});
    req.user=u; req.db=db; next();
  }catch{return res.status(401).json({error:'Invalid or expired session'});}
}
function admin(req,res,next){if(req.user?.role!=='admin')return res.status(403).json({error:'Admin access required'});next();}
function audit(db,actor,action,targetIds,note=''){db.audit.unshift({id:id('audit'),actor,targetIds,action,note,at:new Date().toISOString()});db.audit=db.audit.slice(0,500);}

app.use(helmet({contentSecurityPolicy:false}));
app.use(express.json({limit:'1mb'}));
app.use(cookieParser());

app.post('/api/auth/register',async(req,res)=>{
  const {name,username,email,phone='',password}=req.body||{};
  if(!name||name.trim().length<2)return res.status(400).json({error:'Enter your full name.'});
  if(!/^[A-Za-z0-9_.-]{3,30}$/.test(username||''))return res.status(400).json({error:'Username must be 3–30 valid characters.'});
  if(!/^\S+@\S+\.\S+$/.test(email||''))return res.status(400).json({error:'Enter a valid email address.'});
  if(!password||password.length<8)return res.status(400).json({error:'Password must be at least 8 characters.'});
  const db=readDb(),normalized=email.trim().toLowerCase();
  if(db.users.some(u=>u.email===normalized))return res.status(409).json({error:'An account with this email already exists.'});
  if(db.users.some(u=>u.username===username))return res.status(409).json({error:'Username is already in use.'});
  const user={id:id('usr'),name:name.trim(),username,email:normalized,phone:String(phone||'').trim(),passwordHash:await bcrypt.hash(password,12),role:'user',status:'active',created:new Date().toISOString()};
  db.users.push(user);
  db.notifications.push({id:id('n'),userId:user.id,title:'Welcome to BFBotForge Cyp',message:'Your account is ready. Explore bots, wallet and deployments.',type:'welcome',read:false,at:new Date().toISOString()});
  audit(db,user.id,'register',[user.id]);
  writeDb(db);setSession(res,user);res.json({user:publicUser(user)});
});

app.post('/api/auth/login',async(req,res)=>{
  const {email,password}=req.body||{}; const db=readDb(); const u=db.users.find(x=>x.email===String(email||'').trim().toLowerCase());
  if(!u||!(await bcrypt.compare(String(password||''),u.passwordHash)))return res.status(401).json({error:'Invalid email or password.'});
  if(u.status==='blocked')return res.status(403).json({error:'This account is blocked. Contact support.'});
  if(u.status==='suspended')return res.status(403).json({error:'This account is suspended. Contact support.'});
  audit(db,u.id,'login',[u.id]);writeDb(db);setSession(res,u);res.json({user:publicUser(u)});
});
app.post('/api/auth/logout',(req,res)=>{res.clearCookie('bf_session',{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'});res.json({ok:true});});
app.get('/api/auth/me',auth,(req,res)=>res.json({user:publicUser(req.user)}));

app.get('/api/me/state',auth,(req,res)=>{
  const db=req.db,u=req.user;
  const deployments=db.deployments.filter(x=>x.userId===u.id);
  const transactions=db.transactions.filter(x=>x.userId===u.id);
  const notifications=db.notifications.filter(x=>x.userId===u.id).sort((a,b)=>b.at.localeCompare(a.at));
  const wallet=transactions.reduce((sum,x)=>sum+(x.status==='confirmed'||x.status==='demo-confirmed'?Number(x.amount):0),0);
  res.json({wallet,deployments,transactions,notifications,rewards:{points:0,referrals:0,earned:0}});
});
app.post('/api/me/notifications/:notificationId/read',auth,(req,res)=>{
  const n=req.db.notifications.find(x=>x.id===req.params.notificationId&&x.userId===req.user.id);
  if(!n)return res.status(404).json({error:'Notification not found'});n.read=true;writeDb(req.db);res.json({ok:true});
});

app.post('/api/deployments',auth,(req,res)=>{
  const {botId,botName='Bot',packageName='50-20',price=0,session}=req.body||{};
  if(typeof session!=='string'||session.length<8||session.length>512)return res.status(400).json({error:'Invalid session ID/link.'});
  const cost=Number(price); if(!Number.isFinite(cost)||cost<0)return res.status(400).json({error:'Invalid deployment price.'});
  const db=req.db;
  const balance=db.transactions.filter(x=>x.userId===req.user.id&&(x.status==='confirmed'||x.status==='demo-confirmed')).reduce((s,x)=>s+Number(x.amount),0);
  if(balance<cost)return res.status(402).json({error:'Insufficient wallet balance.'});
  const d={id:id('dep'),userId:req.user.id,botId,bot:botName,package:packageName,price:cost,status:'Running',created:new Date().toISOString(),sessionMasked:session.slice(0,4)+'••••'+session.slice(-3)};
  db.deployments.unshift(d);db.transactions.push({id:id('tx'),userId:req.user.id,type:'deployment',amount:-cost,status:'confirmed',deploymentId:d.id,at:new Date().toISOString()});
  db.notifications.unshift({id:id('n'),userId:req.user.id,title:'Deployment started',message:botName+' is now running.',type:'deploy',read:false,at:new Date().toISOString()});
  writeDb(db);res.json({deployment:d});
});
app.post('/api/deployments/:deploymentId/action',auth,(req,res)=>{
  const d=req.db.deployments.find(x=>x.id===req.params.deploymentId&&x.userId===req.user.id);
  if(!d)return res.status(404).json({error:'Deployment not found'});
  const action=req.body?.action;
  if(action==='delete')req.db.deployments=req.db.deployments.filter(x=>x.id!==d.id);
  else if(action==='stop')d.status='Stopped';
  else if(action==='restart')d.status='Running';
  else return res.status(400).json({error:'Unsupported action'});
  writeDb(req.db);res.json({ok:true});
});
app.post('/api/wallet/demo-credit',auth,(req,res)=>{
  const amount=Number(req.body?.amount);
  if(!Number.isFinite(amount)||amount<50||amount>3000||amount%50!==0)return res.status(400).json({error:'Amount must be KSh 50–3,000 in KSh 50 steps.'});
  req.db.transactions.push({id:id('tx'),userId:req.user.id,type:'deposit',amount,status:'demo-confirmed',at:new Date().toISOString()});
  req.db.notifications.unshift({id:id('n'),userId:req.user.id,title:'Demo deposit credited',message:'KES '+amount.toFixed(2)+' was added for local testing.',type:'payment',read:false,at:new Date().toISOString()});
  writeDb(req.db);res.json({ok:true});
});

app.get('/api/admin/users',auth,admin,(req,res)=>res.json({users:req.db.users.map(u=>({...publicUser(u),deployments:req.db.deployments.filter(d=>d.userId===u.id).length,wallet:req.db.transactions.filter(t=>t.userId===u.id&&(t.status==='confirmed'||t.status==='demo-confirmed')).reduce((s,t)=>s+Number(t.amount),0),error:u.status==='error'?{code:'ACCOUNT_ERROR',message:'Account requires attention.'}:null}))}));
app.get('/api/admin/errors',auth,admin,(req,res)=>res.json({errors:req.db.users.filter(u=>u.status==='error').map(u=>({userId:u.id,name:u.name,email:u.email,code:'ACCOUNT_ERROR',message:'Account requires attention.'}))}));
app.get('/api/admin/audit',auth,admin,(req,res)=>res.json({audit:req.db.audit||[]}));
app.post('/api/admin/users/action',auth,admin,(req,res)=>{
  const {ids=[],action}=req.body||{}; const db=req.db;
  for(const uid of ids){const u=db.users.find(x=>x.id===uid);if(!u)continue;if(action==='delete'){db.users=db.users.filter(x=>x.id!==uid);db.deployments=db.deployments.filter(x=>x.userId!==uid);db.transactions=db.transactions.filter(x=>x.userId!==uid);db.notifications=db.notifications.filter(x=>x.userId!==uid);}else if(['activate','fix','suspend','block'].includes(action)){u.status=(action==='activate'||action==='fix')?'active':action;}}
  audit(db,req.user.id,action,ids);writeDb(db);res.json({ok:true});
});
app.post('/api/admin/broadcast',auth,admin,(req,res)=>{
  const message=String(req.body?.message||'').trim();if(!message)return res.status(400).json({error:'Message is required.'});
  const db=req.db;const now=new Date().toISOString();
  for(const u of db.users.filter(x=>x.status==='active'))db.notifications.unshift({id:id('n'),userId:u.id,title:'Admin announcement',message,type:'admin',read:false,at:now});
  audit(db,req.user.id,'broadcast',db.users.map(u=>u.id),message);writeDb(db);res.json({ok:true});
});
app.get('/api/admin/export/users',auth,admin,(req,res)=>{const rows=[['id','name','email','status','role','created']].concat(req.db.users.map(u=>[u.id,u.name,u.email,u.status,u.role,u.created]));res.type('text/csv').send(rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n'));});
app.get('/api/admin/export/audit',auth,admin,(req,res)=>{const rows=[['when','actor','action','targets','note']].concat((req.db.audit||[]).map(a=>[a.at,a.actor,a.action,(a.targetIds||[]).length,a.note||'']));res.type('text/csv').send(rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n'));});
app.get('/api/health',(req,res)=>res.json({ok:true,service:'BFBotForge Cyp',time:new Date().toISOString()}));

app.use(express.static(ROOT,{index:'index.html'}));
app.use('/api',(req,res)=>res.status(404).json({error:'API route not found'}));
app.use((req,res)=>res.status(404).sendFile(path.join(ROOT,'404.html')));

function bootstrap(){fs.mkdirSync(DATA_DIR,{recursive:true});if(!fs.existsSync(DB_FILE))writeDb(emptyDb());}
if(require.main===module){bootstrap();app.listen(PORT,()=>console.log('BFBotForge Cyp running on http://localhost:'+PORT));}
module.exports=app;
