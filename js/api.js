/* Production boundary: keep secrets and trust decisions on the server. */
window.BF_API={
  baseUrl:(window.BOTFORGE_CONFIG||{}).apiBase||'',
  request:async function(path,options={}){if(!this.baseUrl)throw new Error('Secure backend API is not configured.');const res=await fetch(this.baseUrl+path,{credentials:'include',headers:{'Content-Type':'application/json',...(options.headers||{})},...options});if(!res.ok)throw new Error('API request failed');return res.json()}
};
