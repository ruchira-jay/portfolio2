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
    navigator.clipboard.writeText('ruchira.tamohara@gmail.com');
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
          Ruchira<span className="brand-dot" />
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
                Software<br />Engineer
              </h1>
              <div className="hero-subtitle-badge">
                <span className="pulse-dot" />
                Available for Selected Projects
              </div>
            </div>

            <div className="hero-right">
              <div className="hero-quote-card">
                <h2 className="quote-heading">Building solutions that make a difference.</h2>
                <p className="quote-body">
                  A motivated software engineering professional with a strong foundation in web and mobile application development, database management, and software design.
                </p>
              </div>
            </div>
          </div>

          {/* Capabilities Row */}
          <div className="hero-capabilities-row">
            <div className="capability-item">
              <span className="capability-num">//01</span>
              <span className="capability-name">Full Stack Development</span>
            </div>
            <div className="capability-item">
              <span className="capability-num">//02</span>
              <span className="capability-name">Mobile Development</span>
            </div>
            <div className="capability-item">
              <span className="capability-num">//03</span>
              <span className="capability-name">Database Management</span>
            </div>
            <div className="capability-item">
              <span className="capability-num">//04</span>
              <span className="capability-name">UI/UX Design</span>
            </div>
          </div>

          {/* Trusted Brands Bar (From Reference Design) */}
          <div className="brands-pill-bar">
            <span className="brands-label">Technologies I Work With</span>
            <div className="brands-list">
              <div className="brand-item"><span className="brand-icon" /> React.js</div>
              <div className="brand-item"><span className="brand-icon" /> React Native</div>
              <div className="brand-item"><span className="brand-icon" /> Node.js</div>
              <div className="brand-item"><span className="brand-icon" /> MongoDB</div>
            </div>
          </div>
        </section>

        {/* ABOUT SECTION ("Behind the Designs" from Reference) */}
        <section id="about" className="section">
          <div className="about-grid">
            <div className="about-left">
              <span className="section-tag">Behind the Designs</span>
              <h2 className="section-title">
                Building Digital Solutions That Solve Real Problems
              </h2>
            </div>

            <div className="about-right">
              <p className="about-statement">
                I'm a software engineering professional with a strong foundation in web and mobile application development, database management, and software design.
              </p>
              <p className="about-sub">
                Passionate about learning new technologies, solving technical challenges, and continuously honing skills to contribute effectively within a professional IT environment. Currently pursuing a Higher Diploma in Computing and Software Engineering at ICBT Campus, awarded by Cardiff Metropolitan University.
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
                <span className="project-badge-pill">Web Application</span>
                <span className="project-art-symbol">🏥</span>
              </div>
              <div className="project-info">
                <h3 className="project-title">Hospital Management System</h3>
                <p className="project-description">
                  A web-based system to manage patient records, appointments, staff, and hospital services with responsive UI and full backend integration.
                </p>
                <div className="project-tags">
                  <span className="tag-badge">PHP</span>
                  <span className="tag-badge">MySQL</span>
                  <span className="tag-badge">HTML/CSS</span>
                </div>
              </div>
            </div>

            {/* Project 2 */}
            <div className="project-card">
              <div className="project-visual project-visual-gradient-2">
                <span className="project-badge-pill">Desktop Application</span>
                <span className="project-art-symbol">🛒</span>
              </div>
              <div className="project-info">
                <h3 className="project-title">Point-of-Sale (POS) System</h3>
                <p className="project-description">
                  A Java-based POS system applying OOP principles with book management, customer management, sales processing, and receipt generation.
                </p>
                <div className="project-tags">
                  <span className="tag-badge">Java</span>
                  <span className="tag-badge">OOP</span>
                  <span className="tag-badge">MySQL</span>
                </div>
              </div>
            </div>

            {/* Project 3 */}
            <div className="project-card">
              <div className="project-visual project-visual-gradient-3">
                <span className="project-badge-pill">Mobile & Web App</span>
                <span className="project-art-symbol">📱</span>
              </div>
              <div className="project-info">
                <h3 className="project-title">HR & Workforce Platform</h3>
                <p className="project-description">
                  Designed and developed responsive web and mobile interfaces including Newsfeed, Rewards & Recognition, Time & Attendance, and Survey modules.
                </p>
                <div className="project-tags">
                  <span className="tag-badge">React.js</span>
                  <span className="tag-badge">React Native</span>
                  <span className="tag-badge">TypeScript</span>
                  <span className="tag-badge">Tailwind CSS</span>
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
                <span className="exp-period">APRIL 2026 — PRESENT</span>
                <span className="exp-company">TechFortreX</span>
                <span className="exp-location">Remote (International)</span>
              </div>
              <div className="exp-content">
                <h3 className="exp-role-title">Full Stack Developer Intern</h3>
                <ul className="exp-bullets">
                  <li>Developing full-stack web applications and mobile application user interfaces in a remote international development environment.</li>
                  <li>Designing and implementing responsive web interfaces and mobile UI screens with a focus on usability and user experience.</li>
                  <li>Collaborating with developers using modern development workflows, version control, and remote communication tools.</li>
                </ul>
              </div>
            </div>

            {/* Role 2 */}
            <div className="experience-card">
              <div className="exp-meta">
                <span className="exp-period">2024 — 2025</span>
                <span className="exp-company">Veneiro Ventures (Pvt)</span>
                <span className="exp-location">Sri Lanka</span>
              </div>
              <div className="exp-content">
                <h3 className="exp-role-title">Site Supervisor</h3>
                <ul className="exp-bullets">
                  <li>Coordinated workers, contractors, and project schedules to ensure timely project delivery.</li>
                  <li>Prepared progress reports and monitored project timelines.</li>
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
                <h4 className="edu-degree">Higher Diploma in Computing and Software Engineering</h4>
                <div className="edu-school">ICBT Campus, Sri Lanka — Awarded by Cardiff Metropolitan University</div>
                <p className="edu-details">Dec 2024 – Apr 2026 (Undergraduate 2026)</p>
              </div>

              <div className="edu-item">
                <h4 className="edu-degree">International Diploma in ICT (OTHM Level 3)</h4>
                <div className="edu-school">ICBT Campus, Sri Lanka — OTHM Qualifications</div>
                <p className="edu-details">Mar 2024 – Nov 2024</p>
              </div>

              <div className="edu-item">
                <h4 className="edu-degree">G.C.E. Ordinary Level</h4>
                <div className="edu-school">8A Passes and 1B</div>
                <p className="edu-details">2018</p>
              </div>

              <div className="edu-item">
                <h4 className="edu-degree">Certifications</h4>
                <div className="edu-school">Google & SkillUp</div>
                <p className="edu-details">Introduction to AI and Machine Learning on Google Cloud • React Native: Developing Android and iOS Apps (2026)</p>
              </div>
            </div>

            {/* Skills Box */}
            <div className="skills-card">
              <h3 className="card-subtitle">⚡ Technical Stack</h3>
              <div className="skills-pill-group">
                <span className="skill-pill">JavaScript</span>
                <span className="skill-pill">React.js</span>
                <span className="skill-pill">Next.js</span>
                <span className="skill-pill">TypeScript</span>
                <span className="skill-pill">React Native</span>
                <span className="skill-pill">Node.js</span>
                <span className="skill-pill">HTML / CSS</span>
                <span className="skill-pill">Tailwind CSS</span>
                <span className="skill-pill">PHP</span>
                <span className="skill-pill">Java</span>
                <span className="skill-pill">C</span>
                <span className="skill-pill">MySQL</span>
                <span className="skill-pill">MongoDB</span>
                <span className="skill-pill">GitHub</span>
                <span className="skill-pill">Graphic Design</span>
              </div>
              <p className="about-sub">
                Strong soft skills in Leadership, Problem Solving, Team Work, and Time Management.
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
              I'm always open to discussing new opportunities, internships, or software engineering roles. Let's connect!
            </p>
            <div className="contact-actions">
              <a href="mailto:ruchira.tamohara@gmail.com?subject=Let's%20Work%20Together&body=Hi%20Ruchira%2C%0A%0AI%20came%20across%20your%20portfolio%20and%20would%20love%20to%20connect." className="btn-contact-main">
                Send an Email ➔
              </a>
              <button onClick={handleCopyEmail} className="btn-contact-secondary">
                {copiedEmail ? '✓ Email Copied!' : '📋 Copy Email'}
              </button>
            </div>
          </div>

          <div className="footer-bottom">
            <div>© {new Date().getFullYear()} Ruchira Thamohara Jayasinghe. All rights reserved.</div>
            <div className="footer-socials">
              <a href="https://github.com/ruchira-jay" target="_blank" rel="noreferrer" className="footer-social-link">GitHub</a>
              <a href="https://ruchira-jay.github.io/portfolio/" target="_blank" rel="noreferrer" className="footer-social-link">Portfolio</a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="footer-social-link">LinkedIn</a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
