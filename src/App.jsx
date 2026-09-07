import React, { useEffect, useRef, useState, useCallback } from 'react';

const TOTAL_FRAMES = 300;
const imageCache = new Array(TOTAL_FRAMES).fill(null);

export default function App() {
  const canvasRef = useRef(null);
  const currentFrameRef = useRef(0);
  const targetFrameRef = useRef(0);
  const lastRenderedFrameRef = useRef(-1);
  const rafIdRef = useRef(null);

  const [isScrolled, setIsScrolled] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Path generator for 300 JPG frames
  const getFramePath = useCallback((index) => {
    const frameNum = String(index + 1).padStart(3, '0');
    return `/frames/ezgif-frame-${frameNum}.jpg`;
  }, []);

  // Canvas frame renderer with edge-to-edge cover scaling
  const renderFrame = useCallback((index) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const img = imageCache[index];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imgWidth = img.naturalWidth || 1280;
    const imgHeight = img.naturalHeight || 720;

    // Cover mode: fills entire viewport edge-to-edge
    const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
    const scaledWidth = imgWidth * scale;
    const scaledHeight = imgHeight * scale;
    const x = (canvasWidth - scaledWidth) / 2;
    const y = (canvasHeight - scaledHeight) / 2;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, 0, 0, imgWidth, imgHeight, x, y, scaledWidth, scaledHeight);

    lastRenderedFrameRef.current = index;
  }, []);

  // Resize canvas for device pixel ratio (sharpness on Retina/4K)
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    canvas.width = Math.floor(displayWidth * dpr);
    canvas.height = Math.floor(displayHeight * dpr);

    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }

    const frameToDraw = lastRenderedFrameRef.current >= 0 ? lastRenderedFrameRef.current : 0;
    renderFrame(frameToDraw);
  }, [renderFrame]);

  // Sync scroll position to target frame
  const updateTargetFromScroll = useCallback(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) {
      targetFrameRef.current = 0;
      return;
    }
    const scrollY = Math.max(0, Math.min(window.scrollY, maxScroll));
    const progress = scrollY / maxScroll;
    targetFrameRef.current = progress * (TOTAL_FRAMES - 1);

    setIsScrolled(scrollY > 40);
  }, []);

  // Preload and decode images
  useEffect(() => {
    resizeCanvas();

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      if (!imageCache[i]) {
        const img = new Image();
        img.src = getFramePath(i);

        img.onload = () => {
          if (i === 0 && lastRenderedFrameRef.current === -1) {
            renderFrame(0);
          }
          if (img.decode) {
            img.decode().catch(() => {});
          }
        };

        imageCache[i] = img;
      }
    }

    updateTargetFromScroll();
    renderFrame(0);
  }, [getFramePath, renderFrame, resizeCanvas, updateTargetFromScroll]);

  // RAF LERP animation loop
  useEffect(() => {
    const animate = () => {
      const ease = 0.08;
      const diff = targetFrameRef.current - currentFrameRef.current;
      currentFrameRef.current += diff * ease;

      const frameToDraw = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(currentFrameRef.current)));

      if (frameToDraw !== lastRenderedFrameRef.current) {
        renderFrame(frameToDraw);
      }

      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [renderFrame]);

  // Scroll & Resize listeners
  useEffect(() => {
    const handleScroll = () => updateTargetFromScroll();
    const handleResize = () => {
      resizeCanvas();
      updateTargetFromScroll();
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [resizeCanvas, updateTargetFromScroll]);

  // Copy Email Handler
  const handleCopyEmail = () => {
    navigator.clipboard.writeText('hello@folioblox.dev');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      {/* 3D Fixed Background Canvas */}
      <div className="canvas-background-wrapper">
        <canvas ref={canvasRef} className="render-canvas" />
      </div>

      {/* Atmospheric Vignette for readability & warm lighting */}
      <div className="canvas-overlay-vignette" />

      {/* Floating Modern Navbar */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <a href="#home" className="nav-brand" onClick={closeMobileMenu}>
          Folioblox<span className="brand-dot" />
        </a>

        {/* Desktop Navigation Links */}
        <ul className="nav-links">
          <li><a href="#home" className="nav-link">Home</a></li>
          <li><a href="#about" className="nav-link">About</a></li>
          <li><a href="#projects" className="nav-link">Projects</a></li>
          <li><a href="#experience" className="nav-link">Experience</a></li>
          <li><a href="#education" className="nav-link">Education</a></li>
        </ul>

        <div className="nav-actions">
          <a href="#contact" className="btn-pill-cta desktop-cta">
            Get in touch <span className="btn-arrow-icon">➔</span>
          </a>

          {/* Mobile Hamburger Toggle */}
          <button 
            className={`mobile-menu-toggle ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span className="hamburger-line" />
            <span className="hamburger-line" />
            <span className="hamburger-line" />
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      <div className={`mobile-menu-drawer ${mobileMenuOpen ? 'active' : ''}`}>
        <ul className="mobile-nav-links">
          <li><a href="#home" className="mobile-nav-link" onClick={closeMobileMenu}>Home</a></li>
          <li><a href="#about" className="mobile-nav-link" onClick={closeMobileMenu}>About</a></li>
          <li><a href="#projects" className="mobile-nav-link" onClick={closeMobileMenu}>Projects</a></li>
          <li><a href="#experience" className="mobile-nav-link" onClick={closeMobileMenu}>Experience</a></li>
          <li><a href="#education" className="mobile-nav-link" onClick={closeMobileMenu}>Education</a></li>
        </ul>
        <div className="mobile-menu-footer">
          <a href="#contact" className="btn-orange-pill full-width" onClick={closeMobileMenu}>
            Get in touch <span className="btn-arrow-icon">➔</span>
          </a>
        </div>
      </div>

      {/* Main Page Content Overlay */}
      <main className="page-content">
        {/* HERO SECTION (Matches Reference Design) */}
        <section id="home" className="hero-section">
          <div className="hero-main-grid">
            <div className="hero-left">
              <span className="hero-eyebrow">Hey, I'm a</span>
              <h1 className="hero-title">
                Creative<br />Designer
              </h1>
              <div className="hero-subtitle-badge">
                <span className="pulse-dot" />
                Available for Selected Projects
              </div>
            </div>

            <div className="hero-right">
              <div className="hero-quote-card">
                <h2 className="quote-heading">Great design should feel invisible.</h2>
                <p className="quote-body">
                  From code to language, I build brands, scalable architectures, and interactive digital experiences that connect and convert.
                </p>
              </div>
            </div>
          </div>

          {/* Capabilities Row */}
          <div className="hero-capabilities-row">
            <div className="capability-item">
              <span className="capability-num">//01</span>
              <span className="capability-name">Brand Strategy</span>
            </div>
            <div className="capability-item">
              <span className="capability-num">//02</span>
              <span className="capability-name">Brand Identity Design</span>
            </div>
            <div className="capability-item">
              <span className="capability-num">//03</span>
              <span className="capability-name">Creative Engineering</span>
            </div>
            <div className="capability-item">
              <span className="capability-num">//04</span>
              <span className="capability-name">Technical Direction</span>
            </div>
          </div>

          {/* Trusted Brands Bar (From Reference Design) */}
          <div className="brands-pill-bar">
            <span className="brands-label">Trusted by Brands I've Helped Shape</span>
            <div className="brands-list">
              <div className="brand-item"><span className="brand-icon" /> Supa Blox</div>
              <div className="brand-item"><span className="brand-icon" /> Hype Blox</div>
              <div className="brand-item"><span className="brand-icon" /> Frame Blox</div>
              <div className="brand-item"><span className="brand-icon" /> Ultra Blox</div>
            </div>
          </div>
        </section>

        {/* ABOUT SECTION ("Behind the Designs" from Reference) */}
        <section id="about" className="section">
          <div className="about-grid">
            <div className="about-left">
              <span className="section-tag">Behind the Designs</span>
              <h2 className="section-title">
                Shaping Experiences That Make Life Simpler
              </h2>
            </div>

            <div className="about-right">
              <p className="about-statement">
                I'm a product designer & creative engineer focused on building clean, intuitive interfaces and robust architectures that solve real-world problems.
              </p>
              <p className="about-sub">
                Bridging the gap between conceptual design and high-performance code. Every interaction is crafted with precision, accessibility, and purpose to deliver lasting impact.
              </p>
              <div className="about-cta-box">
                <span className="about-cta-label">Let's Build Something Meaningful Together</span>
                <a href="#contact" className="btn-orange-pill">
                  Get in touch <span className="btn-arrow-icon">➔</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* PROJECTS SECTION */}
        <section id="projects" className="section">
          <span className="section-tag">Featured Works</span>
          <h2 className="section-title">Selected Projects</h2>

          <div className="projects-grid">
            {/* Project 1 */}
            <div className="project-card">
              <div className="project-visual project-visual-gradient-1">
                <span className="project-badge-pill">Smart Lifestyle & Hardware</span>
                <span className="project-art-symbol">🧥</span>
              </div>
              <div className="project-info">
                <h3 className="project-title">Aero Thermal Outerwear</h3>
                <p className="project-description">
                  Next-generation smart apparel interface with integrated IoT telemetry and companion mobile experience.
                </p>
                <div className="project-tags">
                  <span className="tag-badge">Product Design</span>
                  <span className="tag-badge">React Native</span>
                  <span className="tag-badge">IoT</span>
                </div>
              </div>
            </div>

            {/* Project 2 */}
            <div className="project-card">
              <div className="project-visual project-visual-gradient-2">
                <span className="project-badge-pill">Spatial Audio & 3D</span>
                <span className="project-art-symbol">🎧</span>
              </div>
              <div className="project-info">
                <h3 className="project-title">Studio Acoustics Pro</h3>
                <p className="project-description">
                  Interactive 3D soundstage configuration tool built with WebGL and spatial audio DSP algorithms.
                </p>
                <div className="project-tags">
                  <span className="tag-badge">Three.js</span>
                  <span className="tag-badge">WebGL</span>
                  <span className="tag-badge">Audio DSP</span>
                </div>
              </div>
            </div>

            {/* Project 3 */}
            <div className="project-card">
              <div className="project-visual project-visual-gradient-3">
                <span className="project-badge-pill">Luxury E-Commerce & Brand</span>
                <span className="project-art-symbol">🧴</span>
              </div>
              <div className="project-info">
                <h3 className="project-title">Lumina Organic Essences</h3>
                <p className="project-description">
                  Sustainable luxury skincare brand identity, packaging design, and high-conversion e-commerce platform.
                </p>
                <div className="project-tags">
                  <span className="tag-badge">Brand Identity</span>
                  <span className="tag-badge">Next.js</span>
                  <span className="tag-badge">Full Stack</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WORK EXPERIENCE SECTION */}
        <section id="experience" className="section">
          <span className="section-tag">Career Journey</span>
          <h2 className="section-title">Work Experience</h2>

          <div className="experience-timeline">
            {/* Role 1 */}
            <div className="experience-card">
              <div className="exp-meta">
                <span className="exp-period">2023 — PRESENT</span>
                <span className="exp-company">Apex Interactive</span>
                <span className="exp-location">San Francisco, CA (Remote)</span>
              </div>
              <div className="exp-content">
                <h3 className="exp-role-title">Lead Creative Technologist & Product Designer</h3>
                <ul className="exp-bullets">
                  <li>Spearheaded end-to-end design systems and frontend architecture for enterprise SaaS platform serving 650k+ daily active users.</li>
                  <li>Architected real-time 3D product visualizers with WebGL, resulting in a 42% increase in customer conversion rates.</li>
                  <li>Directed cross-functional team of 8 engineers and designers across design-to-code pipelines.</li>
                </ul>
              </div>
            </div>

            {/* Role 2 */}
            <div className="experience-card">
              <div className="exp-meta">
                <span className="exp-period">2021 — 2023</span>
                <span className="exp-company">Veloce Digital</span>
                <span className="exp-location">New York, NY</span>
              </div>
              <div className="exp-content">
                <h3 className="exp-role-title">Senior Full Stack Engineer & UI Architect</h3>
                <ul className="exp-bullets">
                  <li>Engineered high-performance web applications using React, TypeScript, Node.js, and AWS cloud infrastructure.</li>
                  <li>Reduced web core vitals LCP by 55% across client web platforms through bundle splitting and edge caching.</li>
                  <li>Collaborated closely with founders and executive stakeholders to define technical roadmaps and product UX.</li>
                </ul>
              </div>
            </div>

            {/* Role 3 */}
            <div className="experience-card">
              <div className="exp-meta">
                <span className="exp-period">2019 — 2021</span>
                <span className="exp-company">Mono Design Studio</span>
                <span className="exp-location">London, UK</span>
              </div>
              <div className="exp-content">
                <h3 className="exp-role-title">Frontend Developer & Interactive Designer</h3>
                <ul className="exp-bullets">
                  <li>Crafted award-winning interactive websites, microsites, and digital brand identities for global Fortune 500 brands.</li>
                  <li>Implemented fluid micro-interactions, canvas animations, and responsive web accessibility standards (WCAG AAA).</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* EDUCATION & SKILLS SECTION */}
        <section id="education" className="section">
          <span className="section-tag">Background & Competencies</span>
          <h2 className="section-title">Education & Skills</h2>

          <div className="edu-skills-grid">
            {/* Education Box */}
            <div className="edu-card">
              <h3 className="card-subtitle">🎓 Education</h3>
              <div className="edu-item">
                <h4 className="edu-degree">B.S. in Computer Science & Interactive Media</h4>
                <div className="edu-school">State University of Technology</div>
                <p className="edu-details">Graduated Magna Cum Laude (GPA: 3.9/4.0) • Focus on Human-Computer Interaction, 3D Computer Graphics, and Distributed Systems.</p>
              </div>

              <div className="edu-item">
                <h4 className="edu-degree">Professional Certifications</h4>
                <div className="edu-school">Cloud & Engineering Credentials</div>
                <p className="edu-details">AWS Certified Solutions Architect • Google Cloud Professional • Meta Advanced React Specialist.</p>
              </div>
            </div>

            {/* Skills Box */}
            <div className="skills-card">
              <h3 className="card-subtitle">⚡ Technical & Design Stack</h3>
              <div className="skills-pill-group">
                <span className="skill-pill">React 18</span>
                <span className="skill-pill">TypeScript</span>
                <span className="skill-pill">Next.js</span>
                <span className="skill-pill">Three.js / WebGL</span>
                <span className="skill-pill">Node.js</span>
                <span className="skill-pill">Canvas 2D</span>
                <span className="skill-pill">Figma</span>
                <span className="skill-pill">UI/UX Design</span>
                <span className="skill-pill">Design Systems</span>
                <span className="skill-pill">Docker</span>
                <span className="skill-pill">AWS / Cloud</span>
                <span className="skill-pill">Tailwind & CSS3</span>
                <span className="skill-pill">CI/CD & DevOps</span>
                <span className="skill-pill">Brand Identity</span>
              </div>
              <p className="about-sub">
                Constantly exploring cutting-edge web graphics, generative UI, and high-performance web architecture.
              </p>
            </div>
          </div>
        </section>

        {/* CONTACT & FOOTER SECTION */}
        <section id="contact" className="section">
          <div className="contact-card">
            <span className="section-tag">Let's Connect</span>
            <h2 className="contact-title">Have a project in mind?<br />Let's build something great.</h2>
            <p className="contact-desc">
              I'm always open to discussing new opportunities, creative collaborations, or product design and engineering roles.
            </p>
            <div className="contact-actions">
              <a href="mailto:hello@folioblox.dev" className="btn-contact-main">
                Send an Email ➔
              </a>
              <button onClick={handleCopyEmail} className="btn-contact-secondary">
                {copiedEmail ? '✓ Email Copied!' : '📋 Copy Email'}
              </button>
            </div>
          </div>

          <div className="footer-bottom">
            <div>© {new Date().getFullYear()} Folioblox. All rights reserved.</div>
            <div className="footer-socials">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="footer-social-link">GitHub</a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="footer-social-link">LinkedIn</a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="footer-social-link">Twitter</a>
              <a href="https://dribbble.com" target="_blank" rel="noreferrer" className="footer-social-link">Dribbble</a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
