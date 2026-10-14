// ===== PORTFOLIO WEBSITE - MAIN JAVASCRIPT =====
// This file handles all interactivity and dynamic content loading

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeWebsite();
});

// ===== MAIN INITIALIZATION =====
function initializeWebsite() {
    loadContent();
    setupNavigation();
    setupScrollEffects();
    setupAnimations();
    setupContactForm();
}

// ===== LOAD CONTENT FROM content.js =====
function loadContent() {
    if (typeof portfolioContent === 'undefined') {
        console.error('Content file not loaded!');
        return;
    }

    // Load Hero Section
    document.getElementById('heroName').textContent = portfolioContent.header.name;
    document.getElementById('heroTagline').textContent = portfolioContent.header.tagline;
    document.getElementById('heroDescription').textContent = portfolioContent.header.description;
    document.getElementById('heroCTA').textContent = portfolioContent.header.ctaButton;
    document.getElementById('heroCTA').href = portfolioContent.header.ctaLink;

    // Load About Section
    document.getElementById('aboutTitle').textContent = portfolioContent.about.title;
    document.getElementById('aboutSubtitle').textContent = portfolioContent.about.subtitle;
    
    const aboutBio = document.getElementById('aboutBio');
    aboutBio.innerHTML = portfolioContent.about.bio.map(p => `<p>${p}</p>`).join('');
    
    const aboutHighlights = document.getElementById('aboutHighlights');
    aboutHighlights.innerHTML = portfolioContent.about.highlights.map(h => `
        <div class="highlight-item">
            <span>${h.icon}</span>
            <span>${h.text}</span>
        </div>
    `).join('');

    // Load Skills Section
    document.getElementById('skillsTitle').textContent = portfolioContent.skills.title;
    document.getElementById('skillsSubtitle').textContent = portfolioContent.skills.subtitle;
    
    const skillsGrid = document.getElementById('skillsGrid');
    skillsGrid.innerHTML = portfolioContent.skills.categories.map(category => `
        <div class="skill-category">
            <div class="skill-category-header">
                <span>${category.icon}</span>
                <h3>${category.name}</h3>
            </div>
            ${category.items.map(skill => `
                <div class="skill-item">
                    <div class="skill-info">
                        <span class="skill-name">${skill.name}</span>
                        <span class="skill-level">${skill.level}%</span>
                    </div>
                    <div class="skill-bar">
                        <div class="skill-progress" data-level="${skill.level}"></div>
                    </div>
                </div>
            `).join('')}
        </div>
    `).join('');

    // Load Why/Solutions Section
    document.getElementById('whyTitle').textContent = portfolioContent.why.title;
    document.getElementById('whySubtitle').textContent = portfolioContent.why.subtitle;
    document.getElementById('whyIntro').textContent = portfolioContent.why.intro;
    
    const sectorsGrid = document.getElementById('sectorsGrid');
    sectorsGrid.innerHTML = portfolioContent.why.sectors.map(sector => `
        <div class="sector-card">
            <div class="sector-header">
                <span class="sector-icon">${sector.icon}</span>
                <h3 class="sector-name">${sector.name}</h3>
            </div>
            <div class="sector-content">
                <h4>Challenges:</h4>
                <ul>
                    ${sector.problems.map(p => `<li>${p}</li>`).join('')}
                </ul>
                <h4>Solutions:</h4>
                <ul>
                    ${sector.solutions.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>
        </div>
    `).join('');

    // Load Products & Services Section
    document.getElementById('productsTitle').textContent = portfolioContent.products.title;
    document.getElementById('productsSubtitle').textContent = portfolioContent.products.subtitle;
    
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.innerHTML = portfolioContent.products.offerings.map(product => `
        <div class="product-card">
            <span class="product-type">${product.type}</span>
            <div class="product-header">
                <span class="product-icon">${product.icon}</span>
                <h3 class="product-name">${product.name}</h3>
            </div>
            <p class="product-description">${product.description}</p>
            <ul class="product-features">
                ${product.features.map(f => `<li>${f}</li>`).join('')}
            </ul>
            <div class="product-pricing">${product.pricing}</div>
        </div>
    `).join('');

    // Load Contact Section
    document.getElementById('contactTitle').textContent = portfolioContent.contact.title;
    document.getElementById('contactSubtitle').textContent = portfolioContent.contact.subtitle;
    document.getElementById('contactDescription').textContent = portfolioContent.contact.description;
    document.getElementById('contactEmail').textContent = portfolioContent.contact.email;
    document.getElementById('contactEmail').href = `mailto:${portfolioContent.contact.email}`;
    document.getElementById('contactPhone').textContent = portfolioContent.contact.phone;
    document.getElementById('contactPhone').href = `tel:${portfolioContent.contact.phone.replace(/\D/g, '')}`;
    document.getElementById('contactLocation').textContent = portfolioContent.contact.location;
    
    const socialLinks = document.getElementById('socialLinks');
    socialLinks.innerHTML = portfolioContent.contact.social.map(s => `
        <a href="${s.url}" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="${s.platform}">
            <i class="fab fa-${s.icon}"></i>
        </a>
    `).join('');

    // Load Footer
    document.getElementById('footerTagline').textContent = portfolioContent.footer.tagline;
    document.getElementById('footerCopyright').textContent = portfolioContent.footer.copyright;
    
    const footerQuickLinks = document.getElementById('footerQuickLinks');
    footerQuickLinks.innerHTML = portfolioContent.footer.quickLinks.map(link => `
        <li><a href="${link.link}">${link.text}</a></li>
    `).join('');
    
    const footerSocial = document.getElementById('footerSocial');
    footerSocial.innerHTML = portfolioContent.contact.social.map(s => `
        <a href="${s.url}" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="${s.platform}">
            <i class="fab fa-${s.icon}"></i>
        </a>
    `).join('');

    // Update page metadata
    document.title = portfolioContent.meta.title;
    document.querySelector('meta[name="description"]').content = portfolioContent.meta.description;
    document.querySelector('meta[name="keywords"]').content = portfolioContent.meta.keywords;
    document.querySelector('meta[name="author"]').content = portfolioContent.meta.author;

    // Animate skill bars after content is loaded
    setTimeout(animateSkillBars, 500);
}

// ===== NAVIGATION =====
function setupNavigation() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    // Close mobile menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });

    // Active link on scroll
    window.addEventListener('scroll', () => {
        let current = '';
        const sections = document.querySelectorAll('section');

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= (sectionTop - 100)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // Smooth scrolling for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 70;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ===== SCROLL EFFECTS =====
function setupScrollEffects() {
    // Scroll to top button
    const scrollTopBtn = document.getElementById('scrollTop');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });

    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all sections and cards
    document.querySelectorAll('section, .skill-category, .sector-card, .product-card').forEach(el => {
        observer.observe(el);
    });
}

// ===== ANIMATIONS =====
function setupAnimations() {
    // Animate elements on scroll
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.skill-category, .sector-card, .product-card');

        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementBottom = element.getBoundingClientRect().bottom;

            if (elementTop < window.innerHeight && elementBottom > 0) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    };

    window.addEventListener('scroll', animateOnScroll);
    animateOnScroll(); // Run once on load
}

// ===== SKILL BARS ANIMATION =====
function animateSkillBars() {
    const skillBars = document.querySelectorAll('.skill-progress');

    skillBars.forEach(bar => {
        const level = bar.getAttribute('data-level');
        bar.style.width = '0%';

        setTimeout(() => {
            bar.style.width = level + '%';
        }, 100);
    });
}

// ===== CONTACT FORM =====
function setupContactForm() {
    const form = document.getElementById('contactForm');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get form data
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value
        };

        // Here you would typically send the data to a server
        // For now, we'll just show an alert
        alert(`Thank you, ${formData.name}! Your message has been received. I'll get back to you soon at ${formData.email}.`);

        // Reset form
        form.reset();

        // In a real implementation, you would do something like:
        // fetch('/api/contact', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(formData)
        // })
        // .then(response => response.json())
        // .then(data => {
        //     alert('Message sent successfully!');
        //     form.reset();
        // })
        // .catch(error => {
        //     alert('Error sending message. Please try again.');
        // });
    });
}

// ===== UTILITY FUNCTIONS =====

// Debounce function for performance
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

// Log when website is ready
console.log('🎉 Portfolio website loaded successfully!');
console.log('📝 To update content, edit the content.js file');
console.log('🔁 This website is designed for frequent updates');

