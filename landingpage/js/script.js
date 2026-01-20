document.addEventListener('DOMContentLoaded', () => {
    // 1. Efeito de Revelação (Intersection Observer)
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // 2. Navbar e Menu Mobile
    const navbar = document.getElementById('navbar');
    const mobileMenu = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('navbar-scrolled', window.scrollY > 50);
    }, { passive: true });

    mobileMenu.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileMenu.querySelector('i').classList.toggle('fa-bars');
        mobileMenu.querySelector('i').classList.toggle('fa-xmark');
    });

    // 3. Modo Noturno
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('i');

    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        
        if (isDark) {
            themeIcon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'dark');
        } else {
            themeIcon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'light');
        }
    });

    // 4. Formulário
    const contactForm = document.getElementById('contact-form');
    contactForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = contactForm.querySelector('button');
        btn.innerText = 'Enviando...';
        btn.disabled = true;

        setTimeout(() => {
            alert(`Mensagem enviada com sucesso!`);
            contactForm.reset();
            btn.innerText = 'Enviar Mensagem';
            btn.disabled = false;
        }, 1500);
    });
});