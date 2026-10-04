(function(){
  const C=window.BOTFORGE_CONFIG||{};
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const toast=(msg,type='info')=>{let box=$('#toast');if(!box){box=document.createElement('div');box.id='toast';document.body.appendChild(box)}const el=document.createElement('div');el.className='toast '+type;el.setAttribute('role','status');el.textContent=msg;box.appendChild(el);setTimeout(()=>el.remove(),3600)};
  const user=()=>read('bf_user',null);
  const money=n=>`${C.currency||'KES'} ${Number(n||0).toLocaleString('en-KE',{minimumFractionDigits:2})}`;
  const state=()=>read('bf_state',{wallet:0,notifications:[],deployments:[],transactions:[]});
  const saveState=s=>write('bf_state',s);
  window.BF={toast,user,money,read,write,state,saveState};

  const theme=localStorage.getItem('bf_theme')||'light'; document.documentElement.dataset.theme=theme;
  document.addEventListener('click',e=>{
    const t=e.target.closest('[data-theme]'); if(t){const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;localStorage.setItem('bf_theme',next);$$('[data-theme]').forEach(b=>b.textContent=next==='dark'?'☀':'☾');}
    const menu=e.target.closest('[data-menu]'); if(menu){document.body.classList.toggle('nav-open');menu.setAttribute('aria-expanded',document.body.classList.contains('nav-open'));}
    if(e.target.closest('[data-close-nav]')) document.body.classList.remove('nav-open');
    if(e.target.closest('.nav-backdrop')) document.body.classList.remove('nav-open');
  });
  $$('[data-theme]').forEach(b=>b.textContent=theme==='dark'?'☀':'☾');

  const path=location.pathname.split('/').pop()||'index.html';
  $$('.side-link[href]').forEach(a=>{const href=a.getAttribute('href');if(href===path)a.classList.add('active')});

  const grid=$('#botGrid');
  if(grid){const bots=Array.isArray(C.bots)?C.bots:[];if(!bots.length){grid.innerHTML='<div class="empty"><div class="empty-icon">{ }</div><div class="eyebrow">BOT MARKETPLACE</div><h3>No bots available yet</h3><p>We are preparing new hosting options for BFBotForge Cyp. Check back soon.</p><span class="status off">Coming soon</span></div>'}else grid.innerHTML=bots.map(b=>`<article class="card bot-card"><span class="status">Available</span><h3>${escapeHtml(b.name||'Bot')}</h3><p>${escapeHtml(b.description||'Bot hosting option.')}</p><div class="card-meta"><strong>${money(b.price||0)}</strong><span>${escapeHtml(b.category||'Bot hosting')}</span></div><a class="btn" href="deploy.html?bot=${encodeURIComponent(b.id||b.name||'bot')}">View details</a></article>`).join('')}

  const n=$('#userName'); if(n){const u=user(); n.textContent=u?.name||u?.email?.split('@')[0]||'there'}
  const date=$('#currentDate'); if(date) date.textContent=new Intl.DateTimeFormat('en-US',{dateStyle:'full'}).format(new Date());
  const time=$('#currentTime'); if(time){const tick=()=>time.textContent=new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit'}).format(new Date());tick();setInterval(tick,30000)}

  const s=state(); const bal=$('#walletBalance'); if(bal)bal.textContent=money(s.wallet);
  const depCount=$('#activeBots'); if(depCount)depCount.textContent=s.deployments.filter(x=>x.status==='Running'||x.status==='Deploying').length;
  const notifCount=$('#notificationCount'); if(notifCount)notifCount.textContent=s.notifications.filter(x=>!x.read).length;
  const dep=$('#deployments'); if(dep){const list=s.deployments;dep.innerHTML=list.length?list.map(x=>`<article class="card"><div class="row-between"><span class="status ${x.status==='Running'?'':'off'}">${escapeHtml(x.status||'Pending')}</span><span class="small">${escapeHtml(x.created||'')}</span></div><h3>${escapeHtml(x.bot||'Bot deployment')}</h3><p>Package: ${escapeHtml(x.package||'—')}</p><a class="btn ghost" href="bots.html">Manage</a></article>`).join(''):'<div class="empty"><div class="empty-icon">⌘</div><div class="eyebrow">DEPLOYMENTS</div><h3>No deployments yet</h3><p>Choose an available bot to start your first deployment.</p><a class="btn" href="bots.html">Browse bots</a></div>'}

  const payNum=$('#payNumber'); if(payNum)payNum.textContent=C.paymentNumber||'Payment provider not configured';
  const params=new URLSearchParams(location.search),botId=params.get('bot');const title=$('#botTitle');if(title&&botId){const bot=(C.bots||[]).find(b=>String(b.id)===botId);if(bot){title.textContent=bot.name;$('#botDesc').textContent=bot.description||'';const price=$('#botPrice');if(price)price.textContent=money(bot.price)}}
  const pf=$('#paymentForm');if(pf)pf.addEventListener('submit',e=>{e.preventDefault();toast('Connect the secure payment backend before accepting real payments.','warning')});
  const logout=()=>{localStorage.removeItem('bf_user');location.href='login.html'}; $$('#logout,[data-logout]').forEach(b=>b.addEventListener('click',logout));
  const notifyList=$('#notificationList');if(notifyList){const ns=s.notifications;if(!ns.length)notifyList.innerHTML='<div class="empty"><div class="empty-icon">✓</div><h3>You are all caught up</h3><p>No notifications yet.</p></div>';else notifyList.innerHTML=ns.map(x=>`<article class="card ${x.read?'':'unread'}"><div class="row-between"><strong>${escapeHtml(x.title||'Notification')}</strong><span class="small">${escapeHtml(x.at||'')}</span></div><p>${escapeHtml(x.message||'')}</p></article>`).join('');$('#markRead')?.addEventListener('click',()=>{const st=state();st.notifications=st.notifications.map(x=>({...x,read:true}));saveState(st);location.reload()})}
  const amount=$('#amount');$$('.amount-btn').forEach(b=>b.addEventListener('click',()=>{if(amount)amount.value=b.dataset.amount}));
  $('#payBtn')?.addEventListener('click',()=>{const n=Number(amount?.value);if(!Number.isFinite(n)||n<C.minDeposit||n>C.maxDeposit||n%50!==0)return toast(`Enter an amount from ${money(C.minDeposit)} to ${money(C.maxDeposit)} in KSh 50 steps.`,'warning');toast('Payment request prepared. Wallet credit must come from a verified server webhook.','warning')});
  const deployForm=$('#deployForm');if(deployForm)deployForm.addEventListener('submit',e=>{e.preventDefault();const u=user();if(!u)return location.href='login.html';const session=$('#session')?.value.trim();if(!session||session.length<8){toast('Enter a valid session ID or link.','warning');return}const pkg=$('#package')?.value||'50-20';write('bf_pending_deploy',{bot:botId||'bot',package:pkg,created:new Date().toISOString(),sessionMasked:session.slice(0,4)+'••••'+session.slice(-3)});location.href='payment.html'});
  const reward=$('#referralLink');if(reward){const base=location.href.split('/').slice(0,-1).join('/');reward.value=base+'/register.html?ref='+(user()?.email||'user').replace(/[^a-z0-9]/gi,'').slice(0,16);$('#copyReferral')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(reward.value);toast('Referral link copied.','success')}catch{reward.select();toast('Copy the selected link.')}})}
  function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
})();
