(function(){
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const KEY='bf_admin_users',AUD='bf_admin_audit';
  const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  let users=read(KEY,[]),audit=read(AUD,[]);
  if(!users.length){users=[
    {id:'u_demo1',name:'Jane Demo',email:'jane@example.com',status:'active',error:null,deployments:2,wallet:250},
    {id:'u_demo2',name:'John Demo',email:'john@example.com',status:'error',error:{code:'INVALID_EMAIL',message:'Email verification failed'},deployments:0,wallet:0},
    {id:'u_demo3',name:'Mary Demo',email:'mary@example.com',status:'blocked',error:null,deployments:1,wallet:100},
    {id:'u_demo4',name:'Alex Demo',email:'alex@example.com',status:'suspended',error:null,deployments:0,wallet:0}
  ];write(KEY,users)}
  const toast=(m,t='success')=>{let b=$('#toast');if(!b){b=document.createElement('div');b.id='toast';document.body.appendChild(b)}const x=document.createElement('div');x.className='toast '+t;x.textContent=m;b.appendChild(x);setTimeout(()=>x.remove(),3200)};
  const log=(action,ids,note='')=>{audit.unshift({id:'a_'+Date.now(),actor:'admin',action,targetIds:ids,at:new Date().toLocaleString(),note});write(AUD,audit)};
  const apply=(ids,action)=>{
    if(action==='delete')users=users.filter(u=>!ids.includes(u.id));
    else users=users.map(u=>ids.includes(u.id)?({...u,status:action==='fix'||action==='activate'?'active':action,error:action==='fix'||action==='activate'?null:u.error}):u);
    write(KEY,users);log(action,ids);render();refreshBulk();toast(action+' applied to '+ids.length+' account(s).');
  };
  const badge=s=>'<span class="status '+(s==='active'?'': 'off')+'">'+s+'</span>';
  const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  function render(){
    const q=($('#adminSearch')?.value||'').toLowerCase();
    const rows=users.filter(u=>(u.name+' '+u.email+' '+u.status).toLowerCase().includes(q));
    const body=$('#usersTable');
    if(body)body.innerHTML=rows.length?rows.map(u=>'<tr data-id="'+esc(u.id)+'"><td><input class="row-check" type="checkbox" data-id="'+esc(u.id)+'"></td><td><strong>'+esc(u.name)+'</strong></td><td>'+esc(u.email)+'</td><td>'+badge(u.status)+'</td><td>'+(u.error?'<code>'+esc(u.error.code)+'</code>':'—')+'</td><td><div class="hero-actions"><button class="btn ghost" data-act="activate">Activate</button><button class="btn ghost" data-act="suspend">Suspend</button><button class="btn ghost" data-act="block">Block</button><button class="btn ghost" data-act="fix">Fix</button><button class="btn danger" data-act="delete">Delete</button></div></td></tr>').join(''):'<tr><td colspan="6">No users found.</td></tr>';
    $('#kUsers').textContent=users.length;$('#kErrors').textContent=users.filter(u=>u.status==='error').length;$('#kBlocked').textContent=users.filter(u=>u.status==='blocked'||u.status==='suspended').length;$('#kDeploys').textContent=users.reduce((n,u)=>n+(u.deployments||0),0);
    const errors=$('#errorList');if(errors)errors.innerHTML=users.filter(u=>u.status==='error').map(u=>'<article class="card"><span class="status off">'+esc(u.error?.code||'ERROR')+'</span><h3>'+esc(u.name)+'</h3><p>'+esc(u.email)+'</p><p>'+esc(u.error?.message||'Account requires attention.')+'</p><button class="btn" data-fix-one="'+esc(u.id)+'">Fix account</button></article>').join('')||'<div class="empty"><h3>No account errors 🎉</h3><p>Everything currently looks clear.</p></div>';
    const auditBox=$('#auditList');if(auditBox)auditBox.innerHTML=audit.length?audit.map(a=>'<article class="card"><strong>'+esc(a.action)+'</strong><p>'+a.targetIds.length+' account(s) · '+esc(a.at)+'</p><span class="small">'+esc(a.note||'Administrative action recorded.')+'</span></article>').join(''):'<div class="empty"><h3>No actions recorded</h3><p>Admin actions will appear here.</p></div>';
  }
  function refreshBulk(){const ids=$$('.row-check:checked').map(c=>c.dataset.id);if($('#selCount'))$('#selCount').textContent=ids.length;if($('#bulkBar'))$('#bulkBar').classList.toggle('hidden',!ids.length)}
  $('#adminSearch')?.addEventListener('input',render);
  $('#usersTable')?.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const row=b.closest('tr');if(row)apply([row.dataset.id],b.dataset.act)});
  $('#errorList')?.addEventListener('click',e=>{const b=e.target.closest('[data-fix-one]');if(b)apply([b.dataset.fixOne],'fix')});
  $('#fixAllErrors')?.addEventListener('click',()=>{const ids=users.filter(u=>u.status==='error').map(u=>u.id);if(ids.length)apply(ids,'fix');else toast('No account errors.','warning')});
  $('#checkAll')?.addEventListener('change',e=>{$$('.row-check').forEach(c=>c.checked=e.target.checked);refreshBulk()});
  $('#usersTable')?.addEventListener('change',e=>{if(e.target.classList.contains('row-check'))refreshBulk()});
  $('#bulkBar')?.addEventListener('click',e=>{const b=e.target.closest('[data-bulk]');if(!b)return;const ids=$$('.row-check:checked').map(c=>c.dataset.id);if(!ids.length)return;if(b.dataset.bulk==='delete'&&!confirm('Delete '+ids.length+' account(s)?'))return;apply(ids,b.dataset.bulk)});
  $$('[data-tab]').forEach(b=>b.addEventListener('click',()=>{$$('[data-tab]').forEach(x=>x.classList.remove('active'));b.classList.add('active');$$('.admin-panel').forEach(x=>x.classList.add('hidden'));$('#admin'+b.dataset.tab.charAt(0).toUpperCase()+b.dataset.tab.slice(1))?.classList.remove('hidden')}));
  $('#broadcastBtn')?.addEventListener('click',()=>{const m=$('#broadcastMessage').value.trim();if(!m)return toast('Write a message first.','warning');const s=window.BF?.state?BF.state():{notifications:[]};s.notifications=s.notifications||[];s.notifications.unshift({id:'n_'+Date.now(),title:'Admin announcement',message:m,at:new Date().toLocaleString(),read:false});window.BF?.saveState(s);log('broadcast',users.map(u=>u.id),m);$('#broadcastMessage').value='';toast('Broadcast recorded in the demo notification feed.')});
  const csvDownload=(name,rows)=>{const csv=rows.map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n');const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download=name;a.click()};
  $('#exportUsers')?.addEventListener('click',()=>csvDownload('bfboforge-users.csv',[['id','name','email','status','deployments','wallet'],...users.map(u=>[u.id,u.name,u.email,u.status,u.deployments||0,u.wallet||0])]));
  $('#exportAudit')?.addEventListener('click',()=>csvDownload('bfboforge-audit.csv',[['when','actor','action','targets','note'],...audit.map(a=>[a.at,a.actor,a.action,a.targetIds.length,a.note||''])]));
  $$('[data-logout]').forEach(b=>b.addEventListener('click',()=>{localStorage.removeItem('bf_user');location.href='login.html'}));
  render();
})();