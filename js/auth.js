(function(){
  const $=s=>document.querySelector(s);
  const toast=m=>{let b=$('#toast');if(!b){b=document.createElement('div');b.id='toast';document.body.appendChild(b)}const x=document.createElement('div');x.className='toast warning';x.textContent=m;b.appendChild(x);setTimeout(()=>x.remove(),3500)};
  const theme=localStorage.getItem('bf_theme')||'light';document.documentElement.dataset.theme=theme;
  document.addEventListener('click',e=>{const t=e.target.closest('[data-theme]');if(!t)return;const n=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=n;localStorage.setItem('bf_theme',n);document.querySelectorAll('[data-theme]').forEach(b=>b.textContent=n==='dark'?'☀':'☾')});
  const validEmail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const passwordScore=v=>{let n=0;if(v.length>=8)n++;if(/[A-Z]/.test(v))n++;if(/[0-9]/.test(v))n++;if(/[^A-Za-z0-9]/.test(v))n++;return n};
  $('#password')?.addEventListener('input',e=>{const meter=$('#passwordStrength');if(meter)meter.textContent=['Too short','Weak','Fair','Strong','Very strong'][passwordScore(e.target.value)]});
  const register=$('#registerForm');
  if(register)register.addEventListener('submit',e=>{
    e.preventDefault();
    const name=$('#name').value.trim(),username=$('#username')?.value.trim()||'',email=$('#email').value.trim().toLowerCase(),phone=$('#phone')?.value.trim()||'',password=$('#password').value,confirm=$('#confirmPassword')?.value||password;
    if(name.length<2)return toast('Enter your full name.');
    if(!/^[A-Za-z0-9_.-]{3,30}$/.test(username))return toast('Username must be 3–30 letters, numbers, dots, dashes or underscores.');
    if(!validEmail(email))return toast('Enter a valid email address.');
    if(passwordScore(password)<3)return toast('Use 8+ characters with uppercase, number or symbol for a stronger password.');
    if(password!==confirm)return toast('Passwords do not match.');
    if(!$('#terms')?.checked)return toast('Accept the terms and privacy policy to continue.');
    const existing=(()=>{try{return JSON.parse(localStorage.getItem('bf_user')||'null')}catch{return null}})();
    if(existing?.email===email)return toast('A demo session for this email already exists. Login instead.');
    const u={id:'demo_'+Date.now(),name,username,email,phone,role:'user',status:'active',created:new Date().toISOString()};
    localStorage.setItem('bf_user',JSON.stringify(u));
    localStorage.setItem('bf_state',JSON.stringify({wallet:0,notifications:[{id:'n_'+Date.now(),title:'Welcome to BFBotForge Cyp',message:'Your account is ready. Explore bots, wallet and rewards.',at:new Date().toLocaleString(),read:false}],deployments:[],transactions:[],rewards:{points:0,referrals:0,earned:0}}));
    location.href='dashboard.html';
  });
  const login=$('#loginForm');
  if(login)login.addEventListener('submit',e=>{
    e.preventDefault();const email=$('#email').value.trim().toLowerCase();if(!validEmail(email))return toast('Enter a valid email address.');
    const stored=(()=>{try{return JSON.parse(localStorage.getItem('bf_user')||'null')}catch{return null}})();
    if(!stored||stored.email!==email)return toast('No demo session matches this email. Create an account first.');
    if(stored.status==='blocked')return toast('This account is blocked. Contact support.');
    if(stored.status==='suspended')return toast('This account is suspended. Contact support.');
    localStorage.setItem('bf_user',JSON.stringify(stored));location.href=stored.role==='admin'?'admin.html':'dashboard.html';
  });
  $('#githubBtn')?.addEventListener('click',()=>toast('OAuth needs a server-side provider before it can be enabled.'));
})();