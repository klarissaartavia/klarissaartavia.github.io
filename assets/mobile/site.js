(function(){if(!window.__kaMobile)return;

const menu=document.querySelector('#menu'),opener=document.querySelector('.menu-button');
opener.addEventListener('click',()=>{menu.showModal();opener.setAttribute('aria-expanded','true');document.body.style.overflow='hidden'});
function closeMenu(){menu.close();opener.setAttribute('aria-expanded','false');document.body.style.overflow=''}
document.querySelector('.close').addEventListener('click',closeMenu);menu.addEventListener('cancel',()=>{opener.setAttribute('aria-expanded','false');document.body.style.overflow=''});menu.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',closeMenu));
document.querySelectorAll('[data-es]').forEach(e=>e.dataset.en=e.innerHTML);
function applyMobileLanguage(lang){
document.documentElement.lang=lang;
document.querySelectorAll('[data-es]').forEach(e=>e.innerHTML=e.dataset[lang]);
document.querySelectorAll('[data-lang]').forEach(e=>e.setAttribute('aria-pressed',e.dataset.lang===lang?'true':'false'));
try{localStorage.setItem('ka-lang',lang)}catch(e){}
updateCarouselControl();
}
document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>applyMobileLanguage(b.dataset.lang)));

document.fonts.ready.then(()=>{if(location.hash){const target=document.getElementById(location.hash.slice(1));if(target)target.scrollIntoView({behavior:'instant',block:'start'})}});

const carousel=document.querySelector('.tools-carousel'),carouselToggle=document.querySelector('.carousel-toggle');
function updateCarouselControl(){const paused=carousel.dataset.paused==='true',es=document.documentElement.lang==='es';carouselToggle.setAttribute('aria-pressed',String(paused));carouselToggle.setAttribute('aria-label',es?(paused?'Reanudar carrusel de herramientas':'Pausar carrusel de herramientas'):(paused?'Resume tool carousel':'Pause tool carousel'));carouselToggle.querySelector('.carousel-state').textContent=es?(paused?'Continuar':'Pausar'):(paused?'Resume':'Pause');carouselToggle.querySelector('.carousel-icon').textContent=paused?'▷':'Ⅱ'}
carouselToggle.addEventListener('click',()=>{carousel.dataset.paused=String(carousel.dataset.paused!=='true');updateCarouselControl()});
document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',updateCarouselControl));
new IntersectionObserver(entries=>{carousel.dataset.visible=String(entries[0].isIntersecting)},{threshold:0}).observe(carousel);

let initialLang;try{initialLang=localStorage.getItem('ka-lang')}catch(e){}
if(initialLang!=='en'&&initialLang!=='es')initialLang=(navigator.language||'en').toLowerCase().startsWith('es')?'es':'en';
applyMobileLanguage(initialLang);
const hashAliases={clients:'client-work',linkedin:'about',stack:'stack'};
function openMobileAnchor(){let id=location.hash.slice(1);id=hashAliases[id]||id;const target=document.getElementById(id);if(target){if(target.tagName==='DETAILS')target.open=true;requestAnimationFrame(()=>target.scrollIntoView({behavior:'instant',block:'start'}))}}
addEventListener('hashchange',openMobileAnchor);document.fonts.ready.then(openMobileAnchor);

})();
