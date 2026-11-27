import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ME, ABOUT, PROJECTS, SKILLS, FEATURED, EDUCATION, CONTACT, NAV } from "../data/content";
import FRAMES from "../data/frames";
import "./landing.css";

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const docTop = (el) => el.getBoundingClientRect().top + window.scrollY;


export default function Landing() {
  const rootRef = useRef(null);
  const wrapRef = useRef(null);
  const pinRef = useRef(null);
  const portraitRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const goTo = (id) => {
    if (id === "intro") window.scrollTo({ top: wrapRef.current?.offsetTop || 0, behavior: "smooth" });
    else {
      const stage = rootRef.current?.querySelector(`.pf-stage-${id}`);
      if (stage) window.scrollTo({ top: docTop(stage), behavior: "smooth" });
      else document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    if (!menuOpen) return;
    window.dispatchEvent(new Event("scroll"));
    const onKey = (e) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useLayoutEffect(() => {
    const root = rootRef.current, pin = pinRef.current;
    const stages = Array.from(root.querySelectorAll(".pf-stage"));
    const sections = stages.map((stage) => stage.querySelector(".pf-section"));
    const size = () => {
      const W = pin.clientWidth, H = pin.clientHeight;
      const heights = sections.map((el) => el?.offsetHeight || H);
      stages.forEach((stage, i) => {
        stage.style.marginTop = `${i === 0 ? -H : -heights[i - 1]}px`;
        stage.style.height = `${H + heights[i]}px`;
      });
      const tall = H > W * 0.95;
      root.style.setProperty("--w", `${W}px`);
      root.style.setProperty("--h", `${H}px`);
      root.dataset.tall = tall ? "1" : "0";
      root.dataset.compact = tall && H < 700 ? "1" : "0";
      root.dataset.short = !tall && H < 520 ? "1" : "0";
    };
    size();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(size) : null;
    if (ro) { ro.observe(pin); sections.forEach((el) => { if (el) ro.observe(el); }); }
    window.addEventListener("resize", size);
    return () => { if (ro) ro.disconnect(); window.removeEventListener("resize", size); };
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current, pin = pinRef.current;
    const imgs = Array.from(portraitRef.current.querySelectorAll("img"));
    const backs = Array.from(portraitRef.current.querySelectorAll(".pf-frame-back"));
    const inner = portraitRef.current.querySelector(".pf-portrait-in");
    const stages = Array.from(rootRef.current.querySelectorAll(".pf-stage"));
    const sections = stages.map((stage) => stage.querySelector(".pf-section"));
    const last = imgs.length - 1;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const paint = (pos) => {
      const opacities = imgs.map((_, i) => Math.max(0, 1 - Math.abs(pos - i)).toFixed(3));
      imgs.forEach((im, i) => { im.style.opacity = opacities[i]; });
      backs.forEach((el, i) => { el.style.opacity = opacities[i] ?? 0; });
    };

    const measure = () => {
      const y = Math.max(0, -wrap.getBoundingClientRect().top);
      const range = Math.max(1, wrap.offsetHeight - pin.offsetHeight);
      const p = clamp01(y / range);
      rootRef.current.style.setProperty("--p", p.toFixed(3));

      const vh = pin.offsetHeight;
      const tops = stages.map(docTop);
      const setBlur = (el, start, end) => el?.style.setProperty("--section-blur", `${(clamp01((y - start) / Math.max(1, end - start)) * 14).toFixed(2)}px`);
      rootRef.current.style.setProperty("--hero-blur", `${(clamp01((y - (tops[0] - vh)) / Math.max(1, vh)) * 14).toFixed(2)}px`);
      sections.forEach((el, i) => { if (i < sections.length - 1) setBlur(el, tops[i], tops[i + 1]); });
      paint(Math.min(last, y / 600));

      let now = "intro";
      sections.forEach((el) => {
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) now = el.id;
      });
      rootRef.current.querySelectorAll(".pf-links a").forEach((a) => {
        if (a.dataset.id === now) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
      const activeEl = sections.find((el) => el?.id === now);
      const tint = getComputedStyle(activeEl || rootRef.current.querySelector(".pf-hero")).backgroundColor;
      const rgb = (tint.match(/\d+/g) || ["48", "8", "84"]).slice(0, 3).join(", ");
      rootRef.current.style.setProperty("--menu-rgb", rgb);

      if (!reduce) inner.style.transform = `scale(${(1.07 - 0.07 * p).toFixed(3)})`;
    };

    imgs.forEach((im) => { im.loading = "eager"; im.decoding = "async"; if ("fetchPriority" in im) im.fetchPriority = "high"; });
    Promise.all(imgs.map((im) => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()))).catch(() => {});

    paint(0);
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div className="pf" ref={rootRef}>
      <header className="pf-top">
        <button type="button" className="pf-menu-btn" aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen} aria-controls="pf-menu" onClick={() => setMenuOpen((v) => !v)}>
          <span /><span /><span />
        </button>
        <nav className="pf-links" aria-label="Sections">
          {NAV.map((n) => {
            const id = n.toLowerCase();
            return <a key={n} href={`#${id}`} data-id={id}
              className={["skills", "featured", "education"].includes(id) ? "pf-link-extra" : undefined}
              aria-current={n === "Intro" ? "true" : undefined}
              onClick={(e) => { e.preventDefault(); goTo(id); }}>{n}</a>;
          })}
        </nav>
      </header>

      {menuOpen && (
        <div className="pf-menu" id="pf-menu">
          <button type="button" className="pf-menu-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
          <nav className="pf-links pf-menu-links" aria-label="All sections">
            {NAV.map((n) => {
              const id = n.toLowerCase();
              return <a key={n} href={`#${id}`} data-id={id} aria-current={n === "Intro" ? "true" : undefined}
                onClick={(e) => { e.preventDefault(); goTo(id); setMenuOpen(false); }}>{n}</a>;
            })}
          </nav>
        </div>
      )}

      <div className="pf-wrap" ref={wrapRef}>
        <section className="pf-hero" ref={pinRef} aria-label="Introduction">
          <div className="pf-band" aria-hidden="true" />

          <div className="pf-portrait" ref={portraitRef} role="img" aria-label="Portrait that turns from profile to facing you as you scroll">
            <div className="pf-portrait-in">
              {FRAMES.map((src, i) => (<span key={`back-${i}`} className="pf-frame-back" aria-hidden="true"
                style={{ WebkitMaskImage: `url(${src})`, maskImage: `url(${src})`, opacity: i === 0 ? 1 : 0 }} />))}
              {FRAMES.map((src, i) => (<img key={i} src={src} alt="" draggable="false" decoding="async" loading="eager" style={{ opacity: i === 0 ? 1 : 0 }} />))}
            </div>
          </div>

          <div className="pf-text">
            <p className="pf-hello">Hey, I'm</p>
            <h1>{ME.name.split(" ").map((w) => (<span key={w}>{w}</span>))}</h1>
          </div>
        </section>
      </div>

      <div className="pf-stage pf-stage-about">
        <section id="about" className="pf-section pf-about" aria-label="About">
          <div className="pf-section-inner pf-about-inner">
            <div className="pf-about-lead">
              <p className="pf-eyebrow">About</p>
              <h2>{ABOUT.lead}</h2>
            </div>
            <div className="pf-about-body">
              <p>{ABOUT.more}</p>
              <ul className="pf-facts">
                {ABOUT.facts.map(([label, value]) => (<li key={label}><strong>{label}</strong><span>{value}</span></li>))}
              </ul>
            </div>
          </div>
        </section>
      </div>

      <div className="pf-stage pf-stage-projects">
        <section id="projects" className="pf-section pf-projects" aria-label="Projects">
          <div className="pf-section-inner">
            <p className="pf-eyebrow">Projects</p>
            <h2>Things I've built</h2>
            <div className="pf-card-grid">
              {PROJECTS.map((project) => (
                <article key={project.title} className="pf-card glass">
                  <h3>{project.title}</h3>
                  <p>{project.text}</p>
                  <ul className="pf-tags">{project.tags.map((tag) => (<li key={tag}>{tag}</li>))}</ul>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="pf-stage pf-stage-skills">
        <section id="skills" className="pf-section pf-skills" aria-label="Skills">
          <div className="pf-section-inner">
            <p className="pf-eyebrow">Skills</p>
            <h2>What I work with</h2>
            <div className="pf-skill-grid">
              {SKILLS.map((group) => (
                <article key={group.title} className="pf-skill-group glass">
                  <h3>{group.title}</h3>
                  <ul>{group.items.map((item) => (<li key={item}>{item}</li>))}</ul>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="pf-stage pf-stage-featured">
        <section id="featured" className="pf-section pf-featured" aria-label="Featured">
          <div className="pf-section-inner">
            <p className="pf-eyebrow">Featured</p>
            <h2>Work I'm proud of</h2>
            <div className="pf-card-grid">
              {FEATURED.map((item) => (
                <article key={item.title} className="pf-card glass">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <ul className="pf-tags">{item.tags.map((tag) => (<li key={tag}>{tag}</li>))}</ul>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="pf-stage pf-stage-education">
        <section id="education" className="pf-section pf-education" aria-label="Education">
          <div className="pf-section-inner">
            <p className="pf-eyebrow">Education</p>
            <h2>Where I learned</h2>
            <div className="pf-timeline">
              {EDUCATION.map((item) => (
                <article key={item.school} className="pf-timeline-item">
                  <h3>{item.school}</h3>
                  <p className="pf-timeline-meta">{item.degree} · {item.years}</p>
                  <p>{item.note}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="pf-stage pf-stage-contact">
        <section id="contact" className="pf-section pf-contact" aria-label="Contact">
          <div className="pf-section-inner">
            <p className="pf-eyebrow">Contact</p>
            <h2>Let's make something</h2>
            <p>{CONTACT.note}</p>
            <div className="pf-contact-actions">
              <a className="pf-contact-mail" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
              <ul>
                {CONTACT.links.map((link) => (
                  <li key={link.label}><a href={link.href} target="_blank" rel="noreferrer">{link.label}</a></li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>

    </div>
  );
}
