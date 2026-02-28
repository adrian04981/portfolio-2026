import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ============================================
   PARTICLE SYSTEM
   ============================================ */
class Particle {
  constructor(canvas) {
    this.canvas = canvas;
    this.reset();
  }

  reset() {
    this.x = Math.random() * this.canvas.width;
    this.y = Math.random() * this.canvas.height;
    this.size = Math.random() * 2 + 0.5;
    this.speedX = (Math.random() - 0.5) * 0.8;
    this.speedY = (Math.random() - 0.5) * 0.8;
    this.opacity = Math.random() * 0.5 + 0.1;
  }

  update(mouse) {
    this.x += this.speedX;
    this.y += this.speedY;

    // Mouse interaction
    if (mouse.x !== null && mouse.y !== null) {
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        const force = (120 - dist) / 120;
        this.x += (dx / dist) * force * 2;
        this.y += (dy / dist) * force * 2;
      }
    }

    // Bounds
    if (this.x < 0 || this.x > this.canvas.width) this.speedX *= -1;
    if (this.y < 0 || this.y > this.canvas.height) this.speedY *= -1;
    this.x = Math.max(0, Math.min(this.canvas.width, this.x));
    this.y = Math.max(0, Math.min(this.canvas.height, this.y));
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 212, 255, ${this.opacity})`;
    ctx.fill();
  }
}

function initParticles() {
  const canvas = document.getElementById('particlesCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const particles = [];
  const mouse = { x: null, y: null };
  const isMobile = window.innerWidth < 768;
  const particleCount = isMobile ? 40 : 80;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle(canvas));
  }

  canvas.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  canvas.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update & draw particles
    particles.forEach(p => {
      p.update(mouse);
      p.draw(ctx);
    });

    // Connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 212, 255, ${0.08 * (1 - dist / 150)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }
  animate();
}

/* ============================================
   CURSOR GLOW
   ============================================ */
function initCursorGlow() {
  if (window.innerWidth < 768) return;
  const glow = document.getElementById('cursorGlow');
  if (!glow) return;

  let glowX = 0, glowY = 0;
  let currentX = 0, currentY = 0;

  document.addEventListener('mousemove', (e) => {
    glowX = e.clientX;
    glowY = e.clientY;
    glow.classList.add('active');
  });

  function updateGlow() {
    currentX += (glowX - currentX) * 0.1;
    currentY += (glowY - currentY) * 0.1;
    glow.style.left = currentX + 'px';
    glow.style.top = currentY + 'px';
    requestAnimationFrame(updateGlow);
  }
  updateGlow();
}

/* ============================================
   TYPING EFFECT
   ============================================ */
function initTypingEffect() {
  const el = document.getElementById('heroTitle');
  if (!el) return;
  const titles = [
    'Analista de TI',
    'DevOps & CI/CD',
    'Infraestructura Cloud',
    'Integración SAP',
    'Automatización de Procesos'
  ];
  let titleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function type() {
    const current = titles[titleIndex];

    if (isDeleting) {
      el.textContent = current.substring(0, charIndex - 1);
      charIndex--;
    } else {
      el.textContent = current.substring(0, charIndex + 1);
      charIndex++;
    }

    let speed = isDeleting ? 40 : 80;

    if (!isDeleting && charIndex === current.length) {
      speed = 2000;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      titleIndex = (titleIndex + 1) % titles.length;
      speed = 500;
    }

    setTimeout(type, speed);
  }

  // Delay start until hero animation is done
  setTimeout(type, 2000);
}

/* ============================================
   HERO ANIMATIONS
   ============================================ */
function initHeroAnimations() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.to('.hero-badge', { opacity: 1, y: 0, duration: 0.8 }, 0.3)
    .to('.hero-line', { opacity: 1, y: 0, duration: 0.9, stagger: 0.15 }, 0.5)
    .to('.hero-title-wrapper', { opacity: 1, y: 0, duration: 0.7 }, 1.0)
    .to('.hero-description', { opacity: 1, y: 0, duration: 0.7 }, 1.2)
    .to('.hero-cta', { opacity: 1, y: 0, duration: 0.7 }, 1.4)
    .to('.hero-stats', { opacity: 1, y: 0, duration: 0.7 }, 1.6);
}

/* ============================================
   STAT COUNTER ANIMATION
   ============================================ */
function initCounters() {
  const counters = document.querySelectorAll('.stat-number');
  counters.forEach(counter => {
    const target = parseInt(counter.dataset.target);
    ScrollTrigger.create({
      trigger: counter,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(counter, {
          duration: 2,
          ease: 'power2.out',
          onUpdate: function () {
            counter.textContent = Math.round(this.progress() * target);
          }
        });
      }
    });
  });
}

/* ============================================
   SCROLL-TRIGGERED REVEALS
   ============================================ */
function initScrollReveals() {
  // Reveal-up elements
  gsap.utils.toArray('.reveal-up').forEach(el => {
    gsap.to(el, {
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true,
      },
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out',
    });
  });

  // Reveal-text
  gsap.utils.toArray('.reveal-text').forEach(el => {
    gsap.to(el, {
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        once: true,
      },
      opacity: 1,
      y: 0,
      duration: 0.7,
      ease: 'power3.out',
    });
  });

  // Stagger timeline items
  gsap.utils.toArray('.timeline-item').forEach((item, i) => {
    const side = item.dataset.side;
    gsap.fromTo(item, {
      opacity: 0,
      x: side === 'right' ? 60 : -60,
    }, {
      scrollTrigger: {
        trigger: item,
        start: 'top 85%',
        once: true,
      },
      opacity: 1,
      x: 0,
      duration: 0.9,
      ease: 'power3.out',
      delay: i * 0.1,
    });
  });

  // Skill bar fills
  gsap.utils.toArray('.skill-bar-fill').forEach(bar => {
    ScrollTrigger.create({
      trigger: bar,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        bar.style.width = bar.dataset.width + '%';
      }
    });
  });

  // Language bar fills
  gsap.utils.toArray('.language-bar-fill').forEach(bar => {
    ScrollTrigger.create({
      trigger: bar,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        bar.style.width = bar.dataset.width + '%';
      }
    });
  });

  // Certification cards stagger
  gsap.utils.toArray('.cert-card').forEach((card, i) => {
    gsap.fromTo(card, {
      opacity: 0,
      y: 30,
      scale: 0.95,
    }, {
      scrollTrigger: {
        trigger: card,
        start: 'top 88%',
        once: true,
      },
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.6,
      ease: 'power3.out',
      delay: i * 0.08,
    });
  });
}

/* ============================================
   TIMELINE LINE FILL
   ============================================ */
function initTimelineFill() {
  const fill = document.getElementById('timelineFill');
  if (!fill) return;

  ScrollTrigger.create({
    trigger: '.timeline',
    start: 'top 60%',
    end: 'bottom 40%',
    scrub: 1,
    onUpdate: (self) => {
      fill.style.height = (self.progress * 100) + '%';
    }
  });
}

/* ============================================
   NAVBAR
   ============================================ */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const links = document.querySelectorAll('.nav-link');

  // Scroll background
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Mobile menu
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  // Smooth scroll + close mobile menu
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const target = document.querySelector(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });

  // Active link on scroll
  const sections = document.querySelectorAll('.section, .hero');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 100;
      if (window.scrollY >= top) {
        current = section.getAttribute('id');
      }
    });
    links.forEach(link => {
      link.classList.remove('active');
      if (link.dataset.section === current) {
        link.classList.add('active');
      }
    });
  });
}

/* ============================================
   MAGNETIC BUTTONS
   ============================================ */
function initMagneticButtons() {
  if (window.innerWidth < 768) return;

  document.querySelectorAll('.magnetic-btn').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0, 0)';
    });
  });
}

/* ============================================
   3D ROOM MODAL
   ============================================ */
function init3DRoomModal() {
  const openBtn = document.getElementById('open3DRoom');
  const closeBtn = document.getElementById('close3DRoom');
  const modal = document.getElementById('room3dModal');
  const overlay = document.getElementById('room3dOverlay');
  const wrapper = document.getElementById('room3dCanvasWrapper');

  if (!openBtn || !modal) return;

  let roomLoaded = false;

  function openModal() {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (!roomLoaded) {
      roomLoaded = true;
      import('./room3d.js').then((mod) => {
        mod.init3DRoom(wrapper);
      });
    }
  }

  function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

/* ============================================
   INITIALIZE
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initCursorGlow();
  initNavbar();
  initHeroAnimations();
  initTypingEffect();
  initCounters();
  initScrollReveals();
  initTimelineFill();
  initMagneticButtons();
  init3DRoomModal();
});
