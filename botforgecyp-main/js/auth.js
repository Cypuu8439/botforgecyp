(function(){
  const $=s=>document.querySelector(s), toast=m=>{const b=$('#toast');if(!b)return;const x=document.createElement('div');x.className='toast';x.textContent=m;b.appendChild(x);setTimeout(()=>x.remove(),3500)};
  if(localStorage.getItem('bf_theme')==='dark')document.body.classList.add('dark');
  document.addEventListener('click',e=>{if(e.target.closest('[data-theme]')){document.body.classList.toggle('dark');localStorage.setItem('bf_theme',document.body.classList.contains('dark')?'dark':'light')}});
  const register=$('#registerForm');if(register)register.addEventListener('submit',e=>{e.preventDefault();const name=$('#name').value.trim(),email=$('#email').value.trim(),password=$('#password').value;if(password.length<6)return toast('Password must be at least 6 characters.');localStorage.setItem('bf_user',JSON.stringify({name,email}));localStorage.setItem('bf_demo_password',password);location.href='dashboard.html'});
  const login=$('#loginForm');if(login)login.addEventListener('submit',e=>{e.preventDefault();const email=$('#email').value.trim(),password=$('#password').value,stored=JSON.parse(localStorage.getItem('bf_user')||'null');if(!stored||stored.email!==email||localStorage.getItem('bf_demo_password')!==password)return toast('Login details not found. Create an account first.');location.href='dashboard.html'});
  const gh=$('#githubBtn');if(gh)gh.addEventListener('click',()=>toast('GitHub OAuth needs a secure backend configuration before it can be enabled.'));
})();
