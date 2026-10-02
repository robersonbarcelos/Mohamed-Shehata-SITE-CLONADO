import fs from 'node:fs'; import path from 'node:path';
const base='https://mohamedshehata.net/';
const list=fs.readFileSync('docs/research/raw/assets.txt','utf8').split('\n').filter(Boolean);
list.push('favicon.svg');
const q=[...new Set(list)];
async function get(p){const out=path.join('public',p);if(fs.existsSync(out))return;
 const r=await fetch(base+p.split('/').map(encodeURIComponent).join('/'));
 if(!r.ok){console.log('FAIL',r.status,p);return}
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,Buffer.from(await r.arrayBuffer()));console.log('ok',p)}
for(let i=0;i<q.length;i+=4)await Promise.all(q.slice(i,i+4).map(get));
