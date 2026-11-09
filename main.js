const API='https://script.google.com/macros/s/AKfycbwSiV4Ek_S80sha_3bc4sVxjFnMEkFtdOE7RNqarhNhiJ1-uYYFK-zUklRQIm2CUSNKTg/exec';
const BACKDROP=['PELUNCURAN_PROGRAM.png','panjang2.png','panjang1.png'];
const P=new URLSearchParams(location.search);
const BASE=location.origin+location.pathname;
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MODE=P.get('mode')||'';
const PESERTA=!!P.get('t');

/* latar bergulir */
(function(){
  const sc=$('sc'),dots=$('dots'),n=BACKDROP.length||3;
  let idx=0,auto;
  function go(i){idx=i;sc.scrollTo({left:i*sc.clientWidth,behavior:'smooth'})}
  function start(){clearInterval(auto);auto=setInterval(()=>go((idx+1)%n),5000)}
  for(let i=0;i<n;i++){
    const d=document.createElement('div');d.className='sl s'+i;
    if(BACKDROP.length)d.style.backgroundImage='url("'+BACKDROP[i]+'")';
    sc.appendChild(d);
    const b=document.createElement('span');b.className='dd'+(i?'':' on');
    b.onclick=()=>{go(i);start()};dots.appendChild(b);
  }
  sc.addEventListener('scroll',()=>{idx=Math.round(sc.scrollLeft/sc.clientWidth);[...dots.children].forEach((d,j)=>d.classList.toggle('on',j===idx))});
  sc.addEventListener('pointerdown',()=>clearInterval(auto));
  sc.addEventListener('pointerup',start);
  start();
})();

/* kilau kaca mengikuti kursor */
document.addEventListener('pointermove',e=>{
  const g=e.target.closest&&e.target.closest('.glass');if(!g)return;
  const r=g.getBoundingClientRect();
  g.style.setProperty('--mx',(e.clientX-r.left)+'px');
  g.style.setProperty('--my',(e.clientY-r.top)+'px');
});

/* dynamic island */
let tI;
function idleText(t){$('it').textContent=t}
function island(nama,sub,ms){
  $('in').textContent=nama;$('is').textContent=sub;
  $('iav').textContent=nama.trim().charAt(0).toUpperCase();
  const e=$('isl');e.classList.add('x');clearTimeout(tI);
  tI=setTimeout(()=>e.classList.remove('x'),ms||3400);
}

/* ===== MASUK / SESI PANITIA ===== */
const SESI_KEY='sesi_absensi';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function getSesi(){
  try{const s=JSON.parse(localStorage.getItem(SESI_KEY)||'null');if(s&&s.exp>Date.now()/1000)return s}catch(e){}
  localStorage.removeItem(SESI_KEY);return null;
}
const sesiToken=()=>{const s=getSesi();return s?s.s:''};
function sesiHabis(){localStorage.removeItem(SESI_KEY);location.reload()}
function keluar(){localStorage.removeItem(SESI_KEY);location.href=BASE}
function showLogin(){$('app').hidden=true;$('login').hidden=false}
function showApp(){$('login').hidden=true;$('app').hidden=false}
function mulai(){
  const s=getSesi();
  $('who').textContent='Masuk sebagai '+s.nama;$('akun').hidden=false;
  if(MODE==='layar')runLayar();
  else if(MODE==='manual')runHP();
  else{$('sapa').textContent=s.nama;$('v-menu').hidden=false;idleText('Menu panitia')}
}
(function(){
  const btn=document.querySelector('#lf button');
  let busy=false;
  function kapal(){
    btn.style.setProperty('--dx',(btn.clientWidth/2)+'px');
    btn.classList.remove('go');void btn.offsetWidth;btn.classList.add('go');
  }
  $('lshow').addEventListener('change',()=>{$('lp').type=$('lshow').checked?'text':'password'});
  $('lf').addEventListener('submit',async e=>{
    e.preventDefault();
    if(busy)return;
    const user=$('lu').value.trim(),pass=$('lp').value;
    if(!user||!pass){$('lerr').textContent='Isi nama pengguna dan kata sandi';return}
    $('lerr').textContent='';busy=true;kapal();
    try{
      const r=await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({aksi:'login',user,pass})});
      const d=await r.json();
      if(d.ok){
        localStorage.setItem(SESI_KEY,JSON.stringify({s:d.sesi,nama:d.nama,exp:d.exp}));
        $('lp').value='';
        await sleep(650);showApp();mulai();
      }else{$('lerr').textContent=d.message||'Gagal masuk';btn.classList.remove('go')}
    }catch(err){$('lerr').textContent='Tidak bisa terhubung. Coba lagi.';btn.classList.remove('go')}
    busy=false;
  });
  $('btnKeluar').addEventListener('click',keluar);
})();

/* ===== LAYAR ACARA ===== */
function runLayar(){
  $('v-layar').hidden=false;idleText('Menyambungkan\u2026');
  let token='',sisa=0,periode=60,lastNo=null;
  function drawQR(url){
    const q=qrcode(0,'M');q.addData(url);q.make();
    const n=q.getModuleCount();let p='';
    for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))p+='M'+c+' '+r+'h1v1h-1z';
    const s=$('qr');s.setAttribute('viewBox','-2 -2 '+(n+4)+' '+(n+4));
    s.innerHTML='<path d="'+p+'" fill="#08163a"/>';
    s.classList.remove('qf');void s.getBoundingClientRect();s.classList.add('qf');
  }
  function renderList(h,prev){
    $('ls').innerHTML=h.slice(0,14).map(x=>
      '<div class="rw'+(prev!==null&&x.no>prev?' n':'')+'"><div class="av">'+esc(x.nama.trim().charAt(0).toUpperCase())+'</div>'+
      '<div style="min-width:0;flex:1"><div class="nm">'+esc(x.nama)+'</div><div class="sb">'+esc(x.kategori)+(x.instansi?' \u00b7 '+esc(x.instansi):'')+'</div></div>'+
      '<div class="tm">'+esc(x.jam)+'</div></div>').join('')||'<div style="color:var(--mut);text-align:center;padding:30px 0">Menunggu tamu pertama</div>';
  }
  function renderKat(ks,total){
    const kuota=ks.reduce((a,k)=>a+k.kuota,0);
    $('tot').textContent=total;$('totk').textContent='hadir dari '+kuota+' undangan';
    $('katList').innerHTML=ks.map(k=>{
      const p=k.kuota?Math.min(100,k.hadir/k.kuota*100):0;
      return '<div class="kr"><div class="kt"><span>'+esc(k.nama)+'</span><b>'+k.hadir+' / '+k.kuota+'</b></div><div class="bar"><i class="'+(k.hadir>k.kuota?'ov':'')+'" style="width:'+p+'%"></i></div></div>';
    }).join('');
  }
  async function poll(){
    try{
      const d=await(await fetch(API+'?action=layar&sesi='+encodeURIComponent(sesiToken()))).json();
      if(!d.ok){if(d.status==='sesi'){sesiHabis();return}idleText(d.message||'Gagal memuat');return}
      if(d.token!==token){token=d.token;drawQR(BASE+'?t='+d.token)}
      sisa=d.sisa;periode=d.periode;
      const maxNo=d.hadir.reduce((m,h)=>Math.max(m,h.no),0);
      renderList(d.hadir,lastNo);renderKat(d.kategori,d.total);
      if(lastNo!==null&&maxNo>lastNo&&d.hadir.length){
        const h=d.hadir[0];island(h.nama,h.kategori+(h.instansi?' \u00b7 '+h.instansi:''));
      }
      lastNo=Math.max(lastNo||0,maxNo);
    }catch(e){}
  }
  setInterval(()=>{
    if(sisa>0)sisa--;
    const t=Math.floor(sisa/60)+':'+String(sisa%60).padStart(2,'0');
    $('cl').textContent=t;idleText('Kode berganti '+t);
    $('cbar').style.width=(periode?sisa/periode*100:0)+'%';
  },1000);
  setInterval(poll,3000);poll();
}

/* ===== HP PESERTA / MANUAL ===== */
function devId(){
  let d=localStorage.getItem('dev');
  if(!d){d=(window.crypto&&crypto.randomUUID)?crypto.randomUUID():String(Math.random()).slice(2)+Date.now();localStorage.setItem('dev',d)}
  return d;
}
async function runHP(){
  $('v-hp').hidden=false;
  const manual=P.get('mode')==='manual';
  const hari=new Date().toLocaleDateString('sv');
  idleText(manual?'Input manual panitia':'BARISAN Sipakainge');
  if(manual)$('evt').textContent='Input manual panitia';
  const showErr=m=>{$('err').textContent=m};
  function showDone(nama,jam){
    $('form').hidden=true;$('done').hidden=false;
    $('dn').textContent=nama;$('dj').textContent='Tercatat pukul '+jam;
    island(nama,'Kehadiran tercatat');
  }
  const saved=localStorage.getItem('done_'+hari);
  if(saved&&!manual){const s=saved.split('|');showDone(s[0],s[1]);return}

  let cfg;
  try{cfg=await(await fetch(API+'?action=config')).json()}
  catch(e){$('selKat').innerHTML='<option value="">Tidak bisa terhubung</option>';showErr('Tidak bisa terhubung. Muat ulang halaman.');return}
  $('selKat').innerHTML='<option value="">Pilih kategori undangan</option>'+cfg.kategori.map(k=>'<option>'+esc(k.nama)+'</option>').join('');
  $('selKat').onchange=()=>{
    const k=cfg.kategori.find(x=>x.nama===$('selKat').value);showErr('');
    if(!k){$('instWrap').innerHTML='';return}
    $('instWrap').innerHTML=k.instansi.length
      ?'<label for="inst">Instansi</label><select id="inst"><option value="">Pilih instansi</option>'+k.instansi.map(i=>'<option>'+esc(i)+'</option>').join('')+'</select>'
      :'<label for="inst">Asal / instansi (opsional)</label><input id="inst" placeholder="MAN 1 Makassar">';
  };
  let busy=false;
  $('go').onclick=async()=>{
    if(busy)return;
    const kategori=$('selKat').value,inst=$('inst')?$('inst').value.trim():'';
    const nama=$('nama').value.trim().replace(/\s+/g,' ');
    const k=cfg.kategori.find(x=>x.nama===kategori);
    if(!k)return showErr('Pilih kategori undangan dulu');
    if(k.instansi.length&&!inst)return showErr('Pilih instansi dulu');
    if(nama.length<3)return showErr('Tulis nama lengkap');
    showErr('');busy=true;$('go').textContent='Mengirim\u2026';
    try{
      const r=await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
        body:JSON.stringify({token:P.get('t'),sesi:manual?sesiToken():'',kategori,instansi:inst,nama,device:devId()})});
      const d=await r.json();
      if(d.status==='sesi'){sesiHabis();return}
      if(d.status==='success'||d.status==='duplicate'){
        if(manual){island(nama,d.status==='success'?'Tercatat':'Sudah tercatat');$('nama').value=''}
        else{
          const jam=d.jam||new Date().toTimeString().slice(0,5);
          localStorage.setItem('done_'+hari,(d.nama||nama)+'|'+jam);
          showDone(d.nama||nama,jam);
        }
      }else showErr(d.message||'Gagal mencatat. Coba lagi.');
    }catch(e){showErr('Tidak bisa terhubung. Coba lagi.')}
    busy=false;$('go').textContent='Hadir sekarang';
  };
}

/* ===== MULAI ===== */
if(PESERTA){showApp();runHP()}
else if(getSesi()){showApp();mulai()}
else showLogin();