(function(){
  const $=s=>document.querySelector(s);
  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
  const write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const u=read('bf_user')||{};
  $('#pUsername').textContent=u.username||'—';$('#pEmail').textContent=u.email||'—';
  $('#pName').value=u.name||'';$('#pPhone').value=u.phone||'';
  $('#saveProfile')?.addEventListener('click',()=>{
    const name=$('#pName').value.trim(),phone=$('#pPhone').value.trim();
    if(name.length<2)return toast('Enter a valid name.','warning');
    const next={...u,name,phone};write('bf_user',next);
    window.BF?.addNotification('Profile updated','Your profile details were updated.','account');
    toast('Profile saved.','success');
  });
  $('#changePassword')?.addEventListener('click',()=>{
    const current=$('#currentPassword').value,newPass=$('#newPassword').value,confirm=$('#confirmNewPassword').value;
    if(!current||newPass.length<8||newPass!==confirm)return toast('Check the password fields. Use at least 8 characters and matching passwords.','warning');
    toast('Password change requires secure server-side authentication; no password was stored in the browser.','warning');
  });
  $('#deleteAccount')?.addEventListener('click',()=>{
    if(!confirm('Delete this demo account and its local data?'))return;
    localStorage.removeItem('bf_user');localStorage.removeItem('bf_state');localStorage.removeItem('bf_pending_deploy');location.href='index.html';
  });
  const toast=(m,t='info')=>{let b=$('#toast');if(!b){b=document.createElement('div');b.id='toast';document.body.appendChild(b)}const x=document.createElement('div');x.className='toast '+t;x.textContent=m;b.appendChild(x);setTimeout(()=>x.remove(),3500)};
})();