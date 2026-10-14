// 🔁 CONTENT CONFIGURATION - Update this file to change website content
// This file makes it easy to update your portfolio without touching HTML/CSS

const portfolioContent = {
    // ===== HEADER & HERO SECTION =====
    header: {
        name: "Dave Adex",
        tagline: "Problem Solver | Business Solutions Expert",
        description: "Transforming business challenges into innovative solutions across multiple sectors",
        ctaButton: "View My Work",
        ctaLink: "#products"
    },

    // ===== ABOUT ME SECTION =====
    about: {
        title: "About Me",
        subtitle: "Who I Am & What I Do",
        bio: [
            "I'm a passionate problem solver dedicated to helping businesses overcome their most pressing challenges through innovative solutions and strategic thinking.",
            "With expertise across multiple business sectors, I bring a unique perspective to every project, combining technical knowledge with business acumen to deliver results that matter.",
            "My approach is simple: understand the problem deeply, design solutions that work, and implement them with precision and care."
        ],
        image: "assets/profile.jpg", // Update with your image path
        highlights: [
            { icon: "🎯", text: "Results-Driven Approach" },
            { icon: "💡", text: "Innovative Solutions" },
            { icon: "🤝", text: "Client-Focused" },
            { icon: "📈", text: "Proven Track Record" }
        ]
    },

    // ===== SKILLS SECTION =====
    skills: {
        title: "Skills & Expertise",
        subtitle: "What I Bring to the Table",
        categories: [
            {
                name: "Technical Skills",
                icon: "💻",
                items: [
                    { name: "Web Development", level: 90 },
                    { name: "Database Management", level: 85 },
                    { name: "API Integration", level: 88 },
                    { name: "Cloud Solutions", level: 82 },
                    { name: "System Architecture", level: 87 }
                ]
            },
            {
                name: "Business Skills",
                icon: "📊",
                items: [
                    { name: "Strategic Planning", level: 92 },
                    { name: "Project Management", level: 90 },
                    { name: "Business Analysis", level: 88 },
                    { name: "Process Optimization", level: 85 },
                    { name: "Stakeholder Management", level: 90 }
                ]
            },
            {
                name: "Soft Skills",
                icon: "🎯",
                items: [
                    { name: "Problem Solving", level: 95 },
                    { name: "Communication", level: 90 },
                    { name: "Leadership", level: 87 },
                    { name: "Adaptability", level: 92 },
                    { name: "Critical Thinking", level: 93 }
                ]
            }
        ]
    },

    // ===== WHY/SOLUTIONS SECTION =====
    why: {
        title: "Why Choose Me",
        subtitle: "Solving Problems Across Business Sectors",
        intro: "I specialize in identifying and solving critical business challenges across various industries. Here's how I can help your sector:",
        sectors: [
            {
                name: "E-Commerce & Retail",
                icon: "🛒",
                problems: [
                    "Low conversion rates",
                    "Cart abandonment",
                    "Inventory management issues"
                ],
                solutions: [
                    "Optimized checkout processes",
                    "Automated inventory systems",
                    "Data-driven marketing strategies"
                ]
            },
            {
                name: "Healthcare & Medical",
                icon: "🏥",
                problems: [
                    "Patient data management",
                    "Appointment scheduling inefficiencies",
                    "Communication gaps"
                ],
                solutions: [
                    "Secure patient portals",
                    "Automated scheduling systems",
                    "Integrated communication platforms"
                ]
            },
            {
                name: "Finance & Banking",
                icon: "💰",
                problems: [
                    "Manual processes",
                    "Security concerns",
                    "Customer experience issues"
                ],
                solutions: [
                    "Process automation",
                    "Enhanced security protocols",
                    "User-friendly digital platforms"
                ]
            },
            {
                name: "Education & Training",
                icon: "📚",
                problems: [
                    "Student engagement",
                    "Content delivery challenges",
                    "Progress tracking"
                ],
                solutions: [
                    "Interactive learning platforms",
                    "Multimedia content systems",
                    "Analytics dashboards"
                ]
            },
            {
                name: "Manufacturing & Logistics",
                icon: "🏭",
                problems: [
                    "Supply chain visibility",
                    "Quality control",
                    "Operational inefficiencies"
                ],
                solutions: [
                    "Real-time tracking systems",
                    "Automated quality checks",
                    "Process optimization tools"
                ]
            },
            {
                name: "Professional Services",
                icon: "💼",
                problems: [
                    "Client management",
                    "Time tracking",
                    "Project coordination"
                ],
                solutions: [
                    "CRM integration",
                    "Automated time tracking",
                    "Collaborative project tools"
                ]
            }
        ]
    },

    // ===== PRODUCTS & SERVICES SECTION =====
    products: {
        title: "Products & Services",
        subtitle: "What I Offer",
        offerings: [
            {
                type: "service",
                name: "Business Consulting",
                icon: "🎯",
                description: "Strategic guidance to help your business overcome challenges and achieve growth objectives.",
                features: [
                    "Business analysis & assessment",
                    "Strategic planning",
                    "Process optimization",
                    "Implementation support"
                ],
                pricing: "Custom Quote"
            },
            {
                type: "service",
                name: "Custom Software Development",
                icon: "💻",
                description: "Tailored software solutions designed to meet your specific business needs and workflows.",
                features: [
                    "Web applications",
                    "Mobile apps",
                    "API development",
                    "System integration"
                ],
                pricing: "Starting at $5,000"
            },
            {
                type: "service",
                name: "Digital Transformation",
                icon: "🚀",
                description: "Modernize your business operations with cutting-edge digital solutions and automation.",
                features: [
                    "Process automation",
                    "Cloud migration",
                    "Digital strategy",
                    "Change management"
                ],
                pricing: "Custom Quote"
            },
            {
                type: "product",
                name: "Business Analytics Dashboard",
                icon: "📊",
                description: "Ready-to-deploy analytics platform for real-time business insights and reporting.",
                features: [
                    "Real-time data visualization",
                    "Custom KPI tracking",
                    "Automated reporting",
                    "Multi-source integration"
                ],
                pricing: "$299/month"
            },
            {
                type: "product",
                name: "Customer Portal Solution",
                icon: "👥",
                description: "White-label customer portal for enhanced client communication and self-service.",
                features: [
                    "Secure login system",
                    "Document management",
                    "Communication tools",
                    "Customizable branding"
                ],
                pricing: "$499/month"
            },
            {
                type: "service",
                name: "Training & Workshops",
                icon: "🎓",
                description: "Empower your team with knowledge through customized training programs and workshops.",
                features: [
                    "Technical training",
                    "Best practices workshops",
                    "Hands-on sessions",
                    "Ongoing support"
                ],
                pricing: "$150/hour"
            }
        ]
    },

    // ===== CONTACT SECTION =====
    contact: {
        title: "Get In Touch",
        subtitle: "Let's Discuss Your Project",
        description: "Ready to solve your business challenges? Reach out and let's start a conversation.",
        email: "davaempirium@gmail.com",
        phone: "+234 9154683458",
        location: "Available Worldwide",
        social: [
            { platform: "LinkedIn", url: "https://linkedin.com/in/daveadex", icon: "linkedin" },
            { platform: "GitHub", url: "https://github.com/daveadex", icon: "github" },
            { platform: "Twitter", url: "https://twitter.com/daveadex", icon: "twitter" }
        ]
    },

    // ===== FOOTER =====
    footer: {
        copyright: "© 2026 Dave Adex. All rights reserved.",
        tagline: "Building solutions that matter.",
        quickLinks: [
            { text: "About", link: "#about" },
            { text: "Skills", link: "#skills" },
            { text: "Services", link: "#products" },
            { text: "Contact", link: "#contact" }
        ]
    },

    // ===== METADATA (for SEO) =====
    meta: {
        title: "Dave Adex - Business Solutions Expert & Problem Solver",
        description: "Professional portfolio of Dave Adex - Solving business challenges across multiple sectors with innovative solutions and strategic expertise.",
        keywords: "business consultant, software developer, problem solver, digital transformation, business solutions",
        author: "Dave Adex"
    }
};

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = portfolioContent;
}

