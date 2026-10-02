import fs from 'node:fs';
const L=fs.readFileSync('docs/research/raw/index.html','utf8').split('\n');
const sl=(a,b)=>L.slice(a-1,b).join('\n');
fs.mkdirSync('src/styles',{recursive:true});fs.mkdirSync('public/js',{recursive:true});
fs.writeFileSync('src/styles/site.css', sl(23,2081)+'\n'+sl(3962,3974)); // main css + glow cursor css
let body=sl(2085,2988)+'\n'+sl(3976,3976)+'\n<canvas id="glow-cursor" aria-hidden="true"></canvas>\n'+sl(4165,4166);
fs.writeFileSync('src/app/site-body.html', body.replace(/<script[\s\S]*?<\/script>/g,''));
fs.writeFileSync('public/js/main.js', sl(2990,3887));
fs.writeFileSync('public/js/grid.mjs', sl(3892,3957));
fs.writeFileSync('public/js/glow.js', sl(3978,4162));
