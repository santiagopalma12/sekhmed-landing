/* ===================================
   CoronerIA / Sekhmed Landing Page
   JavaScript - Animations & Interactivity
   =================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Initialize all modules
    initHeader();
    initMobileMenu();
    initScrollAnimations();
    initCounterAnimations();
    initImpactBars();
    initParticles();
    initSmoothScroll();
});

/* ===== Header Scroll Effect ===== */
function initHeader() {
    const header = document.getElementById('header');
    if (!header) return;

    let lastScroll = 0;
    const scrollThreshold = 50;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        // Add/remove scrolled class
        if (currentScroll > scrollThreshold) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    }, { passive: true });
}

/* ===== Mobile Menu ===== */
function initMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const nav = document.getElementById('nav');
    
    if (!menuBtn || !nav) return;

    menuBtn.addEventListener('click', () => {
        nav.classList.toggle('active');
        const icon = menuBtn.querySelector('i');
        if (nav.classList.contains('active')) {
            icon.setAttribute('data-lucide', 'x');
        } else {
            icon.setAttribute('data-lucide', 'menu');
        }
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    });

    // Close menu when clicking a link
    nav.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('active');
            const icon = menuBtn.querySelector('i');
            icon.setAttribute('data-lucide', 'menu');
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        });
    });
}

/* ===== Scroll Animations (Intersection Observer) ===== */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    if (animatedElements.length === 0) return;

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add staggered delay based on sibling index
                const delay = index * 100;
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delay);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animatedElements.forEach(el => observer.observe(el));
}

/* ===== Animated Counters ===== */
function initCounterAnimations() {
    const counters = document.querySelectorAll('[data-count]');
    
    if (counters.length === 0) return;

    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    counters.forEach(counter => observer.observe(counter));
}

function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-count'), 10);
    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;
    const increment = target / steps;
    
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
        step++;
        current = Math.min(Math.round(increment * step), target);
        
        // Format large numbers with commas
        element.textContent = formatNumber(current);
        
        if (step >= steps) {
            element.textContent = formatNumber(target);
            clearInterval(timer);
        }
    }, stepDuration);
}

function formatNumber(num) {
    if (num >= 1000) {
        return num.toLocaleString('en-US');
    }
    return num.toString();
}

/* ===== Impact Progress Bars ===== */
function initImpactBars() {
    const impactCards = document.querySelectorAll('.impact-card');
    
    if (impactCards.length === 0) return;

    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    impactCards.forEach(card => observer.observe(card));
}

/* ===== Floating Particles in Hero ===== */
function initParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;

    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
        createParticle(particlesContainer);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Random properties
    const size = Math.random() * 4 + 2;
    const left = Math.random() * 100;
    const delay = Math.random() * 20;
    const duration = Math.random() * 20 + 20;
    const opacity = Math.random() * 0.3 + 0.1;

    particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: rgba(201, 169, 98, ${opacity});
        border-radius: 50%;
        left: ${left}%;
        bottom: -10px;
        animation: floatUp ${duration}s linear ${delay}s infinite;
        pointer-events: none;
    `;

    container.appendChild(particle);

    // Add keyframes if not already added
    if (!document.getElementById('particle-keyframes')) {
        const style = document.createElement('style');
        style.id = 'particle-keyframes';
        style.textContent = `
            @keyframes floatUp {
                0% {
                    transform: translateY(0) translateX(0);
                    opacity: 0;
                }
                10% {
                    opacity: 1;
                }
                90% {
                    opacity: 1;
                }
                100% {
                    transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

/* ===== Smooth Scroll for Anchor Links ===== */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            const target = document.querySelector(href);
            if (!target) return;

            e.preventDefault();
            
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        });
    });
}

/* ===== Parallax Effect for Hero ===== */
function initParallax() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * 0.3;
        
        hero.style.backgroundPositionY = `${rate}px`;
    }, { passive: true });
}

/* ===== Typing Effect (Optional - for hero subtitle) ===== */
function initTypingEffect(element, text, speed = 50) {
    if (!element) return;

    let i = 0;
    element.textContent = '';

    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }

    type();
}

/* ===== Utility: Debounce ===== */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/* ===== Utility: Throttle ===== */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/* ===== Active Navigation Highlight ===== */
function initActiveNavHighlight() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    if (sections.length === 0 || navLinks.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, {
        threshold: 0.3,
        rootMargin: '-80px 0px -50% 0px'
    });

    sections.forEach(section => observer.observe(section));
}

// Initialize active nav
document.addEventListener('DOMContentLoaded', initActiveNavHighlight);

/* ===== Console Easter Egg ===== */
console.log(`
%c🦁 Sekhmed - CoronerIA
%cHealthcare AI from Latin America

Built with ❤️ by UNSA students for Microsoft Imagine Cup 2026

For more information, visit: https://github.com/sekhmed
`, 
'color: #C9A962; font-size: 24px; font-weight: bold;',
'color: #1B365D; font-size: 14px;'
);
