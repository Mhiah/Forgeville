/* Forgeville — self-contained game economy. All currencies, shoppers and designs are
 * simulated. No blockchain connection, minting or token launch is performed. */
'use strict';

const TEMPLATES = [
  { id: 'jacket', name: 'Jacket', title: 'The Everyday Jacket', symbol: '🧥', base: 18 },
  { id: 'tote', name: 'Tote bag', title: 'The Town Tote', symbol: '👜', base: 7 },
  { id: 'sneakers', name: 'Sneakers', title: 'The Everyday Runner', symbol: '👟', base: 14 },
  { id: 'cap', name: 'Cap', title: 'The Sunday Cap', symbol: '🧢', base: 9 },
];
const MATERIALS = [
  { id: 'canvas', name: 'Canvas', cost: 5, quality: .57, weather: .35, eco: .57, subtitle: 'Simple & durable' },
  { id: 'recycled', name: 'Recycled', cost: 8, quality: .72, weather: .33, eco: 1, subtitle: 'A lighter footprint' },
  { id: 'waterproof', name: 'Waterproof', cost: 11, quality: .81, weather: 1, eco: .3, subtitle: 'Ready for any forecast' },
  { id: 'premium', name: 'Premium', cost: 16, quality: 1, weather: .6, eco: .45, subtitle: 'Made to impress' },
];
const COLORS = [
  { id: 'moss', name: 'Forest moss', hex: '#467d60' },
  { id: 'cobalt', name: 'Storm blue', hex: '#597fae' },
  { id: 'coral', name: 'Market coral', hex: '#e57d68' },
  { id: 'amber', name: 'Honey amber', hex: '#dca448' },
  { id: 'lilac', name: 'Dusk lilac', hex: '#ab92bf' },
  { id: 'cream', name: 'Warm cream', hex: '#ebe1c4' },
];
const TRENDS = [
  { title: 'Rainy-day rush', description: 'Storm clouds rolled into Forgeville. Everyone wants practical pieces that still brighten a grey afternoon.', emoji: '☔', color: '#d8e4d9', products: ['jacket','tote'], materials: ['waterproof'], colors: ['cobalt','moss'], tags: ['Weatherproof', 'Bold blues', 'Everyday carry'], tip: 'A waterproof piece in a rainy-day shade has an edge.', rivals: [{shop:'Wren & Co.',avatar:'🪶',template:'jacket',material:'waterproof',color:'cobalt',price:75},{shop:'Pip Studio',avatar:'🌼',template:'tote',material:'canvas',color:'coral',price:35}]},
  { title: 'The street fair', description: 'The town square is packed for the summer fair. Cheerful pieces and easygoing outfits are selling fast.', emoji: '🎡', color: '#f5dfb6', products: ['cap','sneakers'], materials: ['canvas','recycled'], colors: ['coral','amber'], tags: ['Bright colours','Casual wear','Good value'], tip: 'Keep prices friendly. Fair-goers love an easy buy.', rivals: [{shop:'Wren & Co.',avatar:'🪶',template:'cap',material:'canvas',color:'amber',price:29},{shop:'Pip Studio',avatar:'🌼',template:'sneakers',material:'premium',color:'coral',price:83}]},
  { title: 'Slow Sunday', description: 'A gentler mood has taken over town. Shoppers are seeking thoughtful, durable things they will keep for years.', emoji: '🌿', color: '#dfe8cd', products: ['tote','jacket'], materials: ['recycled','premium'], colors: ['moss','cream'], tags: ['Natural tones','Recycled','Made to last'], tip: 'Quality and sustainability matter more than being loud.', rivals: [{shop:'Wren & Co.',avatar:'🪶',template:'tote',material:'recycled',color:'moss',price:43},{shop:'Pip Studio',avatar:'🌼',template:'jacket',material:'premium',color:'cream',price:91}]},
  { title: 'After-dark market', description: 'A night market is drawing the town out after sunset. Distinctive details and standout looks are everywhere.', emoji: '🌙', color: '#ded5e8', products: ['sneakers','cap'], materials: ['premium','waterproof'], colors: ['lilac','cobalt'], tags: ['Statement pieces','Premium','Night colours'], tip: 'Trend chasers are especially interested in bold night looks.', rivals: [{shop:'Wren & Co.',avatar:'🪶',template:'sneakers',material:'premium',color:'lilac',price:99},{shop:'Pip Studio',avatar:'🌼',template:'cap',material:'waterproof',color:'cobalt',price:49}]},
  { title: "Founder's festival", description: 'The annual Forgeville festival has arrived. Shoppers are splashing out on keepsakes and special-edition favourites.', emoji: '🎉', color: '#f3dfce', products: ['jacket','tote','sneakers'], materials: ['premium','recycled'], colors: ['amber','coral'], tags: ['Festival energy','Craft quality','Bold pieces'], tip: 'This is your last market. Make your best call.', rivals: [{shop:'Wren & Co.',avatar:'🪶',template:'jacket',material:'premium',color:'amber',price:105},{shop:'Pip Studio',avatar:'🌼',template:'tote',material:'recycled',color:'coral',price:49}]},
];
const NAMES = ['Mina','Theo','Ari','Suki','Bea','Noah','Lila','Rafi','Zoe','Jules','Ella','Nico','Remy','Oli','Ivy','Pia','Leo','Dara','Uma','Finn','Macy','Kai','Mara','Sol'];
// The town's 24 regulars: each has a fixed shopper type, look and budget lean, so they can remember you.
const TOWNSFOLK=NAMES.map((name,i)=>({id:i,name,type:['bargain','trend','luxury'][i%3],skin:['#e8b18a','#b47d5f','#e5c3a7','#d9b39b','#ac805d','#8a5a3c','#c98e6b'][(i*5)%7],lean:((i*13)%9)-4}));
const FOLK_BY_TYPE={bargain:TOWNSFOLK.filter(p=>p.type==='bargain'),trend:TOWNSFOLK.filter(p=>p.type==='trend'),luxury:TOWNSFOLK.filter(p=>p.type==='luxury')};
const COPY_ROYALTY=.07;
const PERSONAS = {
  bargain: { label: 'Bargain hunter', color: '#f5e3c6', emblem: '◈' },
  trend: { label: 'Trend chaser', color: '#f4dcce', emblem: '✳' },
  luxury: { label: 'Luxury lover', color: '#dfebf3', emblem: '✧' },
};
const $ = id => document.getElementById(id);
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const coins = n => Number(n).toFixed(0);
const money = n => Number(n).toFixed(1).replace(/\.0$/, '');
const template = id => TEMPLATES.find(x=>x.id===id);
const material = id => MATERIALS.find(x=>x.id===id);
const color = id => COLORS.find(x=>x.id===id);
const htmlEscape = str => String(str).replace(/[&<>"']/g, x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));

let run = null;
function initialState(){return { round:0, cash:540, initialCash:540, treasury:0, history:[], stock:[], design:{template:'jacket',material:'waterproof',color:'cobalt',price:60,qty:8,remix:null}, mode:'design', feed:[], visits:0, salesReport:null, totalSold:0, finished:false, reputation:0, playerRevenue:0, rivalTotals:[{units:0,revenue:0},{units:0,revenue:0}], memory:{}, rivalCopies:{}, upgrades:{}, rivalTactics:{}, token:newToken() };}
function getUnitCost(d=run.design){return template(d.template).base+matCost(material(d.material));}
function totalCost(d=run.design){return getUnitCost(d)*d.qty;}
function trendFit(d=run.design){const t=TRENDS[run.round];return (t.products.includes(d.template)?.4:0)+(t.materials.includes(d.material)?.34:0)+(t.colors.includes(d.color)?.26:0);}
function quality(d=run.design){return material(d.material).quality;}
function saturation(d=run.design){return currentRivals().reduce((sum,r)=>sum+(r.template===d.template?.13:0)+(r.template===d.template && r.color===d.color?.07:0),0);}
// Crowding a rival's stall feels: the other rival plus your current design.
function rivalSaturation(i,player=run.design){const t=TRENDS[run.round];const r=currentRivals()[i];const others=[currentRivals()[1-i],player];return others.reduce((sum,o)=>sum+(o.template===r.template?.13:0)+(o.template===r.template&&o.color===r.color?.07:0),0);}
function hashSeed(str){let h=2166136261;for(const ch of str){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0;}
function randomGenerator(seed){let a=seed;return ()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
function getBuyer(type,i,rng,person){const base=type==='bargain'?42:type==='trend'?75:112;const variance=type==='bargain'?20:type==='trend'?24:28;person=person||FOLK_BY_TYPE[type][i%FOLK_BY_TYPE[type].length];return {name:person.name,type,wallet:Math.round(base+person.lean+(rng()-.5)*variance),avatar:person.skin};}
function scorePurchase(d,buyer,sat=saturation(d)){const fit=trendFit(d);const q=quality(d);const p=d.price;let chance=0;if(p>buyer.wallet)return {probability:0,reason:'That costs more than I brought.',code:'price'};
 if(buyer.type==='bargain') chance=.49 + (50-p)*.012 + q*.09 +fit*.10-sat;
 else if(buyer.type==='trend') chance=.22+fit*.63+(70-p)*.004 -sat*1.15;
 else chance=.22+q*.52+fit*.14+(p>=55?.05:0)-sat*.7-(p>105?.17:0);
 chance=clamp(chance,.035,.94);
 let yesReason='';let noReason='';let code='unsure';
 if(buyer.type==='bargain'){yesReason='Great price for something useful!';noReason=p>=55?'A little steep for me.':'I will keep looking.';if(p>=55)code='price';}
 if(buyer.type==='trend'){yesReason=fit>=.6?'Exactly the look I wanted!':'I like this one!';noReason=fit<.5?'Not this week’s look.':'Not quite convinced.';if(fit<.5)code='trend';}
 if(buyer.type==='luxury'){yesReason=q>=.75?'Love the quality. I’ll take it.':'This has character!';noReason=q<.72?'I wanted a finer finish.':'I’ll think about it.';if(q<.72)code='quality';}
 return {probability:chance,yesReason,noReason,code};
}
function makeProductSvg(d=run.design,opts={}){const shot=typeof lux3dShot==='function'&&lux3dShot(d);if(shot)return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 320" role="img" aria-label="${htmlEscape(color(d.color).name)} ${htmlEscape(material(d.material).name)} ${htmlEscape(template(d.template).name)}, Aholo Lux3D model"><ellipse cx="260" cy="290" rx="120" ry="14" fill="#527459" opacity=".14"/><image href="${shot}" x="100" y="0" width="320" height="320" preserveAspectRatio="xMidYMid meet"/></svg>`;const hex=color(d.color).hex;const dark=mixColor(hex,'#304536',.24);const shine=mixColor(hex,'#ffffff',.22);let body='';
 if(d.template==='jacket')body=`<ellipse cx="260" cy="284" rx="112" ry="16" fill="#527459" opacity=".16"/><path d="M192 72L154 97 108 218 156 236 182 167 180 276 341 276 339 167 366 236 414 218 366 97 327 72 300 86 260 100 218 84Z" fill="${hex}" stroke="${dark}" stroke-width="5" stroke-linejoin="round"/><path d="M192 72Q214 58 260 100Q304 59 327 72L304 126 260 99 214 126Z" fill="${shine}" stroke="${dark}" stroke-width="3"/><path d="M260 100V274" stroke="${dark}" stroke-width="5" stroke-dasharray="6 4"/><path d="M188 192H226V225H188ZM296 192H334V225H296Z" fill="none" stroke="${dark}" stroke-width="4"/><path d="M178 270H342M118 217L155 230M369 231L405 218" stroke="${dark}" stroke-width="7"/><path d="M205 75L221 88M313 75L298 88" stroke="#fff" stroke-width="3" opacity=".65"/>`;
 if(d.template==='tote')body=`<ellipse cx="260" cy="287" rx="114" ry="15" fill="#527459" opacity=".16"/><path d="M164 114Q165 105 177 105H343Q354 105 356 118L366 263Q366 279 348 279H173Q156 278 157 262Z" fill="${hex}" stroke="${dark}" stroke-width="5"/><path d="M206 112V81Q207 40 260 40Q313 40 313 81V112" fill="none" stroke="${dark}" stroke-width="13"/><path d="M207 112V81Q210 51 260 51Q309 51 312 81V112" fill="none" stroke="${shine}" stroke-width="7"/><path d="M180 136H338M180 261H343" stroke="${dark}" opacity=".45" stroke-width="3"/><path d="M226 171h68v53h-68z" fill="${shine}" opacity=".67" rx="8"/><circle cx="260" cy="195" r="14" fill="none" stroke="${dark}" stroke-width="3"/><path d="M249 196l9 9 17-20" stroke="${dark}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
 if(d.template==='sneakers')body=`<ellipse cx="262" cy="279" rx="151" ry="14" fill="#527459" opacity=".14"/><path d="M112 175Q140 165 165 180L206 219 268 231 294 263Q289 276 261 278H103Q74 268 88 242L100 197Z" fill="${shine}" stroke="${dark}" stroke-width="5"/><path d="M251 136Q270 135 300 154L328 190Q349 213 393 229Q433 244 439 263Q438 275 414 275H240Q213 263 227 237L244 160Z" fill="${hex}" stroke="${dark}" stroke-width="5"/><path d="M88 254Q162 271 292 259L293 268Q288 277 260 278H107Q76 274 88 254M229 256Q331 273 439 255L439 266Q434 276 411 276H239Q223 275 229 256" fill="#f9f3de" stroke="${dark}" stroke-width="3"/><path d="M267 162L306 172M259 178L320 187M253 193L333 206M117 197L154 206M109 210L168 223" stroke="#f7efdc" stroke-width="7" stroke-linecap="round"/><path d="M355 235Q385 219 416 244" fill="none" stroke="${dark}" stroke-width="5" opacity=".5"/>`;
 if(d.template==='cap')body=`<ellipse cx="260" cy="281" rx="123" ry="14" fill="#527459" opacity=".15"/><path d="M144 227Q142 112 213 84Q293 54 357 113Q388 146 379 226Z" fill="${hex}" stroke="${dark}" stroke-width="6"/><path d="M144 227Q250 246 379 226L451 241Q468 258 422 265Q269 291 119 261Q99 254 144 227Z" fill="${dark}"/><path d="M150 221Q253 245 381 221L421 236Q265 258 137 237Z" fill="${shine}" opacity=".75"/><path d="M262 87V222M211 101Q176 169 184 222M311 101Q348 167 340 225" stroke="${dark}" stroke-width="3" opacity=".55" fill="none"/><circle cx="261" cy="85" r="8" fill="${shine}" stroke="${dark}" stroke-width="3"/><path d="M231 168l29-19 29 19-29 19z" fill="none" stroke="${dark}" stroke-width="5"/>`;
 // Material texture: re-draw every main-colour shape with a material pattern on top.
 const uid='fv'+(++svgCounter);
 const mainShapes=[...body.matchAll(new RegExp(`<path d="([^"]+)" fill="${hex}"`,'g'))].map(m=>m[1]);
 const tex=materialTexture(d.material,uid,dark);
 const overlay=mainShapes.map(p=>`<path d="${p}" fill="url(#${uid}-tex)" pointer-events="none"/>`).join('');
 const showBadge=opts.badge!==false;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 320" role="img" aria-label="${htmlEscape(color(d.color).name)} ${htmlEscape(material(d.material).name)} ${htmlEscape(template(d.template).name)}"><defs>${tex.defs}</defs>${body}${overlay}${tex.extra}${showBadge?tex.badge:''}</svg>`;
}
let svgCounter=0;
function materialTexture(id,uid,dark){
 const badge=(fill,glyph)=>`<g transform="translate(462 44)"><circle r="30" fill="${fill}" stroke="#fff" stroke-width="4"/>${glyph}</g>`;
 if(id==='canvas')return {
  defs:`<pattern id="${uid}-tex" width="9" height="9" patternUnits="userSpaceOnUse"><path d="M0 4.5H9M4.5 0V9" stroke="${dark}" stroke-width="1.3" opacity=".22"/></pattern>`,
  extra:'',
  badge:badge('#cdb48c','<path d="M-12-12H12V12H-12ZM-12 0H12M0-12V12" fill="none" stroke="#fff" stroke-width="3"/>')};
 if(id==='recycled')return {
  defs:`<pattern id="${uid}-tex" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="4" cy="5" r="1.8" fill="#fff" opacity=".35"/><circle cx="15" cy="9" r="1.4" fill="${dark}" opacity=".3"/><circle cx="9" cy="17" r="1.6" fill="#f4e3b0" opacity=".45"/><circle cx="19" cy="19" r="1.1" fill="#fff" opacity=".3"/></pattern>`,
  extra:'',
  badge:badge('#6f9c62','<path d="M-11 6Q-14-13 11-12Q14 9-6 10Z" fill="#fff"/><path d="M-9 9L6-6" stroke="#6f9c62" stroke-width="3"/>')};
 if(id==='waterproof')return {
  defs:`<linearGradient id="${uid}-tex" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".28" stop-color="#fff" stop-opacity=".08"/><stop offset=".5" stop-color="#fff" stop-opacity=".32"/><stop offset=".62" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".12"/></linearGradient>`,
  extra:`<g fill="#e9f4ff" opacity=".85"><path d="M150 60q7 11 0 16q-7-5 0-16z"/><path d="M390 128q6 10 0 14q-6-4 0-14z"/><path d="M118 150q5 8 0 11q-5-3 0-11z"/><path d="M420 190q5 8 0 11q-5-3 0-11z"/></g>`,
  badge:badge('#5f8fc4','<path d="M0-16Q13 0 10 7A10 10 0 0 1-10 7Q-13 0 0-16Z" fill="#fff"/>')};
 return {
  defs:`<pattern id="${uid}-tex" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="3" height="14" fill="#fff" opacity=".14"/></pattern>`,
  extra:`<path d="M92 294h334" stroke="#e8c15e" stroke-width="3" stroke-dasharray="10 6"/>`,
  badge:badge('#d4a640','<path d="M0-15L4-4 15 0 4 4 0 15-4 4-15 0-4-4Z" fill="#fff"/>')};
}
function mixColor(a,b,t){const rgb=x=>x.match(/[0-9a-f]{2}/gi).slice(0,3).map(y=>parseInt(y,16));const x=rgb(a),y=rgb(b);return '#'+x.map((v,i)=>Math.round(v*(1-t)+y[i]*t).toString(16).padStart(2,'0')).join('');}
function setText(id,value){$(id).textContent=String(value);}
function renderAll(){renderTownMemory();renderUpgrades();renderGoals();renderToken();renderTrend();renderRivals();renderControls();renderTop();renderShelf();renderFeed();renderStatus();renderStandings();renderStalls();}
function renderTop(){setText('topRound',`${Math.min(run.round+1,5)} / 5`);setText('topCash',money(run.cash));setText('treasuryCoins',money(run.treasury));setText('issueNum',String(run.round+1).padStart(2,'0'));}
function renderTrend(){const t=TRENDS[run.round];setText('trendTitle',t.title);setText('trendDescription',t.description);setText('trendEmoji',t.emoji);setText('trendTip',t.tip);$('trendScene').style.background=t.color;$('trendTags').innerHTML=t.tags.map(tag=>`<span class="tag">${htmlEscape(tag)}</span>`).join('');
 const next=TRENDS[run.round+1];const f=$('forecast');if(hasUpgrade('scout')&&next){f.classList.remove('hidden');f.innerHTML=`<span>🔭 SCOUT’S FORECAST · NEXT WEEK</span><strong>${next.emoji} ${htmlEscape(next.title)}</strong><small>${next.tags.map(htmlEscape).join(' · ')}</small>`;}else f.classList.add('hidden');}

/* ---------- Workshop upgrades: spend profit now to earn more later ---------- */
const UPGRADES=[
 {id:'loom',icon:'🧵',name:'Master loom',cost:110,desc:'Materials cost 30% less to make.'},
 {id:'stall',icon:'🏪',name:'Bigger stall',cost:140,desc:'4 more shoppers visit every market day.'},
 {id:'sign',icon:'🪧',name:'Painted sign',cost:90,desc:'Every shopper is keener. Fans even more.'},
 {id:'scout',icon:'🔭',name:'Trend scout',cost:70,desc:'See next week’s trend a round early.'},
 {id:'storage',icon:'🗄️',name:'Storage room',cost:80,desc:'Old stock sells at 15% off, not 30%, and moves faster.'},
];
function renderRivals(){const t=TRENDS[run.round];const d=run.design;
 $('rivalList').innerHTML=currentRivals().map(r=>{const same=r.template===d.template;const twin=same&&r.color===d.color;const clash=(r.undercut?'<span class="clash undercut">📉 Undercutting you</span>':'')+(r.copied?'<span class="clash copy">📋 Copy of your design · pays you 7%</span>':twin?'<span class="clash twin">Same look as yours</span>':same?'<span class="clash">Same product as yours</span>':'');
  return `<div class="rival-item ${same?'overlap':''}"><span class="rival-thumb">${makeProductSvg(r,{badge:false})}</span><div class="rival-copy"><strong>${r.avatar} ${htmlEscape(r.shop)}</strong><small>${htmlEscape(material(r.material).name)} · ${htmlEscape(color(r.color).name)} ${htmlEscape(template(r.template).name.toLowerCase())}</small>${clash}</div><span class="rival-chip">◈ ${r.price}</span></div>`;}).join('');
 const s=saturation();setText('saturationNote',s>=.18?'Competition warning: your product looks very similar to a rival’s.':s>0?'A rival is making the same type of product. Price carefully.':'Your design stands apart from both rival workshops.');}
function renderControls(){const d=run.design;setText('designSerial',`FV–${String(run.history.length+1).padStart(3,'0')}`);$('templateRow').innerHTML=TEMPLATES.map(t=>`<button class="template-button ${d.template===t.id?'selected':''}" type="button" data-template="${t.id}" aria-pressed="${d.template===t.id}"><span>${t.symbol}</span><span>${htmlEscape(t.name)}</span></button>`).join('');$('materialGrid').innerHTML=MATERIALS.map(m=>`<button class="material-button ${d.material===m.id?'selected':''}" type="button" data-material="${m.id}" aria-pressed="${d.material===m.id}"><span class="material-name"><strong>${htmlEscape(m.name)}</strong><small>${htmlEscape(m.subtitle)}</small></span><span class="material-cost">+${matCost(m)}</span></button>`).join('');$('colorRow').innerHTML=COLORS.map(c=>`<button class="color-pick ${d.color===c.id?'selected':''}" type="button" data-color="${c.id}" style="background:${c.hex}" title="${htmlEscape(c.name)}" aria-label="${htmlEscape(c.name)}" aria-pressed="${d.color===c.id}"></button>`).join('');$('remixButtons').innerHTML=`<button type="button" class="remix-button ${d.remix===null?'selected':''}" data-remix="original"><strong>✎ My own design</strong><small>No royalties</small></button>`+currentRivals().map((r,i)=>`<button type="button" class="remix-button ${d.remix===i?'selected':''}" data-remix="${i}"><strong>↗ ${htmlEscape(r.shop)}</strong><small>Copy their look · 7%</small></button>`).join('');$('priceRange').value=d.price;$('quantityInput').value=d.qty;renderPreview();renderCosts();}
function renderPreview(){const d=run.design;const badge=quality(d)>.9?'● PREMIUM':quality(d)>.75?'● WELL-MADE':'● EVERYDAY';if(!(typeof lux3dPreview==='function'&&lux3dPreview(d)))$('productIllustration').innerHTML=makeProductSvg(d);setText('previewProductName',template(d.template).title);setText('qualityTag',`${badge} · ${material(d.material).name.toUpperCase()}`);renderTrendCheck();renderStalls();}
// When you can't afford even one item, you can still open the stall to sell leftover stock.
function cheapestUnit(){return Math.min(...TEMPLATES.flatMap(t=>MATERIALS.map(m=>t.base+matCost(m))));}
function leftoverMode(){return run.mode==='design'&&run.cash<cheapestUnit();}
function renderCosts(){const d=run.design;const cost=getUnitCost();const required=totalCost();setText('priceValue',d.price);setText('unitCost',cost);setText('totalCost',required);setText('possibleRevenue',d.price*d.qty);const leftover=leftoverMode();const hasOld=run.stock.some(x=>x.remaining>0);const error=leftover?(hasOld?'You can’t afford a new batch. Open your stall to sell leftover stock and earn your way back.':'You can’t afford a new batch, and your shelf is empty. Open your stall to see out the season.'):required>run.cash?'Not enough coins for this batch. Try making fewer items, or cheaper materials.':d.price<=cost?'Careful! Your price is at or below production cost.':'Estimated gross margin: ◈ '+(d.price-cost)+' per item, before treasury and remix royalties.';$('budgetAlert').textContent=error;$('budgetAlert').classList.toggle('good',required<=run.cash&&d.price>cost);if(run.mode==='design'){setText('stallPrice-you','◈ '+d.price);setText('stallStock',d.qty);}$('startSales').disabled=run.mode!=='design'||(!leftover&&(required>run.cash||d.qty<1||d.qty>30));$('startSales').querySelector('span').textContent=leftover?'Open stall with leftover stock':'Produce & open your stall';}
function renderShelf(){setText('shelfCount',`${run.stock.length} DESIGN${run.stock.length===1?'':'S'}`);$('designShelf').innerHTML=run.stock.length?run.stock.slice().reverse().map(x=>`<div class="design-mini"><span class="mini-swatch" style="background:${color(x.color).hex}"></span><div class="mini-details"><strong>${htmlEscape(x.name)}</strong><small>${x.remaining} left · ${x.sold} sold · ${x.remixShop?'remixed':'original'}</small></div><span class="mini-money">◈ ${money(x.earned)}</span></div>`).join(''):'<p class="empty-shelf">Each batch you make becomes a design card with its own sales record.</p>';}
function renderFeed(){setText('activityCount',`${run.visits} VISIT${run.visits===1?'':'S'}`);$('activityFeed').innerHTML=run.feed.length?run.feed.slice(0,8).map(x=>{if(x.notice)return `<div class="feed-entry feed-notice"><div class="feed-info"><div class="feed-head"><strong>${htmlEscape(x.title)}</strong></div><p>${htmlEscape(x.message)}</p></div></div>`;const status=x.rival?`AT ${x.rival.toUpperCase()}`:x.bought?'BOUGHT':'PASSED';const cls=x.rival?'rival':x.bought?'bought':'passed';return `<div class="feed-entry"><span class="feed-avatar" style="background:${x.avatar}">${htmlEscape(x.name[0])}</span><div class="feed-info"><div class="feed-head"><strong>${htmlEscape(x.name)} <small style="font-weight:400;color:#a4aea3">· ${PERSONAS[x.type].label}</small></strong><span class="${cls}">${htmlEscape(status)}</span></div>${x.memo?`<p class="memo">“${htmlEscape(x.memo)}”</p>`:''}<p>${htmlEscape(x.message)}</p></div></div>`;}).join(''):'<div class="feed-placeholder"><span>❀</span><p>Open your stall to see what people think of your designs.</p></div>';}
function renderStatus(){const live=run.mode==='selling';setText('workshopStatus',live?'SHOPPERS ARRIVING':run.mode==='results'?(run.finished?'SEASON COMPLETE':'ROUND COMPLETE'):'OPEN FOR DESIGN');setText('marketMood',live?'BUSY':run.mode==='results'?'CLOSED':'WAITING');setText('shopOpenLabel',live?'BUSY':run.mode==='results'?'CLOSED':'OPEN');setText('sceneLabel',live?'NPCS ARE SHOPPING':run.mode==='results'?'MARKET CLOSED FOR TODAY':'TOWN IS BROWSING');$('skipSales').classList.toggle('hidden',!live);renderUpgrades();$('marketScene').classList.toggle('is-live',live);}
function updateDesign(patch,clearRemix){if(run.mode!=='design')return;run.design={...run.design,...patch,remix:clearRemix?null:('remix' in patch?patch.remix:run.design.remix)};renderControls();renderRivals();}
function addFeed(entry){run.feed.unshift(entry);run.feed.length=Math.min(run.feed.length,12);run.visits++;renderFeed();setText('buyerSpeech',`${entry.name}: ${entry.message}`);}
function marketVisitorTypes(){const types=[];for(let i=0;i<6;i++){types.push('bargain','trend','luxury');}if(hasUpgrade('stall'))types.push('bargain','trend','luxury','trend');return types;}
function scramble(items,rng){const a=items.slice();for(let i=a.length-1;i>0;i--){let j=Math.floor(rng()*(i+1));[a[j],a[i]]=[a[i],a[j]];}return a;}
function recordSale(asset,price,report,buyer,isClearance){const townFee=price*.03;const royalty=asset.remixShop?price*.07:0;const net=price-townFee-royalty;run.cash+=net;run.treasury+=townFee;run.playerRevenue+=price;asset.sold++;asset.revenue+=price;asset.earned+=net;asset.royalties+=royalty;run.totalSold++;if(isClearance){report.clearanceSales+=price;report.clearanceNet+=net;report.clearanceUnits++}else{report.unitsSold++;report.gross+=price;report.royalties+=royalty;report.townFees+=townFee;report.byType[buyer.type].bought++}renderTop();renderShelf();}
// Decide what a visitor will do. Stock is reserved immediately so later visitors see the right
// amount; money and feed entries are applied when the shopper actually reaches the stall.
function startSales(){const leftover=leftoverMode();if(run.mode!=='design'||(!leftover&&(totalCost()>run.cash||run.design.qty<1||run.design.qty>30)))return;if(leftover)run.design={...run.design,qty:0};clearTownEffects();
 const d={...run.design};run.cash-=totalCost(d);const newAsset={id:`FV-${String(run.history.length+1).padStart(3,'0')}`,name:template(d.template).title,template:d.template,material:d.material,color:d.color,price:d.price,qty:d.qty,remaining:d.qty,unitCost:getUnitCost(d),sold:0,revenue:0,earned:0,royalties:0,remixShop:d.remix===null?null:currentRivals()[d.remix].shop};if(newAsset.qty>0)run.stock.push(newAsset);
 run.mode='selling';run.visits=0;run.feed=[];stopAmbient();renderFeed();renderTop();renderShelf();renderCosts();renderStatus();renderStalls();$('designControls').classList.add('hidden');$('resultsPanel').classList.add('hidden');setText('buyerSpeech','The stall is open! Here come the shoppers…');
 const report={cost:totalCost(d),unitsSold:0,gross:0,royalties:0,townFees:0,clearanceSales:0,clearanceNet:0,clearanceUnits:0,byType:{bargain:{bought:0,passed:0},trend:{bought:0,passed:0},luxury:{bought:0,passed:0}},cashBefore:run.cash+totalCost(d),trendFit:trendFit(d),saturation:saturation(d),assetId:newAsset.id,reasons:{},rivalSales:[0,0],rivalDirect:[0,0],rivalRevenue:[0,0],wallets:[],
  moves:{flash:null,hype:null,restock:null},event:null,memo:{},royaltiesIn:0,copySales:0};
 const seed=hashSeed([run.round,d.template,d.material,d.color,d.price,d.qty,d.remix,run.cash].join('|'));const rng=randomGenerator(seed);const rivalRng=randomGenerator(seed^0x9e3779b9);
 const seen={};const visitors=scramble(marketVisitorTypes(),rng).map((type,i)=>{const k=seen[type]=(seen[type]||0)+1;const folk=FOLK_BY_TYPE[type];return getBuyer(type,i,rng,folk[(k-1+run.round*3)%folk.length]);});report.wallets=visitors.map(v=>v.wallet);
 // Rival workshops also have their own regulars, decided up front from a separate random stream.
 const walkRng=randomGenerator(seed^0x85ebca6b);const walkins=[];
 currentRivals().forEach((r,i)=>{for(let k=0;k<RIVAL_REGULARS+(r.boost||0);k++){const b=getBuyer(['bargain','trend','luxury'][k%3],k+20+i*RIVAL_REGULARS,walkRng);const p=scorePurchase(r,b,rivalSaturation(i,d)).probability*.6;if(walkRng()<p)walkins.push({kind:'walkin',rival:i,buyer:b,price:r.price,report,applied:false});}});
 const pending=scramble(walkins,walkRng);const queue=[];visitors.forEach((v,i)=>{queue.push({visitor:v});if(i%2===1&&pending.length)queue.push(pending.shift());});queue.push(...pending);
 // One surprise town event per round, partway through the market.
 const eventRng=randomGenerator(seed^0xc2b2ae35);const ev=TOWN_EVENTS[Math.floor(eventRng()*TOWN_EVENTS.length)];
 const overlap=currentRivals().findIndex(r=>r.template===d.template);
 const event={id:ev.id,at:5+Math.floor(eventRng()*4),active:false,rival:overlap>=0?overlap:Math.floor(eventRng()*2),until:0};
 session={seed,visitors,queue,qi:0,plans:[],report,asset:newAsset,rng,rivalRng,eventRng,event,visitorCount:0,flash:null,hype:null,restocked:false,recent:[],extraVisitors:0,spawning:false,done:false};
 renderLiveActions();setHint('Watch the shoppers. Your moves can change how this market goes.');revealTown();
 spawnNext();}
function finishRound(report,asset){run.mode='results';report.net=report.gross-report.townFees-report.royalties-report.cost+report.clearanceNet+(report.royaltiesIn||0);maybeCopy(report,asset);rivalsReact(report);tokenRound(report,report.seed||1);report.unsold=asset.remaining;run.history.push(report);run.reputation+=asset.qty?Math.round((report.unitsSold/asset.qty)*10):0;run.salesReport=report;run.finished=run.round===TRENDS.length-1;renderResults(report,asset);renderStatus();renderStandings();renderStalls();renderTownMemory();renderGoals();startAmbient();$('resultsPanel').classList.remove('hidden');setText('buyerSpeech',asset.remaining===0?'You sold the whole batch. Word got around!':'Market closed! Every choice has a consequence.');$('resultsPanel').scrollIntoView({block:'start',behavior:'smooth'});}
function renderResults(report,asset){const gross=report.gross;const profit=report.net;const soldText=`${report.unitsSold} / ${asset.qty}`;const liked=Object.entries(report.byType).sort((a,b)=>b[1].bought-a[1].bought)[0];const insight=!asset.qty?'You couldn’t afford a new batch this round. Leftover sales and copycat royalties are how you earn your way back.':report.unitsSold===0?'No buyers this time. Try a stronger trend match, lower price, or different material next round.':report.unsold===0?'You sold out. A larger batch or a slightly higher price might earn more next time.':report.saturation>=.12?'Rival competition slowed demand. An original look could earn a stronger response.':report.trendFit<.5?'Trend fit was weak this round. Matching a shopper preference might help.':`Your ${PERSONAS[liked[0]].label.toLowerCase()} customers were most enthusiastic.`;
 const final=run.finished;const netWorth=workshopValue();const oldSales=report.clearanceSales>0?` Older designs earned ◈ ${money(report.clearanceSales)} in clearance sales this round.`:'';
 const board=[{name:'Your workshop',rev:run.playerRevenue,you:true},...TRENDS[0].rivals.map((r,i)=>({name:r.shop,rev:run.rivalTotals[i].revenue}))].sort((a,b)=>b.rev-a.rev);const place=board.findIndex(r=>r.you)+1;
 const placeText=place===1?'You finished the season as Forgeville’s top workshop!':`You finished #${place} of 3 workshops. ${board[0].name} led the town on sales.`;
 $('resultsPanel').innerHTML=`<span class="results-eyebrow">${final?'WORKSHOP SEASON COMPLETE':'THE MARKET HAS SPOKEN'} · ROUND ${run.round+1}</span><h3>${!asset.qty?'A leftovers-only market day.':report.unitsSold===asset.qty?'A full sell-out!':report.unitsSold>=asset.qty*.65?'The town liked that one.':report.unitsSold>0?'A few fans, a few lessons.':'Back to the drawing board.'}</h3><p>${!asset.qty?'No new batch this round: leftover stock only':`${htmlEscape(template(asset.template).title)} · ${htmlEscape(material(asset.material).name)} · ${htmlEscape(color(asset.color).name)}${asset.remixShop?' · Remix of '+htmlEscape(asset.remixShop):''}`}</p><div class="result-grid"><div class="result-stat"><span>New stock sold</span><strong>${soldText}</strong></div><div class="result-stat"><span>Sales revenue</span><strong>◈ ${money(gross)}</strong></div><div class="result-stat"><span>Round profit</span><strong class="${profit>=0?'positive':'negative'}">${profit>=0?'+':'−'} ◈ ${money(Math.abs(profit))}</strong></div><div class="result-stat"><span>Remaining stock</span><strong>${report.unsold}</strong></div><div class="result-stat"><span>Production cost</span><strong>◈ ${report.cost}</strong></div><div class="result-stat"><span>Treasury + royalties</span><strong>◈ ${money(report.townFees+report.royalties)}</strong></div></div><div class="buyer-breakdown"><h4>Who bought your design?</h4><div class="buyer-summary">${Object.entries(report.byType).map(([id,s])=>`<div>${PERSONAS[id].emblem} ${PERSONAS[id].label}<strong>${s.bought} of ${s.bought+s.passed}</strong></div>`).join('')}</div></div>${movesPanel(report)}${asset.qty?whyPanel(report,asset):''}<div class="result-note">✦ ${htmlEscape(insight)}${htmlEscape(oldSales)} Unsold designs stay on your shelf and may sell at a 30% discount in later rounds.</div>${final?verdictHtml():''}${final?`<div class="final-score"><span>ESTIMATED FINAL WORKSHOP VALUE</span><strong>◈ ${money(netWorth)}</strong><span>${htmlEscape(placeText)} ${loyalFans()} loyal fans in town. Cash ◈ ${money(run.cash)} plus clearance-valued unsold stock and your upgrades · ${run.totalSold} lifetime sales · town treasury ◈ ${money(run.treasury)}</span></div>`:''}<div class="results-actions"><button class="main-cta" type="button" id="nextRound"><span>${final?'Play again':'Start round '+(run.round+2)}</span><span class="cta-arrow">↗</span></button><button type="button" class="outline-button" id="howScored">${final?'The rules':'How scoring works'}</button></div>`;
 $('nextRound').addEventListener('click',()=>{if(final){resetGame();return}nextRound();});$('howScored').addEventListener('click',()=>openHowTo(final?0:3));
}
function nextRound(){if(run.mode!=='results'||run.finished)return;clearTownEffects();run.round++;run.mode='design';run.salesReport=null;run.design={template:'tote',material:'canvas',color:'coral',price:45,qty:8,remix:null};$('designControls').classList.remove('hidden');$('resultsPanel').classList.add('hidden');run.feed=[];run.visits=0;renderAll();setText('buyerSpeech',"New week, new trend. What's your next move?");const fb=currentRivals().filter(r=>r.undercut).map(r=>r.shop);if(fb.length)addNotice('📉 Rivals fight back',`${fb.join(' and ')} cut prices and drew extra regulars after you out-sold them.`);const cp=currentRivals().find(r=>r.copied);if(cp)addNotice('📋 Copycat alert',`${cp.shop} copied your ${color(cp.color).name.toLowerCase()} ${template(cp.template).name.toLowerCase()}. You earn 7% on every copy they sell.`);window.scrollTo({top:0,behavior:'smooth'});}
function resetGame(){clearTownTimers();session=null;clearTownEffects();renderLiveActions();clearNpcs();run=initialState();$('designControls').classList.remove('hidden');$('resultsPanel').classList.add('hidden');renderAll();setText('buyerSpeech',"A new shop? Let's see what you've got!");startAmbient();window.scrollTo({top:0,behavior:'smooth'});}

/* ---------- The living town: stalls, walking shoppers and ambient strollers ---------- */
const SPAWN_MS=700;
const RIVAL_REGULARS=17; // shoppers who visit each rival directly every round
const WALK_SPEED=30; // percent of the scene's width per second
const STALL_X={you:50,0:17,1:83};
const SKINS=['#e8b18a','#b47d5f','#e5c3a7','#d9b39b','#ac805d','#8a5a3c'];
const REDUCE_MOTION=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
let session=null;const townTimers=[];const ambientTimers=[];let ambientOn=false;
function openHowTo(start=0){guideStep=typeof start==='number'?start:(start?5:0);markGuideSeen();const root=$('modalRoot');root.classList.remove('hidden');root.setAttribute('aria-hidden','false');renderGuide();root.onclick=e=>{if(e.target===root)closeModal()};document.addEventListener('keydown',escapeModal);}
function escapeModal(e){if(e.key==='Escape')closeModal();if($('modalRoot').classList.contains('hidden'))return;if(e.key==='ArrowRight'&&guideStep<GUIDE_STEPS.length-1){guideStep++;renderGuide();}if(e.key==='ArrowLeft'&&guideStep>0){guideStep--;renderGuide();}}
function closeModal(){const root=$('modalRoot');root.classList.add('hidden');root.setAttribute('aria-hidden','true');root.innerHTML='';document.removeEventListener('keydown',escapeModal);}
function bind(){ $('templateRow').addEventListener('click',e=>{const b=e.target.closest('[data-template]');if(b)updateDesign({template:b.dataset.template},true);});$('materialGrid').addEventListener('click',e=>{const b=e.target.closest('[data-material]');if(b)updateDesign({material:b.dataset.material},true);});$('colorRow').addEventListener('click',e=>{const b=e.target.closest('[data-color]');if(b)updateDesign({color:b.dataset.color},true);});$('remixButtons').addEventListener('click',e=>{const b=e.target.closest('[data-remix]');if(!b)return;if(b.dataset.remix==='original'){updateDesign({remix:null},false);return}const i=Number(b.dataset.remix);const r=currentRivals()[i];if(r)updateDesign({template:r.template,material:r.material,color:r.color,remix:i,price:Math.min(120,r.price)},false);});$('priceRange').addEventListener('input',e=>{run.design.price=Number(e.target.value);renderCosts();});$('quantityInput').addEventListener('input',e=>{run.design.qty=clamp(Math.trunc(Number(e.target.value)||0),0,30);renderCosts();});$('quantityInput').addEventListener('change',e=>{run.design.qty=clamp(Math.trunc(Number(e.target.value)||1),1,30);e.target.value=run.design.qty;renderCosts();});$('qtyMinus').onclick=()=>{run.design.qty=clamp(run.design.qty-1,1,30);$('quantityInput').value=run.design.qty;renderCosts()};$('qtyPlus').onclick=()=>{run.design.qty=clamp(run.design.qty+1,1,30);$('quantityInput').value=run.design.qty;renderCosts()};$('startSales').onclick=startSales;$('howToPlay').onclick=()=>openHowTo(0);$('resetGame').onclick=()=>{if(run.mode==='selling')return;const btn=$('resetGame');if(run.history.length&&!btn.classList.contains('armed')){btn.classList.add('armed');btn.dataset.label=btn.innerHTML;btn.innerHTML='↻ Tap again to reset';setTimeout(()=>{if(btn.classList.contains('armed')){btn.classList.remove('armed');btn.innerHTML=btn.dataset.label;}},3000);return;}if(btn.classList.contains('armed')){btn.classList.remove('armed');btn.innerHTML=btn.dataset.label;}resetGame()};}
function renderStandings(){
 const rows=[{name:'Your workshop',rev:run.playerRevenue,units:run.totalSold,you:true},...TRENDS[0].rivals.map((r,i)=>({name:r.shop,rev:run.rivalTotals[i].revenue,units:run.rivalTotals[i].units}))].sort((a,b)=>b.rev-a.rev);
 const max=Math.max(1,...rows.map(r=>r.rev));
 $('standings').innerHTML=`<div class="standings-title"><span>SEASON STANDINGS</span><span>SALES</span></div>`+rows.map((r,i)=>`<div class="standing-row ${r.you?'you':''}"><span class="standing-rank">${i+1}</span><div class="standing-main"><div class="standing-name"><strong>${htmlEscape(r.name)}</strong><span>${r.units} sold · ◈ ${money(r.rev)}</span></div><div class="standing-bar"><span style="width:${(r.rev/max*100).toFixed(1)}%"></span></div></div></div>`).join('');}
function renderTrendCheck(){const t=TRENDS[run.round];const d=run.design;
 const items=[['Product',template(d.template).name,t.products.includes(d.template)],['Material',material(d.material).name,t.materials.includes(d.material)],['Colour',color(d.color).name,t.colors.includes(d.color)]];
 const fit=Math.round(trendFit(d)*100);
 $('trendCheck').innerHTML=`<div class="trend-meter"><span>TREND MATCH</span><strong>${fit}%</strong><div class="meter"><span style="width:${fit}%"></span></div></div><div class="trend-items">${items.map(([k,v,ok])=>`<span class="trend-item ${ok?'ok':'miss'}"><b>${ok?'✓':'✗'} ${k}</b><small>${htmlEscape(v)}</small></span>`).join('')}</div>`;}
function renderStalls(){const t=TRENDS[run.round];
 currentRivals().forEach((r,i)=>{$('stall-'+i).classList.toggle('copycat',!!r.copied);$('stallGoods-'+i).innerHTML=makeProductSvg(r,{badge:false});setText('stallPrice-'+i,'◈ '+r.price);});
 const sell=run.mode!=='design'&&run.stock.length?run.stock[run.stock.length-1]:null;const d=sell||run.design;
 $('stallGoods-you').innerHTML=makeProductSvg(d,{badge:false});setText('stallPrice-you','◈ '+d.price);setText('stallStock',sell?sell.qty-sell.sold:run.design.qty);}
function planVisit(buyer,asset,report,rng,rivalRng){const s=session;const m=liveMods(buyer);const inFlash=m.priceMult<1;const inHype=!!(s.hype&&s.visitorCount<s.hype.until);s.visitorCount++;
 const d={...run.design,price:Math.round(run.design.price*m.priceMult)};
 const rating=scorePurchase(d,buyer,saturation(run.design)+m.satAdd);const mem=memoryMod(buyer,d);const sign=hasUpgrade('sign')?(mem.tag==='fan'?.1:.05):0;const prob=rating.probability>0?clamp(rating.probability+m.bonus+mem.bonus+sign,.03,.96):0;
 const plan={buyer,asset,report,kind:'leave',price:0,msg:'',code:rating.code,applied:false,inFlash,inHype,prob,offerPrice:d.price,memo:mem.line,memoTag:mem.tag};plan.thought=thoughtFor(plan);
 if(mem.tag){const st=report.memo[mem.tag]=report.memo[mem.tag]||{visits:0,bought:0};st.visits++;}
 if(inFlash)report.moves.flash.visits++;if(inHype)report.moves.hype.visits++;
 if(asset.remaining>0&&rng()<prob){plan.kind='buy';plan.price=d.price;plan.msg=rating.yesReason;asset.remaining--;return plan;}
 if(asset.remaining===0){plan.msg=asset.qty===0?'Nothing new this week?':'Sold out already? I missed it!';plan.code='soldout';}else plan.msg=rating.reason||rating.noReason;
 // Real previous inventory can sell at a 30% clearance discount in later rounds.
 const clearMult=hasUpgrade('storage')?.85:.7;const old=run.stock.filter(x=>x.id!==asset.id&&x.remaining>0&&Math.round(x.price*clearMult)<=buyer.wallet);
 if(old.length){const pick=old[Math.floor(rng()*old.length)];const clearanceChance=(buyer.type==='bargain'?.34:buyer.type==='trend'?.1:.17)*(hasUpgrade('storage')?1.4:1);if(rng()<clearanceChance){pick.remaining--;plan.kind='clearance';plan.pick=pick;plan.price=Math.round(pick.price*clearMult);plan.msg=`Found a deal on last season’s ${template(pick.template).name.toLowerCase()}!`;return plan;}}
 // Shoppers you lost may cross the street. Uses its own random stream, so your sales odds are unchanged.
 let best=-1,bestP=0;currentRivals().forEach((_,i)=>{const r=rivalView(i);const p=scorePurchase(r,buyer,rivalSaturation(i)).probability*.55;if(p>bestP){bestP=p;best=i;}});
 if(best>=0&&rivalRng()<bestP){const r=rivalView(best);plan.kind='rival';plan.rival=best;plan.price=r.price;plan.msg=`${plan.msg} Trying ${r.shop} instead.`;}
 return plan;}
function applyVisit(plan){if(plan.applied)return;plan.applied=true;const {buyer,report}=plan;
 if(plan.kind==='walkin'){report.rivalDirect[plan.rival]++;report.rivalRevenue[plan.rival]+=plan.price;run.rivalTotals[plan.rival].units++;run.rivalTotals[plan.rival].revenue+=plan.price;copyRoyalty(plan.rival,plan.price,report);remember(buyer.name,{kind:'rival',shop:currentRivals()[plan.rival].shop});renderStandings();renderTownMemory();checkSessionDone();return;}
 if(plan.kind==='buy'){recordSale(plan.asset,plan.price,report,buyer,false);if(plan.inFlash)report.moves.flash.sold++;if(plan.inHype)report.moves.hype.sold++;}
 else{if(plan.kind==='clearance')recordSale(plan.pick,plan.price,report,buyer,true);
  report.byType[buyer.type].passed++; // They passed on the new item, even if they bought clearance stock.
  report.reasons[plan.code]=(report.reasons[plan.code]||0)+1;
  if(plan.kind==='rival'){report.rivalSales[plan.rival]++;report.rivalRevenue[plan.rival]+=plan.price;run.rivalTotals[plan.rival].units++;run.rivalTotals[plan.rival].revenue+=plan.price;copyRoyalty(plan.rival,plan.price,report);}}
 if(plan.memoTag&&(plan.kind==='buy'))report.memo[plan.memoTag].bought++;
 memoryRecord(plan);renderTownMemory();
 addFeed({memo:plan.memo,name:buyer.name,type:buyer.type,avatar:buyer.avatar,bought:plan.kind==='buy'||plan.kind==='clearance',rival:plan.kind==='rival'?currentRivals()[plan.rival].shop:null,message:plan.msg});
 setText('stallStock',plan.asset.qty-plan.asset.sold);renderStandings();
 if(session){session.recent.push(plan.kind==='buy'?'buy':plan.code);session.recent=session.recent.slice(-4);smartHint();renderLiveActions();}
 checkSessionDone();}
function checkSessionDone(){if(session&&session.plans.length===session.queue.length&&session.plans.every(p=>p.applied))later(endSession,1100);}
function endSession(){if(!session||session.done)return;if(session.plans.length<session.queue.length||!session.plans.every(p=>p.applied))return;session.done=true;const {report,asset}=session;report.seed=session.seed;session=null;renderLiveActions();finishRound(report,asset);}
function skipSales(){if(!session||session.done)return;clearTownTimers();clearNpcs();
 while(session.qi<session.queue.length){const item=session.queue[session.qi++];if(item.visitor){session.plans.push(planVisit(item.visitor,session.asset,session.report,session.rng,session.rivalRng));if(!session.event.active&&session.visitorCount>=session.event.at)triggerEvent(true);}else session.plans.push(item);}
 session.plans.forEach(applyVisit);endSession();}

/* ---------- Live moves and town events ---------- */
const TOWN_EVENTS=[
 {id:'rain',icon:'🌧️',title:'Sudden downpour!',desc:'Waterproof goods are flying off stalls. Everything else, less so.'},
 {id:'pricecut',icon:'✂️',title:'Price cut across the street!',desc:'A rival slashed prices by 25% for the rest of the day.'},
 {id:'bus',icon:'🚌',title:'A tour bus pulls in!',desc:'Four well-off visitors are heading for the stalls.'},
 {id:'influencer',icon:'📸',title:'A style influencer is filming',desc:'The next 4 shoppers only want what’s on-trend.'},
 {id:'heat',icon:'☀️',title:'Surprise heatwave',desc:'Nobody wants a jacket right now. Light pieces are in.'},
];
const HYPE_COST=20;const RESTOCK_UNITS=4;
function whyPanel(report,asset){const t=TRENDS[run.round];
 const tick=(ok,label)=>`${ok?'✓':'✗'} ${label}`;
 const matches=[tick(t.products.includes(asset.template),'product'),tick(t.materials.includes(asset.material),'material'),tick(t.colors.includes(asset.color),'colour')].join(' · ');
 const reach=report.wallets.filter(w=>w>=asset.price).length;const n=report.wallets.length||1;
 const overlap=currentRivals().filter(r=>r.template===asset.template).map(r=>r.shop);
 const row=(label,pct,note,tone='')=>`<div class="why-row"><div class="why-label"><strong>${label}</strong><span>${htmlEscape(note)}</span></div><div class="meter ${tone}"><span style="width:${clamp(pct,0,100)}%"></span></div></div>`;
 const labels={price:'Too expensive',trend:'Not this week’s look',quality:'Wanted a finer finish',unsure:'Undecided',soldout:'Missed out — sold out'};
 const reasons=Object.entries(report.reasons).sort((a,b)=>b[1]-a[1]);
 const rivalLines=currentRivals().map((r,i)=>{const total=report.rivalSales[i]+report.rivalDirect[i];return `${r.shop} sold ${total}${report.rivalSales[i]?` (${report.rivalSales[i]} after passing on your stall)`:''}`;});
 return `<div class="why-panel"><h4>Why shoppers decided</h4>
 ${row('Trend match',Math.round(report.trendFit*100),matches)}
 ${row('Quality',Math.round(quality(asset)*100),material(asset.material).name+' material')}
 ${row('Price reach',Math.round(reach/n*100),`${reach} of ${n} shoppers could afford ◈ ${asset.price}`)}
 ${row('Competition',Math.round(clamp(report.saturation/.4,0,1)*100),overlap.length?`Same product as ${overlap.join(' and ')}`:'No rival made the same product','warn')}
 ${reasons.length?`<div class="why-reasons"><span>WHAT PASSERS-BY SAID</span><div>${reasons.map(([k,c])=>`<span class="reason-chip">${htmlEscape(labels[k]||k)} <b>×${c}</b></span>`).join('')}</div></div>`:''}
 <p class="why-rivals">Across the street: ${htmlEscape(rivalLines.join('; '))}.</p></div>`;}
function later(fn,ms,list=townTimers){const t=setTimeout(()=>{const i=list.indexOf(t);if(i>=0)list.splice(i,1);fn();},ms);list.push(t);return t;}
function clearTownTimers(){townTimers.forEach(clearTimeout);townTimers.length=0;}
function clearNpcs(sel='.npc'){$('npcLayer').querySelectorAll(sel).forEach(n=>n.remove());}
function setPos(npc,x,y){npc.x=x;npc.y=y;const s=npc.el.style;s.left=x+'%';s.top=y+'%';s.zIndex=String(Math.round(y*10));s.setProperty('--depth',(0.85+(y-64)/28*0.3).toFixed(3));}
const HAIR_STYLES=['short','long','bun','puffs','curly','short'];
const HAIR_COLORS=['#2b211c','#3b2a20','#5a3a26','#7a4a2a','#1d1a19','#a8683d'];
// A stable look per shopper name, so the same NPC always looks the same.
function npcLook(seedText){const h=hashSeed(String(seedText));return {hair:HAIR_STYLES[h%HAIR_STYLES.length],hairColor:HAIR_COLORS[(h>>>4)%HAIR_COLORS.length],blink:((h>>>8)%40)/10};}
function spawnNpc(type,skin,x,y,extra='',look=npcLook(Math.random())){const el=document.createElement('div');el.className=`npc npc-${type} hair-${look.hair} ${extra}`;
 el.style.setProperty('--hair',look.hairColor);el.style.setProperty('--blink',`-${look.blink}s`);
 el.innerHTML=`<span class="npc-bubble"></span><span class="npc-figure"><span class="npc-hair-back"></span><span class="npc-arms"><i></i><i></i></span><span class="npc-body"></span><span class="npc-legs"><i></i><i></i></span><span class="npc-head" style="background:${skin}"><span class="npc-hair"></span><i class="eye l"></i><i class="eye r"></i><i class="cheek l"></i><i class="cheek r"></i><i class="mouth"></i></span><span class="npc-bag"></span></span>`;
 $('npcLayer').appendChild(el);const npc={el,x,y};setPos(npc,x,y);void el.offsetWidth;return npc;}
function mood(npc,m,ms=0,list=townTimers){npc.el.classList.remove('happy','sad');if(m)npc.el.classList.add(m);if(ms)later(()=>npc.el.classList.remove(m),ms,list);}
function walkTo(npc,x,y,list=townTimers,speed=WALK_SPEED){const dist=Math.hypot(x-npc.x,(y-npc.y)*.8);const ms=REDUCE_MOTION?80:Math.max(220,dist/speed*1000);
 npc.el.style.transitionDuration=ms+'ms';npc.el.classList.toggle('face-left',x<npc.x);npc.el.classList.add('walking');setPos(npc,x,y);later(()=>npc.el.classList.remove('walking'),ms,list);return ms;}
function say(npc,text,kind='',ms=1300,list=townTimers){const b=npc.el.querySelector('.npc-bubble');b.textContent=text;b.className='npc-bubble show '+kind;npc.el.classList.add('speaking');npc.el.dataset.say=(npc.el.dataset.say|0)+1;later(()=>{b.classList.remove('show');npc.el.dataset.say=(npc.el.dataset.say|0)-1;if(+npc.el.dataset.say<=0)npc.el.classList.remove('speaking');},ms,list);}
function stallPop(key,text,kind=''){const st=$('stall-'+key);if(!st)return;const p=document.createElement('span');p.className='stall-pop '+kind;p.textContent=text;st.appendChild(p);setTimeout(()=>p.remove(),1400);st.classList.remove('flash');void st.offsetWidth;st.classList.add('flash');}
function giveBag(npc,hex){npc.el.classList.add('has-bag');npc.el.style.setProperty('--bag',hex);}
function exitNpc(npc,x,list=townTimers,speed=WALK_SPEED){const ms=walkTo(npc,x,80+Math.random()*12,list,speed);later(()=>npc.el.remove(),ms+60,list);}
const SHORT_REASON={price:'Too pricey',trend:'Not my style',quality:'Too basic',unsure:'Hmm… no',soldout:'Sold out!'};
function walkVisitor(plan){const b=plan.buyer;const fromLeft=Math.random()<.5;
 const npc=spawnNpc(b.type,b.avatar,fromLeft?-6:106,78+Math.random()*14,'',npcLook(b.name));
 if(plan.memoTag)npc.el.dataset.memo=plan.memoTag;
 const ms=walkTo(npc,STALL_X.you+(Math.random()*24-12),71+Math.random()*5);
 later(()=>{say(npc,'💭 '+plan.thought,'think',THINK_MS);
 later(()=>{applyVisit(plan);
  if(plan.kind==='buy'){mood(npc,'happy');say(npc,`✓ ◈ ${plan.price}`,'yes');stallPop('you',`+◈ ${plan.price}`);giveBag(npc,color(plan.asset.color).hex);}
  else if(plan.kind==='clearance'){mood(npc,'happy');say(npc,'✓ Clearance deal','yes');stallPop('you',`+◈ ${plan.price}`,'clear');giveBag(npc,color(plan.pick.color).hex);}
  else{mood(npc,'sad',plan.kind==='rival'?0:1600);say(npc,SHORT_REASON[plan.code]||'No thanks','no');}
  later(()=>{
   if(plan.kind==='rival'){const r=currentRivals()[plan.rival];const m2=walkTo(npc,STALL_X[plan.rival]+(Math.random()*8-4),71+Math.random()*4);
    later(()=>{mood(npc,'happy');say(npc,`✓ ◈ ${r.price}`,'rival');stallPop(plan.rival,`+◈ ${r.price}`,'rival');giveBag(npc,color(r.color).hex);later(()=>exitNpc(npc,plan.rival===0?-8:108),700);},m2);}
   else exitNpc(npc,fromLeft?108:-8);
  },850);
 },THINK_MS);},ms);}

/* ---------- Simulated $FORGE: treasury buyback & burn (preview, not a real token) ---------- */
const THINK_MS=850;
function walkWalkin(w){const r=currentRivals()[w.rival];const fromLeft=w.rival===0?Math.random()<.75:Math.random()<.25;
 const npc=spawnNpc(w.buyer.type,w.buyer.avatar,fromLeft?-6:106,80+Math.random()*12,'',npcLook(w.buyer.name));
 const ms=walkTo(npc,STALL_X[w.rival]+(Math.random()*12-6),71+Math.random()*4);
 later(()=>{applyVisit(w);mood(npc,'happy');say(npc,`✓ ◈ ${r.price}`,'rival');stallPop(w.rival,`+◈ ${r.price}`,'rival');giveBag(npc,color(r.color).hex);later(()=>exitNpc(npc,fromLeft?-8:108),800);},ms);}
function startAmbient(){if(REDUCE_MOTION||ambientOn)return;ambientOn=true;const tick=()=>{if(!ambientOn)return;if($('npcLayer').querySelectorAll('.npc.ambient').length<3)ambientStroll();later(tick,1700+Math.random()*1800,ambientTimers);};later(tick,250,ambientTimers);}
function stopAmbient(){ambientOn=false;ambientTimers.forEach(clearTimeout);ambientTimers.length=0;clearNpcs('.npc.ambient');}
function ambientStroll(){const types=['bargain','trend','luxury'];const type=types[Math.floor(Math.random()*3)];const skin=SKINS[Math.floor(Math.random()*SKINS.length)];const fromLeft=Math.random()<.5;
 const npc=spawnNpc(type,skin,fromLeft?-6:106,80+Math.random()*12,'ambient');
 if(Math.random()<.45){exitNpc(npc,fromLeft?108:-8,ambientTimers,14);return;}
 const stop=['0','you','1'][Math.floor(Math.random()*3)];const ms=walkTo(npc,STALL_X[stop]+(Math.random()*10-5),71+Math.random()*4,ambientTimers,14);
 later(()=>{if(Math.random()<.5){mood(npc,'happy',1100,ambientTimers);}if(Math.random()<.5)say(npc,['Just looking','Nice colours!','Hmm…','Ooh!'][Math.floor(Math.random()*4)],'',1100,ambientTimers);later(()=>exitNpc(npc,fromLeft?108:-8,ambientTimers,14),1300,ambientTimers);},ms,ambientTimers);}
function revealTown(){const el=$('townStage');const r=el.getBoundingClientRect();if(r.top<0||r.bottom>window.innerHeight)el.scrollIntoView({block:r.height<window.innerHeight?'center':'start',behavior:REDUCE_MOTION?'auto':'smooth'});}
function bindTown(){$('skipSales').onclick=skipSales;$('upgradeGrid').addEventListener('click',e=>{const b=e.target.closest('[data-upgrade]');if(b&&!b.disabled)buyUpgrade(b.dataset.upgrade);});$('moveButtons').addEventListener('click',e=>{const b=e.target.closest('[data-move]');if(b&&!b.disabled)useMove(b.dataset.move);});document.addEventListener('visibilitychange',()=>{if(document.hidden&&session)skipSales();});}
function spawnNext(){if(!session||session.done)return;session.spawning=false;if(session.qi>=session.queue.length)return;
 const item=session.queue[session.qi++];
 if(item.visitor){const plan=planVisit(item.visitor,session.asset,session.report,session.rng,session.rivalRng);session.plans.push(plan);walkVisitor(plan);if(!session.event.active&&session.visitorCount>=session.event.at)triggerEvent();}
 else{session.plans.push(item);walkWalkin(item);}
 renderLiveActions();
 if(session.qi<session.queue.length){session.spawning=true;later(spawnNext,item.visitor?SPAWN_MS:SPAWN_MS*.4);}}
function ensureSpawning(){if(session&&!session.spawning&&session.qi<session.queue.length){session.spawning=true;later(spawnNext,SPAWN_MS);}}
// Effects of your live moves and the town event on the next shopper.
function liveMods(buyer){const s=session;const n=s.visitorCount;let priceMult=1,bonus=0,satAdd=0;
 if(s.flash&&n<s.flash.until)priceMult=.8;
 if(s.hype&&n<s.hype.until)bonus+=buyer.type==='trend'?.18:.12;
 const ev=s.event;if(ev.active){
  if(ev.id==='rain')bonus+=run.design.material==='waterproof'?.22:-.06;
  if(ev.id==='influencer'&&n<ev.until)bonus+=trendFit(run.design)>=.6?.2:-.08;
  if(ev.id==='heat')bonus+=run.design.template==='jacket'?-.15:.1;
  if(ev.id==='pricecut'&&currentRivals()[ev.rival].template===run.design.template)satAdd+=.08;}
 return {priceMult,bonus,satAdd};}
function rivalView(i){const r=currentRivals()[i];const cut=session&&session.event.active&&session.event.id==='pricecut'&&session.event.rival===i;return cut?{...r,price:Math.round(r.price*.75)}:r;}
function triggerEvent(silent=false){const s=session;const ev=s.event;const def=TOWN_EVENTS.find(e=>e.id===ev.id);ev.active=true;s.report.event={id:ev.id,title:def.title,icon:def.icon,rival:ev.rival};
 let desc=def.desc;
 if(ev.id==='pricecut'){const r=currentRivals()[ev.rival];desc=`${r.shop} cut prices by 25% for the rest of the day.`;s.report.event.title=`Price cut at ${r.shop}!`;setText('stallPrice-'+ev.rival,'◈ '+rivalView(ev.rival).price);$('stall-'+ev.rival).classList.add('on-sale');}
 if(ev.id==='influencer')ev.until=s.visitorCount+4;
 if(ev.id==='bus'){const extra=['luxury','luxury','trend','bargain'].map((t,k)=>{const b=getBuyer(t,40+k,s.eventRng);b.wallet=Math.round(b.wallet*1.2);return {visitor:b};});s.queue.splice(s.qi,0,...extra);s.report.wallets.push(...extra.map(x=>x.visitor.wallet));ensureSpawning();}
 if(ev.id==='rain')$('marketScene').classList.add('raining');
 if(ev.id==='heat')$('marketScene').classList.add('heatwave');
 s.report.event.desc=desc;
 addNotice(`${def.icon} ${s.report.event.title}`,desc);
 if(!silent)showBanner(`${def.icon} ${s.report.event.title}`,desc);}
function useMove(id){const s=session;if(!s||s.done)return;
 if(id==='flash'&&!s.flash){s.flash={until:s.visitorCount+6};s.report.moves.flash={visits:0,sold:0,price:Math.round(run.design.price*.8)};$('stall-you').classList.add('on-sale');setText('stallPrice-you','◈ '+s.report.moves.flash.price);addNotice('⚡ Flash sale!',`20% off for the next 6 shoppers (◈ ${s.report.moves.flash.price}).`);showBanner('⚡ Flash sale!','20% off for the next 6 shoppers');}
 if(id==='hype'&&!s.hype&&run.cash>=HYPE_COST){run.cash-=HYPE_COST;s.report.cost+=HYPE_COST;s.report.hypeBurn=burnCoins(HYPE_COST/2);run.treasury+=HYPE_COST/2;renderToken(true);s.hype={until:s.visitorCount+6};s.report.moves.hype={visits:0,sold:0,cost:HYPE_COST,extra:2};
  const extra=[0,1].map(k=>({visitor:getBuyer(['trend','bargain','luxury'][Math.floor(s.eventRng()*3)],50+k,s.eventRng)}));s.queue.splice(s.qi,0,...extra);s.report.wallets.push(...extra.map(x=>x.visitor.wallet));ensureSpawning();
  $('stall-you').classList.add('hyped');renderTop();addNotice('📣 Hype it up!','Your stall is buzzing: 2 extra shoppers and more interest for the next 6.');showBanner('📣 Your stall is buzzing!','2 extra shoppers are on their way');}
 if(id==='restock'&&!s.restocked){const unit=restockUnitCost();const cost=unit*RESTOCK_UNITS;if(run.cash<cost)return;run.cash-=cost;s.report.cost+=cost;s.asset.qty+=RESTOCK_UNITS;s.asset.remaining+=RESTOCK_UNITS;s.restocked=true;s.report.moves.restock={units:RESTOCK_UNITS,cost};
  renderTop();renderShelf();setText('stallStock',s.asset.qty-s.asset.sold);stallPop('you',`+${RESTOCK_UNITS} 📦`,'clear');addNotice('📦 Rush restock',`${RESTOCK_UNITS} more made at ◈ ${unit} each.`);}
 renderLiveActions();}
function restockUnitCost(){const a=session?session.asset:null;return a?Math.round(a.unitCost*1.3):0;}
function renderLiveActions(){const box=$('liveActions');const s=session;box.classList.toggle('hidden',!s||s.done);if(!s||s.done)return;
 const left=n=>Math.max(0,n-s.visitorCount);
 const unit=restockUnitCost();const restockCost=unit*RESTOCK_UNITS;
 const btn=(id,icon,title,sub,state,disabled)=>`<button type="button" class="move-button ${state}" data-move="${id}" ${disabled?'disabled':''}><span class="move-icon">${icon}</span><span><strong>${title}</strong><small>${sub}</small></span></button>`;
 if(s.flash&&!left(s.flash.until)&&$('stall-you').classList.contains('on-sale')){$('stall-you').classList.remove('on-sale');setText('stallPrice-you','◈ '+run.design.price);}
 if(s.hype&&!left(s.hype.until))$('stall-you').classList.remove('hyped');
 const flashSub=s.flash?(left(s.flash.until)?`On now · ${left(s.flash.until)} shoppers left`:'Used this round'):`20% off for the next 6 shoppers`;
 const hypeSub=s.hype?(left(s.hype.until)?`Buzzing · ${left(s.hype.until)} shoppers left`:'Used this round'):`◈ ${HYPE_COST} · 2 extra shoppers + more interest`;
 const restockSub=s.restocked?'Used this round':`+${RESTOCK_UNITS} items at ◈ ${unit} each`;
 $('moveButtons').innerHTML=
  btn('flash','⚡','Flash sale',flashSub,s.flash?(left(s.flash.until)?'active':'used'):'',!!s.flash)+
  btn('hype','📣','Hype it up',hypeSub,s.hype?(left(s.hype.until)?'active':'used'):'',!!s.hype||run.cash<HYPE_COST)+
  btn('restock','📦','Rush restock',restockSub,s.restocked?'used':'',s.restocked||run.cash<restockCost);}
function clearTownEffects(){['stall-you','stall-0','stall-1'].forEach(id=>$(id).classList.remove('on-sale','hyped'));$('marketScene').classList.remove('raining','heatwave');$('eventBanner').classList.add('hidden');}
function setHint(text){setText('liveHint',text);}
function smartHint(){const s=session;if(!s)return;const r=s.recent;const count=c=>r.filter(x=>x===c).length;const a=s.asset;
 if(!s.restocked&&a.remaining<=1&&s.qi<s.queue.length)setHint('You’re almost sold out. A rush restock keeps sales coming.');
 else if(!s.flash&&count('price')>=2)setHint('Shoppers keep saying it’s too pricey. Try a flash sale.');
 else if(!s.hype&&(count('trend')+count('unsure'))>=2)setHint('Shoppers aren’t convinced. Hype it up to win them over.');
 else if(count('buy')>=3)setHint('Your stall is on a roll!');}
function addNotice(title,text){run.feed.unshift({notice:true,title,message:text});run.feed.length=Math.min(run.feed.length,12);renderFeed();}
function showBanner(title,text){const b=$('eventBanner');b.innerHTML=`<strong>${htmlEscape(title)}</strong><span>${htmlEscape(text)}</span>`;b.classList.remove('hidden','show');void b.offsetWidth;b.classList.add('show');later(()=>b.classList.add('hidden'),2800);}
function movesPanel(report){const m=report.moves;const rows=[];
 if(report.event)rows.push(`<li><b>${htmlEscape(report.event.icon+' '+report.event.title)}</b> ${htmlEscape(report.event.desc)}</li>`);
 if(m.flash)rows.push(`<li><b>⚡ Flash sale</b> ${m.flash.sold} sold to ${m.flash.visits} shoppers at ◈ ${m.flash.price}.</li>`);
 if(m.hype)rows.push(`<li><b>📣 Hype</b> ${m.hype.sold} of ${m.hype.visits} shoppers bought during the buzz (◈ ${m.hype.cost}, +${m.hype.extra} extra shoppers).</li>`);
 if(m.restock)rows.push(`<li><b>📦 Rush restock</b> +${m.restock.units} items for ◈ ${m.restock.cost}.</li>`);
 if(!m.flash&&!m.hype&&!m.restock)rows.push('<li><b>No moves used.</b> Next round, try a flash sale when shoppers say “too pricey”, or hype your stall when they hesitate.</li>');
 const mm=report.memo||{};
 if(mm.fan)rows.push(`<li><b>♥ Fans</b> ${mm.fan.visits} shopper${mm.fan.visits===1?'':'s'} who loved your work came back; ${mm.fan.bought} bought again.</li>`);
 if(mm.wary)rows.push(`<li><b>💔 Wary shoppers</b> ${mm.wary.visits} still remember a purchase they regretted; ${mm.wary.bought} gave you another chance.</li>`);
 if(report.copySales)rows.push(`<li><b>📋 Copycat royalties</b> Your copied design sold ${report.copySales} times across the street, earning you ◈ ${money(report.royaltiesIn)}.</li>`);
 if(report.copiedBy)rows.push(`<li><b>📋 You’ve been copied!</b> ${htmlEscape(report.copiedBy.shop)} will sell your design next round at ◈ ${report.copiedBy.price}. You earn 7% of every copy, but making the same thing again means competing with your own copy.</li>`);
 if(report.fightBack)rows.push(`<li><b>📉 Rivals fight back</b> You out-sold ${htmlEscape(report.fightBack.join(' and '))}. Next round they’ll undercut your prices and draw extra regulars.</li>`);
 if(report.buyback)rows.push(`<li><b>🔥 Buyback &amp; burn</b> The town treasury bought back ${fmtTok(report.buyback.tokens)} $FORGE with ◈ ${money(report.buyback.coins)} and burned it${report.hypeBurn?`, plus ${fmtTok(report.hypeBurn)} burned from your hype`:''}. Price ${report.tokenMove.after>=report.tokenMove.before?'▲':'▼'} ${Math.abs((report.tokenMove.after/report.tokenMove.before-1)*100).toFixed(1)}%.</li>`);
 return `<div class="moves-panel"><h4>Your moves, regulars &amp; rivals</h4><ul>${rows.join('')}</ul></div>`;}
function currentRivals(round=run.round){const base=TRENDS[round].rivals;const o=run.rivalCopies&&run.rivalCopies[round];const tac=run.rivalTactics&&run.rivalTactics[round];
 return base.map((r,i)=>{let x=o&&o[i]?{...r,...o[i]}:r;if(tac&&tac[i])x={...x,price:Math.max(15,Math.round(x.price*tac[i].priceMult)),undercut:true,boost:tac[i].boost};return x;});}
function remember(name,entry){(run.memory[name]=run.memory[name]||[]).push({round:run.round,...entry});}
function pastOf(name){return (run.memory[name]||[]).filter(e=>e.round<run.round);}
// How a shopper's history with your workshop changes their mood today.
function memoryMod(buyer,d){const past=pastOf(buyer.name);if(!past.length)return {bonus:0,tag:null,line:''};
 const last=past[past.length-1];const lovedBuys=past.filter(e=>e.kind==='buy'&&e.mood==='loved').length;const prod=e=>`${color(e.color).name.toLowerCase()} ${template(e.template).name.toLowerCase()}`;
 if(last.kind==='buy'&&last.mood==='loved')return {bonus:Math.min(.22,.1+lovedBuys*.04),tag:'fan',line:`I loved the ${prod(last)} I got here!`};
 if(last.kind==='buy'&&last.mood==='regret')return {bonus:-.12,tag:'wary',line:`Not sure about that ${prod(last)} I bought last time…`};
 if(last.kind==='buy'||last.kind==='clearance')return {bonus:.06,tag:'returning',line:`Back again! My ${template(last.template).name.toLowerCase()} is holding up.`};
 if(last.kind==='rival')return {bonus:-.06,tag:'rival',line:`I usually shop at ${last.shop}, but I’ll take a look.`};
 if(last.kind==='pass'&&last.code==='price')return d.price<last.price?{bonus:.1,tag:'returning',line:`Cheaper than last time. Nice!`}:{bonus:-.04,tag:'returning',line:`Still pricey here, I bet.`};
 return {bonus:0,tag:'returning',line:`Let’s see if this one’s better than last time.`};}
function relation(name){const past=run.memory[name]||[];if(!past.length)return null;const buys=past.filter(e=>e.kind==='buy'||e.kind==='clearance');const last=past[past.length-1];
 const loved=buys.filter(e=>e.mood==='loved').length;const regret=last.kind==='buy'&&last.mood==='regret';
 if(regret)return {tag:'wary',icon:'💔',label:`Regrets the ${template(last.template).name.toLowerCase()}`,score:1,buys:buys.length};
 if(loved&&buys.length)return {tag:'fan',icon:'♥',label:`Fan · bought ${buys.length} from you`,score:4,buys:buys.length};
 if(buys.length)return {tag:'returning',icon:'☺',label:`Customer · bought ${buys.length}`,score:3,buys:buys.length};
 if(last.kind==='rival')return {tag:'rival',icon:'↗',label:`Shops at ${last.shop}`,score:0,buys:0};
 return {tag:'browser',icon:'…',label:last.code==='price'?'Thought you were too pricey':'Browsed, didn’t buy',score:2,buys:0};}
function renderTownMemory(){const people=TOWNSFOLK.map(p=>({p,rel:relation(p.name)})).filter(x=>x.rel).sort((a,b)=>b.rel.score-a.rel.score||b.rel.buys-a.rel.buys);
 const count=t=>people.filter(x=>x.rel.tag===t).length;
 setText('memoryCount',`${people.length} KNOW YOU`);
 $('townMemory').innerHTML=people.length?`<div class="memory-stats"><span class="fan">♥ ${count('fan')} fans</span><span>☺ ${count('returning')} customers</span><span class="wary">💔 ${count('wary')} wary</span><span class="rival">↗ ${count('rival')} at rivals</span></div>`+people.slice(0,6).map(({p,rel})=>`<div class="memory-row ${rel.tag}"><span class="feed-avatar" style="background:${p.skin}">${htmlEscape(p.name[0])}</span><div><strong>${htmlEscape(p.name)} <small>· ${PERSONAS[p.type].label}</small></strong><span>${rel.icon} ${htmlEscape(rel.label)}</span></div></div>`).join(''):'<p class="empty-shelf">Shoppers remember how your workshop treated them. Fans come back more eager to buy; a regretted purchase makes them wary.</p>';}
function loyalFans(){return TOWNSFOLK.filter(p=>{const r=relation(p.name);return r&&r.tag==='fan';}).length;}
function memoryRecord(plan){const b=plan.buyer;
 if(plan.kind==='buy')remember(b.name,{kind:'buy',template:plan.asset.template,material:plan.asset.material,color:plan.asset.color,price:plan.price,mood:plan.prob>=.58?'loved':plan.prob<.3?'regret':'ok'});
 else if(plan.kind==='clearance')remember(b.name,{kind:'clearance',template:plan.pick.template,color:plan.pick.color,price:plan.price,mood:'ok'});
 else if(plan.kind==='rival')remember(b.name,{kind:'rival',shop:currentRivals()[plan.rival].shop});
 else remember(b.name,{kind:'pass',code:plan.code,price:plan.offerPrice});}
// Copycats: a strong seller gets copied by a rival next round, who pays you a design royalty.
function maybeCopy(report,asset){if(run.round>=TRENDS.length-1||!asset.qty)return;const sellThrough=report.unitsSold/asset.qty;if(sellThrough<.6||report.unitsSold<4)return;
 const i=run.rivalTotals[0].revenue<=run.rivalTotals[1].revenue?0:1;const price=Math.max(15,Math.round(asset.price*.9/5)*5);
 run.rivalCopies[run.round+1]={[i]:{template:asset.template,material:asset.material,color:asset.color,price,copied:true,copiedName:asset.name}};
 report.copiedBy={shop:TRENDS[0].rivals[i].shop,price};}
function copyRoyalty(i,price,report){const r=currentRivals()[i];if(!r.copied)return;const roy=price*COPY_ROYALTY;run.cash+=roy;report.royaltiesIn=(report.royaltiesIn||0)+roy;report.copySales=(report.copySales||0)+1;renderTop();}
function npcMarkup(type,skin,hair,hairColor,extra=''){return `<span class="npc guide-npc npc-${type} hair-${hair} ${extra}" style="--hair:${hairColor};--depth:1"><span class="npc-figure"><span class="npc-hair-back"></span><span class="npc-arms"><i></i><i></i></span><span class="npc-body"></span><span class="npc-legs"><i></i><i></i></span><span class="npc-head" style="background:${skin}"><span class="npc-hair"></span><i class="eye l"></i><i class="eye r"></i><i class="cheek l"></i><i class="cheek r"></i><i class="mouth"></i></span><span class="npc-bag"></span></span></span>`;}
const GUIDE_STEPS=[
 {kicker:'STEP 1 · THE TOWN SQUARE',title:'Meet your market.',
  body:'Forgeville’s shoppers come in three kinds, and each carries their own budget. Learn what they want and you’ll know who you’re designing for.',
  visual:()=>`<div class="guide-personas">${[['bargain','#e8b18a','short','#3b2a20','Bargain hunters','Want good value. High prices scare them off.'],['trend','#b47d5f','puffs','#2b211c','Trend chasers','Want exactly this week’s look.'],['luxury','#e5c3a7','long','#5a3a26','Luxury lovers','Pay more for quality materials.']].map(([t,s,h,c,l,d])=>`<div class="guide-persona"><div class="guide-npc-wrap">${npcMarkup(t,s,h,c,'happy')}</div><strong>${l}</strong><small>${d}</small></div>`).join('')}</div>`},
 {kicker:'STEP 2 · THE DAILY GAZETTE',title:'Read the trend.',
  body:'Every round the town wants something different. The Gazette tells you which products, materials and colours are hot. Your trend-match meter shows how close your design is.',
  visual:()=>`<div class="guide-trend"><span class="tag">☔ Weatherproof</span><span class="tag">Bold blues</span><span class="tag">Everyday carry</span><div class="trend-meter"><span>TREND MATCH</span><strong>100%</strong><div class="meter"><span style="width:100%"></span></div></div></div>`},
 {kicker:'STEP 3 · YOUR WORKSHOP',title:'Design, price, produce.',
  body:'Pick a product, material and colour, set a price and choose how many to make. Better materials cost more to produce, and you pay for the whole batch up front, so don’t overmake.',
  visual:()=>`<div class="guide-products">${MATERIALS.map((m,i)=>`<div><span>${makeProductSvg({template:['jacket','tote','sneakers','cap'][i],material:m.id,color:['cobalt','moss','coral','amber'][i]})}</span><small>${m.name}</small></div>`).join('')}</div>`},
 {kicker:'STEP 4 · MARKET DAY',title:'Open your stall and make moves.',
  body:'Shoppers walk up to your stall and buy or tell you why they passed. You can step in once each per round, and watch for a surprise town event like a downpour or a rival’s price cut.',
  visual:()=>`<div class="guide-moves"><div><b>⚡</b><strong>Flash sale</strong><small>20% off for the next 6 shoppers</small></div><div><b>📣</b><strong>Hype it up</strong><small>◈ ${HYPE_COST} for extra shoppers and interest</small></div><div><b>📦</b><strong>Rush restock</strong><small>Make ${RESTOCK_UNITS} more mid-round</small></div></div>`},
 {kicker:'STEP 5 · THE TOWN REMEMBERS',title:'Earn regulars. Watch the copycats.',
  body:'Shoppers remember you. Fans come back keener to buy, and a regretted purchase makes them wary. Sell a hit and a rival copies it next round, but you earn a 7% royalty on every copy.',
  visual:()=>`<div class="guide-memory"><div class="guide-npc-wrap fan">${npcMarkup('luxury','#e5c3a7','long','#5a3a26','happy')}<span>“I loved the storm blue jacket I got here!”</span></div><div class="guide-copy"><span class="copy-tag">COPY</span> Wren &amp; Co. sells your design · <b>+7% to you</b></div></div>`},
 {kicker:'STEP 6 · FIVE ROUNDS',title:'Win the season.',
  body:'Five market days. Between rounds, spend profit on workshop upgrades. Rivals you out-sell will fight back with lower prices. Earn up to 3 stars: top the standings, reach ◈ 2,000 workshop value and win 12 loyal fans.',
  visual:()=>`<div class="guide-standings"><div class="you"><span>1</span>Your workshop<b>◈ 2,239</b></div><div><span>2</span>Pip Studio<b>◈ 1,620</b></div><div><span>3</span>Wren &amp; Co.<b>◈ 1,401</b></div></div><p class="guide-fineprint">Coins, design cards, royalties, the treasury and $FORGE are simulated in your browser. No real tokens, NFTs or wallets.</p>`},
];
let guideStep=0;
function renderGuide(){const s=GUIDE_STEPS[guideStep];const last=guideStep===GUIDE_STEPS.length-1;const root=$('modalRoot');
 root.innerHTML=`<div class="modal-card guide-card" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><button type="button" class="close-modal" id="modalClose" aria-label="Close guide">✕</button><span class="eyebrow">${s.kicker}</span><h2 id="modalTitle">${s.title}</h2><div class="guide-visual">${s.visual()}</div><p>${s.body}</p><div class="guide-nav"><button type="button" class="outline-button" id="guideBack" ${guideStep===0?'disabled':''}>← Back</button><div class="guide-dots">${GUIDE_STEPS.map((_,i)=>`<button type="button" class="guide-dot ${i===guideStep?'on':''}" data-step="${i}" aria-label="Step ${i+1}"></button>`).join('')}</div><button type="button" class="main-cta guide-next" id="guideNext">${last?'Start designing':'Next'} <span>→</span></button></div></div>`;
 $('modalClose').onclick=closeModal;$('guideBack').onclick=()=>{if(guideStep>0){guideStep--;renderGuide();}};$('guideNext').onclick=()=>{if(last){closeModal();if(run.mode==='design')$('designControls').scrollIntoView({block:'start',behavior:'smooth'});return;}guideStep++;renderGuide();};
 root.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>{guideStep=Number(b.dataset.step);renderGuide();});$('guideNext').focus();}
function markGuideSeen(){$('howToPlay').classList.remove('nudge');try{localStorage.setItem('forgeville-guide-seen','1')}catch(e){}}
function nudgeGuide(){let seen=false;try{seen=localStorage.getItem('forgeville-guide-seen')==='1'}catch(e){}if(!seen)$('howToPlay').classList.add('nudge');}
function matCost(m){return hasUpgrade('loom')?Math.round(m.cost*.7):m.cost;}
function hasUpgrade(id){return !!(run&&run.upgrades&&run.upgrades[id]);}
function upgradeValue(){return UPGRADES.filter(u=>hasUpgrade(u.id)).reduce((s,u)=>s+u.cost,0);}
function buyUpgrade(id){const u=UPGRADES.find(x=>x.id===id);if(!u||run.mode!=='design'||hasUpgrade(id)||run.cash<u.cost)return;
 run.cash-=u.cost;run.upgrades[id]=true;run.treasury+=u.cost*.2;renderTop();renderUpgrades();renderControls();renderTrend();renderGoals();
 addNotice(`${u.icon} ${u.name} installed`,u.desc);}
function renderUpgrades(){const box=$('upgradePanel');const show=run.mode==='design'&&run.round>0;box.classList.toggle('hidden',!show);if(!show)return;
 $('upgradeGrid').innerHTML=UPGRADES.map(u=>{const own=hasUpgrade(u.id);const can=run.cash>=u.cost;return `<button type="button" class="upgrade-card ${own?'owned':''}" data-upgrade="${u.id}" ${own||!can?'disabled':''}><span class="upgrade-icon">${u.icon}</span><strong>${u.name}</strong><small>${u.desc}</small><b>${own?'✓ Installed':`◈ ${u.cost}`}</b></button>`;}).join('');}

/* ---------- Season goals and the final verdict ---------- */
const SEASON_GOAL=2000;const FAN_GOAL=12;
function workshopValue(){return run.cash+run.stock.reduce((s,x)=>s+x.remaining*x.unitCost*.4,0)+upgradeValue();}
function seasonRank(){const board=[{you:true,rev:run.playerRevenue},...run.rivalTotals.map(r=>({rev:r.revenue}))].sort((a,b)=>b.rev-a.rev);return board.findIndex(r=>r.you)+1;}
function seasonGoals(){const rank=seasonRank();const value=workshopValue();const fans=loyalFans();
 return [{ok:rank===1,label:'Top the season standings',now:`#${rank} of 3`},{ok:value>=SEASON_GOAL,label:`Workshop value ◈ ${SEASON_GOAL.toLocaleString()}`,now:`◈ ${Math.round(value).toLocaleString()}`},{ok:fans>=FAN_GOAL,label:`${FAN_GOAL} loyal fans`,now:`${fans} fans`}];}
function renderGoals(){const g=seasonGoals();$('seasonGoals').innerHTML=`<div class="standings-title"><span>SEASON GOALS · EARN 3 STARS</span><span>${g.filter(x=>x.ok).length} ★</span></div>`+g.map(x=>`<div class="goal-row ${x.ok?'ok':''}"><span>${x.ok?'★':'☆'}</span><strong>${x.label}</strong><small>${x.now}</small></div>`).join('');}
function verdictHtml(){const g=seasonGoals();const stars=g.filter(x=>x.ok).length;
 const titles=['Back to the drawing board','Getting by','Rising workshop','Master of Forgeville'];const icons=['🪡','🥉','🥈','🏆'];
 return `<div class="verdict stars-${stars}"><span class="verdict-icon">${icons[stars]}</span><div class="verdict-stars">${'★'.repeat(stars)}${'☆'.repeat(3-stars)}</div><h4>${titles[stars]}</h4><div class="verdict-goals">${g.map(x=>`<div class="${x.ok?'ok':''}">${x.ok?'★':'☆'} ${x.label} <small>${x.now}</small></div>`).join('')}</div></div>`;}

/* ---------- Rivals fight back ---------- */
// A rival you out-earned this round undercuts you next round and draws extra regulars.
function rivalsReact(report){if(run.round>=TRENDS.length-1)return;const mine=report.gross+report.clearanceSales;const tac={};const who=[];
 report.rivalRevenue.forEach((rev,i)=>{if(mine>rev){tac[i]={priceMult:.86,boost:4};who.push(TRENDS[0].rivals[i].shop);}});
 if(who.length){run.rivalTactics[run.round+1]=tac;report.fightBack=who;}}

/* ---------- Shoppers think out loud before deciding ---------- */
function thoughtFor(plan){const b=plan.buyer;const p=plan.offerPrice;const d=run.design;const short=s=>s.split(' ')[0];
 if(p>b.wallet)return `◈${p}? My budget’s ◈${b.wallet}…`;
 if(plan.memoTag==='fan')return 'Loved my last one here…';
 if(plan.memoTag==='wary')return 'Last one let me down…';
 if(plan.inFlash)return '20% off? Tempting…';
 const rv=currentRivals().find(r=>r.template===d.template&&r.price<p);if(rv)return `${short(rv.shop)} has one for ◈${rv.price}…`;
 if(b.type==='bargain')return p<=40?`◈${p}… what a steal!`:`◈${p} is a lot for me…`;
 if(b.type==='trend')return trendFit(d)>=.6?'That’s this week’s look!':'Is that even in style?';
 return quality(d)>=.8?`${material(d.material).name}… fine finish`:`${material(d.material).name}? Bit basic…`;}
function newToken(){return {c:600,t:600000,supply:1000000,burned:0,history:[600/600000],fromYou:0};}
function tokenPrice(){return run.token.c/run.token.t;}
// Buy $FORGE from the pool with coins and burn it (constant-product pool).
function burnCoins(coins,fromYou=true){const k=run.token;if(coins<=0)return 0;const out=k.t-(k.c*k.t)/(k.c+coins);k.c+=coins;k.t-=out;k.supply-=out;k.burned+=out;if(fromYou)k.fromYou+=out;return out;}
function tokenRound(report,seed){const k=run.token;const before=tokenPrice();const spend=Math.round(run.treasury*.5*10)/10;
 if(spend>0){const out=burnCoins(spend);run.treasury-=spend;report.buyback={coins:spend,tokens:out};}
 const rng=randomGenerator(seed^0x27d4eb2f);const sell=k.t*(.01+rng()*.03);const coinsOut=k.c-(k.c*k.t)/(k.t+sell);k.t+=sell;k.c-=coinsOut;
 k.history.push(tokenPrice());report.tokenMove={before,after:tokenPrice()};renderToken(true);}
function fmtTok(n){return n>=1e6?(n/1e6).toFixed(2)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':Math.round(n).toString();}
function renderToken(flash=false){const k=run.token;const p=tokenPrice();const start=k.history[0];const ch=(p/start-1)*100;
 const h=k.history;const max=Math.max(...h),min=Math.min(...h);const pts=h.map((v,i)=>`${h.length>1?(i/(h.length-1)*100).toFixed(1):50},${(28-(max===min?14:(v-min)/(max-min)*24)-2).toFixed(1)}`).join(' ');
 $('tokenPanel').innerHTML=`<div class="token-head"><span>$FORGE PRICE</span><strong>◈ ${p.toFixed(5)}</strong><em class="${ch>=0?'up':'down'}">${ch>=0?'▲':'▼'} ${Math.abs(ch).toFixed(1)}%</em></div><svg class="token-spark" viewBox="0 0 100 30" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="${ch>=0?'#3d8a5f':'#a45a51'}" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg><div class="token-stats"><div><span>🔥 Burned</span><b>${fmtTok(k.burned)}</b><small>${(k.burned/1e6*100).toFixed(2)}% of supply</small></div><div><span>Your activity burned</span><b>${fmtTok(k.fromYou)}</b><small>via hype &amp; buybacks</small></div></div>`;
 if(flash){const el=$('tokenPanel');el.classList.remove('burning');void el.offsetWidth;el.classList.add('burning');}}
resetGame();bind();bindTown();nudgeGuide();
