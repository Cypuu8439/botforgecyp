(function(){
  const C=window.BOTFORGE_CONFIG||{};
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const toast=(msg,type='info')=>{let box=$('#toast');if(!box){box=document.createElement('div');box.id='toast';document.body.appendChild(box)}const el=document.createElement('div');el.className='toast '+type;el.setAttribute('role','status');el.textContent=msg;box.appendChild(el);setTimeout(()=>el.remove(),3600)};
  const user=()=>read('bf_user',null);
  const money=n=>`${C.currency||'KES'} ${Number(n||0).toLocaleString('en-KE',{minimumFractionDigits:2})}`;
  const defaultState=()=>({wallet:0,notifications:[],deployments:[],transactions:[],rewards:{points:0,referrals:0,earned:0}});
  const state=()=>({...defaultState(),...read('bf_state',{})});
  const saveState=s=>write('bf_state',s);
  const addNotification=(title,message,type='info')=>{const s=state();s.notifications.unshift({id:'n_'+Date.now(),title,message,type,at:new Date().toLocaleString(),read:false});s.notifications=s.notifications.slice(0,50);saveState(s)};
  window.BF={toast,user,money,read,write,state,saveState,addNotification};

  const theme=localStorage.getItem('bf_theme')||'light';
  document.documentElement.dataset.theme=theme;
  document.addEventListener('click',e=>{
    const t=e.target.closest('[data-theme]');
    if(t){const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;localStorage.setItem('bf_theme',next);$$('[data-theme]').forEach(b=>b.textContent=next==='dark'?'☀':'☾')}
    const menu=e.target.closest('[data-menu]');
    if(menu){document.body.classList.toggle('nav-open');menu.setAttribute('aria-expanded',document.body.classList.contains('nav-open'))}
    if(e.target.closest('[data-close-nav]')||e.target.closest('.nav-backdrop'))document.body.classList.remove('nav-open');
  });
  $$('[data-theme]').forEach(b=>b.textContent=theme==='dark'?'☀':'☾');

  const path=location.pathname.split('/').pop()||'index.html';
  $$('.side-link[href]').forEach(a=>{if(a.getAttribute('href')===path)a.classList.add('active')});

  const grid=$('#botGrid');
  if(grid){
    const bots=Array.isArray(C.bots)?C.bots:[];
    grid.innerHTML=bots.length?bots.map(b=>`<article class="card bot-card"><span class="status">Available</span><h3>${escapeHtml(b.name)}</h3><p>${escapeHtml(b.description)}</p><div class="card-meta"><strong>${money(b.price)}</strong><span>${escapeHtml(b.category)}</span></div><a class="btn" href="deploy.html?bot=${encodeURIComponent(b.id)}">View details</a></article>`).join(''):'<div class="empty"><div class="empty-icon">{ }</div><div class="eyebrow">BOT MARKETPLACE</div><h3>No bots available yet</h3><p>New hosting options are being prepared.</p></div>';
    $('#botSearch')?.addEventListener('input',e=>{const q=e.target.value.toLowerCase();$$('.bot-card').forEach(c=>c.hidden=!c.textContent.toLowerCase().includes(q))});
  }

  const u=user();
  const n=$('#userName');if(n)n.textContent=u?.name||u?.email?.split('@')[0]||'there';
  const date=$('#currentDate');if(date)date.textContent=new Intl.DateTimeFormat('en-US',{dateStyle:'full'}).format(new Date());
  const time=$('#currentTime');if(time){const tick=()=>time.textContent=new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit'}).format(new Date());tick();setInterval(tick,30000)}

  const s=state();
  const bal=$('#walletBalance');if(bal)bal.textContent=money(s.wallet);
  const depCount=$('#activeBots');if(depCount)depCount.textContent=s.deployments.filter(x=>['Running','Deploying'].includes(x.status)).length;
  const notifCount=$('#notificationCount');if(notifCount)notifCount.textContent=s.notifications.filter(x=>!x.read).length;
  const rewardPoints=$('#rewardPoints');if(rewardPoints)rewardPoints.textContent=String(s.rewards.points||0);

  const dep=$('#deployments');
  if(dep){
    dep.innerHTML=s.deployments.length?s.deployments.map(x=>`<article class="card"><div class="row-between"><span class="status ${x.status==='Running'?'':'off'}">${escapeHtml(x.status||'Pending')}</span><span class="small">${escapeHtml(x.created||'')}</span></div><h3>${escapeHtml(x.bot||'Bot deployment')}</h3><p>Package: ${escapeHtml(x.package||'—')}</p><p>Session: <code>${escapeHtml(x.sessionMasked||'protected')}</code></p><div class="hero-actions"><button class="btn ghost" data-deploy-action="stop" data-id="${x.id}">Stop</button><button class="btn ghost" data-deploy-action="restart" data-id="${x.id}">Restart</button><button class="btn danger" data-deploy-action="delete" data-id="${x.id}">Delete</button></div></article>`).join(''):'<div class="empty"><div class="empty-icon">⌘</div><div class="eyebrow">DEPLOYMENTS</div><h3>No deployments yet</h3><p>Choose an available bot to start your first deployment.</p><a class="btn" href="bots.html">Browse bots</a></div>';
  }

  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-deploy-action]');if(!b)return;
    const s=state(),x=s.deployments.find(d=>d.id===b.dataset.id);if(!x)return;
    if(b.dataset.deployAction==='delete')s.deployments=s.deployments.filter(d=>d.id!==x.id);
    if(b.dataset.deployAction==='stop')x.status='Stopped';
    if(b.dataset.deployAction==='restart')x.status='Running';
    saveState(s);addNotification('Deployment updated',`${x.bot} is now ${b.dataset.deployAction==='delete'?'deleted':x.status}.`);location.reload();
  });

  const payNum=$('#payNumber');if(payNum)payNum.textContent=C.paymentNumber||'Payment provider not configured';
  const params=new URLSearchParams(location.search),botId=params.get('bot');
  const title=$('#botTitle');
  if(title&&botId){const bot=(C.bots||[]).find(b=>String(b.id)===botId);if(bot){title.textContent=bot.name;$('#botDesc').textContent=bot.description||'';const price=$('#botPrice');if(price)price.textContent=money(bot.price)}}

  const amount=$('#amount');
  $$('.amount-btn').forEach(b=>b.addEventListener('click',()=>{if(amount)amount.value=b.dataset.amount}));
  $('#payBtn')?.addEventListener('click',()=>{
    const n=Number(amount?.value);
    if(!Number.isFinite(n)||n<C.minDeposit||n>C.maxDeposit||n%50!==0)return toast(`Enter an amount from ${money(C.minDeposit)} to ${money(C.maxDeposit)} in KSh 50 steps.`,'warning');
    const s=state();
    if($('#demoDeposit')?.checked){
      s.wallet+=n;s.transactions.unshift({id:'tx_'+Date.now(),type:'deposit',amount:n,status:'demo-confirmed',at:new Date().toLocaleString()});
      saveState(s);addNotification('Demo deposit credited',`${money(n)} was added to your wallet for testing.`,'payment');toast('Demo deposit credited to wallet.','success');setTimeout(()=>location.reload(),500);
    }else toast('A real deposit requires a verified server-side payment provider/webhook.','warning');
  });

  const pending=read('bf_pending_deploy',null);
  const pendingBox=$('#pendingDeploy');
  if(pendingBox&&pending){pendingBox.classList.remove('hidden');pendingBox.innerHTML=`<strong>${escapeHtml(pending.botName||pending.bot)}</strong><p>Package: ${escapeHtml(pending.package)}</p><p>Price: ${money(pending.price||0)}</p>`;
  $('#confirmDemoDeploy')?.addEventListener('click',()=>{
    const p=read('bf_pending_deploy',null);if(!p)return toast('No pending deployment.','warning');
    const s=state(),cost=Number(p.price||0);
    if(s.wallet<cost)return toast(`Insufficient wallet balance. Add ${money(cost-s.wallet)} first.`,'warning');
    s.wallet-=cost;
    const d={id:'dep_'+Date.now(),bot:p.botName||p.bot||'Bot',package:p.package,status:'Running',created:new Date().toLocaleString(),sessionMasked:p.sessionMasked};
    s.deployments.unshift(d);s.transactions.unshift({id:'tx_'+Date.now(),type:'deployment',amount:-cost,status:'demo-confirmed',at:new Date().toLocaleString(),deploymentId:d.id});
    saveState(s);localStorage.removeItem('bf_pending_deploy');addNotification('Deployment started',`${d.bot} is now running.`,'deploy');toast('Demo deployment started.','success');setTimeout(()=>location.href='dashboard.html',600);
  });

  const deployForm=$('#deployForm');
  if(deployForm)deployForm.addEventListener('submit',e=>{
    e.preventDefault();if(!user())return location.href='login.html';
    const session=$('#session')?.value.trim(),pkg=$('#package')?.value||'50-20';
    if(!/^[A-Za-z0-9:_./?=&+\\-]{8,512}$/.test(session))return toast('Session ID/link must be 8–512 valid characters.','warning');
    const bot=(C.bots||[]).find(b=>String(b.id)===botId),price=Number(bot?.price||String(pkg).split('-')[0]||0);
    localStorage.setItem('bf_pending_deploy',JSON.stringify({bot:botId||'bot',botName:bot?.name||'Bot',package:pkg,price,created:new Date().toISOString(),sessionMasked:session.slice(0,4)+'••••'+session.slice(-3)}));
    location.href='payment.html?deploy=1';
  });

  const notifyList=$('#notificationList');
  if(notifyList){
    const ns=s.notifications;
    notifyList.innerHTML=ns.length?ns.map(x=>`<article class="card ${x.read?'':'unread'}"><div class="row-between"><strong>${escapeHtml(x.title||'Notification')}</strong><span class="small">${escapeHtml(x.at||'')}</span></div><p>${escapeHtml(x.message||'')}</p><button class="btn ghost" data-read-notification="${x.id}" ${x.read?'disabled':''}>${x.read?'Read':'Mark as read'}</button></article>`).join(''):'<div class="empty"><div class="empty-icon">✓</div><h3>You are all caught up</h3><p>No notifications yet.</p></div>';
    $('#markRead')?.addEventListener('click',()=>{const st=state();st.notifications=st.notifications.map(x=>({...x,read:true}));saveState(st);location.reload()});
    notifyList.addEventListener('click',e=>{const b=e.target.closest('[data-read-notification]');if(!b)return;const st=state(),n=st.notifications.find(x=>x.id===b.dataset.readNotification);if(n)n.read=true;saveState(st);location.reload()});
  }

  const rewardBox=$('#rewardBox');
  if(rewardBox){
    const r=s.rewards||{points:0,referrals:0,earned:0};
    rewardBox.innerHTML=`<div class="stats-grid"><div class="stat"><span class="eyebrow">POINTS</span><strong>${r.points||0}</strong></div><div class="stat"><span class="eyebrow">REFERRALS</span><strong>${r.referrals||0}</strong></div><div class="stat"><span class="eyebrow">EARNED</span><strong>${money(r.earned||0)}</strong></div></div>`;
  }
  $('#redeemForm')?.addEventListener('submit',e=>{e.preventDefault();const code=$('#redeemCode').value.trim().toUpperCase();const rewards={WELCOME50:50,START10:10,BF100:100};if(!rewards[code])return toast('Invalid or expired demo reward code.','warning');const st=state();st.wallet+=rewards[code];st.rewards={...st.rewards,points:(st.rewards.points||0)+rewards[code],earned:(st.rewards.earned||0)+rewards[code]};st.transactions.unshift({id:'tx_'+Date.now(),type:'reward',amount:rewards[code],status:'demo-redeemed',code,at:new Date().toLocaleString()});saveState(st);addNotification('Reward redeemed',`${money(rewards[code])} demo credit added.`,'reward');toast('Reward redeemed successfully.','success');e.target.reset();setTimeout(()=>location.reload(),400)});

  const reward=$('#referralLink');
  if(reward){const base=location.href.split('/').slice(0,-1).join('/');reward.value=base+'/register.html?ref='+(user()?.email||'user').replace(/[^a-z0-9]/gi,'').slice(0,16);$('#copyReferral')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(reward.value);toast('Referral link copied.','success')}catch{reward.select();document.execCommand('copy');toast('Referral link copied.','success')}})}

  $('#recoveryForm')?.addEventListener('submit',e=>{e.preventDefault();const code=$('#recoveryCode')?.value.trim();if(code!=='RECOVER-DEMO')return toast('Use the demo recovery code RECOVER-DEMO for this frontend test.','warning');addNotification('Recovery completed','Your demo recovery request was completed.','recovery');toast('Demo recovery completed.','success')});
  function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
})();