'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const slides=$$('.slide'), works=$$('[data-work]'), track=$('.hero-track'),frame=$('.hero-frame'),logo=$('.showcase-brand'),header=$('.header'),menu=$('#menu');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
let active=0,busy=false,paused=reduce.matches,timer=null,cycles=0,progressAnim=null,lastScroll=0;
const titles=works.map(w=>w.querySelector('h2').textContent);
function updateInfo(){
 $('.counter').textContent=String(active+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0');
 $('.hero-title').textContent=titles[active];
 $('.hero-title').href=$('.hero-detail').href='detail-'+(active+1)+'.html';
 $('.first-caption').innerHTML=works[active].querySelector('.work-caption').innerHTML;
 works.forEach((w,i)=>{w.hidden=i===active;w.style.order=(i-active+slides.length)%slides.length});
}
function stop(){clearTimeout(timer);timer=null;progressAnim?.cancel();}
function start(){stop();if(paused||reduce.matches||scrollY>100||document.hidden)return;progressAnim=$('.progress i').animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:4500,fill:'forwards'});timer=setTimeout(()=>change((active+1)%slides.length),4500);}
async function change(next){
 if(busy||next===active)return;busy=true;stop();
 const old=slides[active],fresh=slides[next];fresh.classList.add('active');fresh.style.zIndex='2';old.style.zIndex='1';
 const dir=cycles%4,axis=dir===1||dir===3?'Y':'X',sign=dir===3?-1:1,duration=reduce.matches?1:1100;
 const opt={duration,easing:'cubic-bezier(.6,.08,.02,.99)',fill:'forwards'};
 const a=fresh.animate([{transform:`translate${axis}(${sign*100}%)`},{transform:`translate${axis}(0)`}],opt);
 const b=fresh.querySelector('.slide-inner').animate([{transform:`translate${axis}(${-sign*50}%) scale(1.14)`},{transform:'translate(0) scale(1)'}],opt);
 const c=old.animate([{transform:'translate(0)'},{transform:`translate${axis}(${-sign*100}%)`}],opt);
 const d=old.querySelector('.slide-inner').animate([{transform:'translate(0) scale(1)'},{transform:`translate${axis}(${sign*50}%) scale(1.2)`}],opt);
 active=next;updateInfo();
 $('.hero-title').animate([{opacity:0,transform:'translateY(16px)'},{opacity:1,transform:'translateY(0)'}],{duration:reduce.matches?1:650,delay:150,fill:'both'});
 await Promise.allSettled([a.finished,b.finished,c.finished,d.finished]);
 old.classList.remove('active');[a,b,c,d].forEach(x=>x.cancel());fresh.style.zIndex='';old.style.zIndex='';busy=false;cycles++;start();
}
$('.next').addEventListener('click',()=>change((active+1)%slides.length));
$('.previous').addEventListener('click',()=>change((active-1+slides.length)%slides.length));
$('.pause').addEventListener('click',()=>{paused=!paused;$('.pause').textContent=paused?'▶':'Ⅱ';$('.pause').setAttribute('aria-label',paused?'自動切替を再開':'自動切替を停止');paused?stop():start()});
const menuTrigger=$('.menu-trigger');
function closeMenu(){menu.classList.remove('open');menu.close();document.body.style.overflow='';menuTrigger.setAttribute('aria-expanded','false');menuTrigger.focus();}
menuTrigger.addEventListener('click',()=>{menu.showModal();menu.classList.add('open');document.body.style.overflow='hidden';menuTrigger.setAttribute('aria-expanded','true');$('.close-menu').focus();});
$('.close-menu').addEventListener('click',closeMenu);menu.addEventListener('cancel',e=>{e.preventDefault();closeMenu()});
menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
let ticking=false;
function render(){
 ticking=false;const y=scrollY,h=innerHeight,w=innerWidth,progress=Math.max(0,Math.min(1,y/(h*.55)));
 const targetW=w*(w<768?.90:.80),targetH=targetW/(w<768?1.4:1.78);
 if(reduce.matches){frame.style.width='100%';frame.style.height='100%'}else{frame.style.width=(w+(targetW-w)*progress)+'px';frame.style.height=(h+(targetH-h)*progress)+'px';}
 $('.hero-caption').style.opacity=String(1-progress);$('.hero-controls').style.opacity=String(1-progress);$('.hero-notice').style.opacity=String(1-progress);$('.progress').style.opacity=String(1-progress);
 const inactive=progress>.6;$('.hero-controls').inert=inactive;$('.hero-caption').inert=inactive;
 const end=$('.showcase').getBoundingClientRect().bottom;
 logo.style.color=progress>.35?'#252722':'white';const logoOff=end<h*.6||(w<768&&y>h*.65);logo.style.opacity=logoOff?'0':'1';logo.style.visibility=logoOff?'hidden':'visible';
 logo.style.fontSize=`clamp(${w<768?95:86}px,${(w<768?23:12.5)*(1-progress*.16)}vw,360px)`;
 header.classList.toggle('scrolled',y>h*.9);header.classList.toggle('nav-hidden',y>h&&y>lastScroll+2&&!menu.open);lastScroll=y;
 if(y>100)stop();else if(!timer&&!busy)start();
 if(!reduce.matches){for(const s of $$('.about-photo,.contact')){const r=s.getBoundingClientRect(),p=Math.max(0,Math.min(1,(h-r.top)/(h+r.height)));const image=s.querySelector('img');image.style.transform=`translateY(${(p-.5)*8}%) scale(${1.06-p*.06})`;}}
}
addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(render)}},{passive:true});addEventListener('resize',render);
document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
reduce.addEventListener('change',()=>{paused=reduce.matches;stop();render();start()});
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('seen');observer.unobserve(e.target)}}),{threshold:.08});
$$('.work,.about-copy,.journal-row,.section-title').forEach(el=>{el.classList.add('reveal');observer.observe(el)});
updateInfo();render();
if(!reduce.matches&&!location.hash){document.body.classList.add('opening-run');setTimeout(()=>{document.body.classList.remove('opening-run');start()},2900)}else start();
