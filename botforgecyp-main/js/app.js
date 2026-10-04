(function(){
  const C=window.BOTFORGE_CONFIG||{};
  const $=s=>document.querySelector(s);
  const toast=(msg)=>{let box=$('#toast');if(!box)return;let el=document.createElement('div');el.className='toast';el.textContent=msg;box.appendChild(el);setTimeout(()=>el.remove(),3500)};
  const user=()=>{try{return JSON.parse(localStorage.getItem('bf_user')||'null')}catch{return null}};
  const money=n=>`${C.currency||'KES'} ${Number(n||0).toLocaleString('en-KE',{minimumFractionDigits:2})}`;
  window.BF={toast,user,money};
  document.addEventListener('click',e=>{const t=e.target.closest('[data-theme]');if(t){document.body.classList.toggle('dark');localStorage.setItem('bf_theme',document.body.classList.contains('dark')?'dark':'light');}});
  if(localStorage.getItem('bf_theme')==='dark')document.body.classList.add('dark');
  const grid=$('#botGrid');
  if(grid){const bots=Array.isArray(C.bots)?C.bots:[];if(!bots.length){grid.innerHTML='<div class="empty"><div class="eyebrow">BOT MARKETPLACE</div><h3>No bots available yet</h3><p>We are preparing new bot hosting options for BFBotForge Cyp. Check back soon.</p></div>';}else{grid.innerHTML=bots.map(b=>`<article class="card"><span class="status">Available</span><h3>${b.name||'Bot'}</h3><p>${b.description||'Bot hosting option.'}</p><strong>${money(b.price||0)}</strong><br><br><a class="btn" href="deploy.html?bot=${encodeURIComponent(b.id||b.name||'bot')}">View bot</a></article>`).join('')}}
  const n=$('#userName');if(n){const u=user();n.textContent=u?.name||u?.email||''}
  const logout=$('#logout');if(logout)logout.addEventListener('click',()=>{localStorage.removeItem('bf_user');location.href='login.html'});
  const dep=$('#deployments');if(dep){const list=JSON.parse(localStorage.getItem('bf_deployments')||'[]');dep.innerHTML=list.length?list.map(x=>`<article class="card"><span class="status">${x.status||'Running'}</span><h3>${x.bot||'Bot deployment'}</h3><p>Package: ${x.package||'—'}</p><small class="muted">${x.created||''}</small></article>`).join(''):'<div class="empty"><div class="eyebrow">DEPLOYMENTS</div><h3>No deployments yet</h3><p>Choose a bot to start your first deployment.</p><a class="btn" href="bots.html">Browse bots</a></div>'}
  const payNum=$('#payNumber');if(payNum)payNum.textContent=C.paymentNumber||'Payment number will appear here';
  const params=new URLSearchParams(location.search), botId=params.get('bot');const title=$('#botTitle');if(title&&botId){const bot=(C.bots||[]).find(b=>String(b.id)===botId);if(bot){title.textContent=bot.name;$('#botDesc').textContent=bot.description||''}}
  const pf=$('#paymentForm');if(pf)pf.addEventListener('submit',e=>{e.preventDefault();toast('Payment submitted for verification. Connect a secure payment backend before accepting real payments.');});
})();
