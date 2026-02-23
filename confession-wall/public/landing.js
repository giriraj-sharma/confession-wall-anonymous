// Landing page micro-interactions: particles + year + subtle typing effect
(function(){
  // set year
  const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();

  // simple typing fade for subtitle
  const sub = document.getElementById('hero-sub');
  if (sub){
    const full = sub.textContent;
    sub.textContent = '';
    let i = 0;
    const t = setInterval(()=>{
      sub.textContent += full[i++]||'';
      if (i >= full.length) clearInterval(t);
    }, 14);
  }

  // canvas particles (lightweight)
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, particles=[];

  function resize(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function createParticles(){
    particles = [];
    const count = Math.max(18, Math.floor((w*h)/80000));
    for (let i=0;i<count;i++){
      particles.push({
        x: Math.random()*w,
        y: Math.random()*h,
        r: 8+Math.random()*20,
        vx: (Math.random()-0.5)*0.15,
        vy: (Math.random()-0.5)*0.15,
        hue: 260 + Math.random()*80
      });
    }
  }

  function draw(){
    ctx.clearRect(0,0,w,h);
    for (const p of particles){
      p.x += p.vx; p.y += p.vy;
      if (p.x < -100) p.x = w+100; if (p.x > w+100) p.x = -100;
      if (p.y < -100) p.y = h+100; if (p.y > h+100) p.y = -100;

      const g = ctx.createRadialGradient(p.x,p.y,p.r*0.1,p.x,p.y,p.r);
      g.addColorStop(0, `hsla(${p.hue}, 95%, 60%, 0.14)`);
      g.addColorStop(0.45, `hsla(${p.hue}, 70%, 55%, 0.06)`);
      g.addColorStop(1, `rgba(10,12,24,0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    }
    requestAnimationFrame(draw);
  }

  function start(){ resize(); createParticles(); draw(); }
  window.addEventListener('resize', ()=>{ resize(); createParticles(); });
  start();
})();
