(function(){
  const $=s=>document.querySelector(s);
  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch{return null}};
  const u=read('bf_user')||{};

  const username=$('#pUsername');
  const email=$('#pEmail');
  const name=$('#pName');
  const phone=$('#pPhone');
  const save=$('#saveProfile');

  if(username) username.textContent=u.username||'—';
  if(email) email.textContent=u.email||'—';
  if(name) name.value=u.name||'';
  if(phone) phone.value=u.phone||'';

  if(save){
    save.addEventListener('click',()=>{
      const next={...u,name:name?.value.trim()||'',phone:phone?.value.trim()||''};
      localStorage.setItem('bf_user',JSON.stringify(next));

      const t=document.createElement('div');
      t.className='toast success';
      t.textContent='Profile saved locally. Connect the backend for persistent production storage.';

      let box=$('#toast');
      if(!box){
        box=document.createElement('div');
        box.id='toast';
        document.body.appendChild(box);
      }

      box.appendChild(t);
      setTimeout(()=>t.remove(),3500);
    });
  }
})();