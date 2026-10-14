(function(){if(!window.__kaMobile)return;

const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const menu=document.querySelector('#menu'),opener=document.querySelector('.menu-button');
opener.addEventListener('click',()=>{
menu.showModal();opener.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';
menu.getBoundingClientRect();requestAnimationFrame(()=>menu.classList.add('is-open'));
});
function closeMenu(){
if(menu.dataset.closing==='true')return;
menu.dataset.closing='true';menu.classList.remove('is-open');
const finish=()=>{menu.close();delete menu.dataset.closing;opener.setAttribute('aria-expanded','false');document.body.style.overflow=''};
if(reducedMotion.matches)finish();else setTimeout(finish,220);
}
document.querySelector('.close').addEventListener('click',closeMenu);
menu.addEventListener('cancel',event=>{event.preventDefault();closeMenu()});
menu.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',closeMenu));
document.querySelectorAll('[data-es]').forEach(e=>e.dataset.en=e.innerHTML);
function applyMobileLanguage(lang){
document.documentElement.lang=lang;
document.querySelectorAll('[data-es]').forEach(e=>e.innerHTML=e.dataset[lang]);
document.querySelectorAll('[data-lang]').forEach(e=>e.setAttribute('aria-pressed',e.dataset.lang===lang?'true':'false'));
try{localStorage.setItem('ka-lang',lang)}catch(e){}
updateCarouselControl();
}
document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>applyMobileLanguage(b.dataset.lang)));


const carousel=document.querySelector('.tools-carousel'),carouselToggle=document.querySelector('.carousel-toggle');
function updateCarouselControl(){const paused=carousel.dataset.paused==='true',es=document.documentElement.lang==='es';carouselToggle.setAttribute('aria-pressed',String(paused));carouselToggle.setAttribute('aria-label',es?(paused?'Reanudar carrusel de herramientas':'Pausar carrusel de herramientas'):(paused?'Resume tool carousel':'Pause tool carousel'));carouselToggle.querySelector('.carousel-state').textContent=es?(paused?'Continuar':'Pausar'):(paused?'Resume':'Pause');carouselToggle.querySelector('.carousel-icon').innerHTML=paused?"<svg class='ui-icon ui-icon-play' viewBox='0 0 24 24' aria-hidden='true' focusable='false'><path d='m8 5 11 7-11 7z'/></svg>":"<svg class='ui-icon ui-icon-pause' viewBox='0 0 24 24' aria-hidden='true' focusable='false'><path d='M8 5v14M16 5v14'/></svg>"}
carouselToggle.addEventListener('click',()=>{carousel.dataset.paused=String(carousel.dataset.paused!=='true');updateCarouselControl()});
document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',updateCarouselControl));
new IntersectionObserver(entries=>{carousel.dataset.visible=String(entries[0].isIntersecting)},{threshold:0}).observe(carousel);

let initialLang;try{initialLang=localStorage.getItem('ka-lang')}catch(e){}
if(initialLang!=='en'&&initialLang!=='es')initialLang=(navigator.language||'en').toLowerCase().startsWith('es')?'es':'en';
applyMobileLanguage(initialLang);
const hashAliases={clients:'client-work',linkedin:'about',stack:'stack'};
function openMobileAnchor(instant=false){
let id=location.hash.slice(1);id=hashAliases[id]||id;const target=document.getElementById(id);
if(target){if(target.tagName==='DETAILS')target.open=true;requestAnimationFrame(()=>target.scrollIntoView({behavior:instant||reducedMotion.matches?'instant':'smooth',block:'start'}))}
}
addEventListener('hashchange',()=>openMobileAnchor(false));document.fonts.ready.then(()=>openMobileAnchor(true));

function setupMobileReveals(){
if(reducedMotion.matches||!('IntersectionObserver' in window))return;
const hero=document.querySelectorAll('.availability,.hero-stage,.intro,.cta-row,.metrics,.client-strip');
hero.forEach((el,i)=>el.style.setProperty('--reveal-delay',Math.min(i*65,260)+'ms'));
const targets=new Set([...hero,...document.querySelectorAll('main .content>.section-top,main .content>h2,.section-intro,.project,.outcome,.mobile-expand,.tools-carousel,.linkedin-link,.contact-box')]);
const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target)}
}),{threshold:0,rootMargin:'0px 0px -24px 0px'});
targets.forEach(el=>el.classList.add('mobile-reveal'));
document.body.classList.add('motion-ready');
document.body.getBoundingClientRect();
document.body.classList.add('motion-active');
targets.forEach(el=>revealObserver.observe(el));
reducedMotion.addEventListener('change',event=>{if(event.matches){document.body.classList.remove('motion-ready');revealObserver.disconnect();targets.forEach(el=>el.classList.add('is-visible'))}else setupMobileReveals()},{once:true});
}
setupMobileReveals();

})();
