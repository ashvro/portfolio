import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ME, ABOUT, PROJECTS, SKILLS, FEATURED, EDUCATION, CONTACT, NAV } from "../data/content";
import FRAMES, { SEQUENCE } from "../data/frames";
import "./landing.css";

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const docTop = (el) => el.getBoundingClientRect().top + window.scrollY;
const EASE_TAU = 80;       // higher = smoother/slower glide
const TURN_LEAD_VH = 0.5;   // half a scroll of pause after the last frame before About enters
const SECTION_STEP_VH = 2.5; // scroll distance between section handoffs (desktop)


export default function Landing() {
  const rootRef = useRef(null);
  const wrapRef = useRef(null);
  const pinRef = useRef(null);
  const portraitRef = useRef(null);
  const canvasRef = useRef(null);
  const bitmapsRef = useRef([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState("checking");

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

  useEffect(() => {
    if (typeof createImageBitmap !== "function") { setMode("images"); return; }
    let cancelled = false;
    const bitmaps = new Array(SEQUENCE.length);
    const load = async (i) => {
      const blob = await (await fetch(SEQUENCE[i])).blob();
      const bmp = await createImageBitmap(blob);
      if (cancelled) { bmp.close?.(); return false; }
      bitmaps[i] = bmp;
      window.dispatchEvent(new Event("pf-frames"));
      return true;
    };
    (async () => {
      try {
        await load(0);
        if (cancelled) return;
        bitmapsRef.current = bitmaps;
        setMode("canvas");
        let next = 1;
        await Promise.all(Array.from({ length: 8 }, async () => {
          while (!cancelled && next < SEQUENCE.length) {
            const i = next++;
            try { await load(i); } catch { /* keep the nearest loaded frame */ }
          }
        }));
      } catch {
        if (!cancelled) setMode("images");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current, pin = pinRef.current;
    const stages = Array.from(root.querySelectorAll(".pf-stage"));
    const sections = stages.map((stage) => stage.querySelector(".pf-section"));
    const topbar = root.querySelector(".pf-top");
    const size = () => {
      const W = pin.clientWidth, H = pin.clientHeight;
      const heights = sections.map((el) => el?.offsetHeight || H);
      const tall = H > W * 0.95;
      const step = H * SECTION_STEP_VH;
      stages.forEach((stage, i) => {
        stage.style.marginTop = `${i === 0 ? -H : -heights[i - 1]}px`;
        stage.style.height = `${step + heights[i]}px`;
      });
      root.style.setProperty("--w", `${W}px`);
      root.style.setProperty("--h", `${H}px`);
      if (topbar) {
        const bandLeft = Math.max(0, topbar.getBoundingClientRect().right - root.getBoundingClientRect().left);
        const portraitLeft = W * 0.39;
        const matteStart = Math.max(0, Math.min(100, ((bandLeft - portraitLeft) / (W * 0.62)) * 100));
        root.style.setProperty("--band-left", `${bandLeft.toFixed(1)}px`);
        root.style.setProperty("--matte-start", `${matteStart.toFixed(2)}%`);
      }
      root.dataset.tall = tall ? "1" : "0";
      root.dataset.compact = tall && H < 700 ? "1" : "0";
      root.dataset.short = !tall && H < 520 ? "1" : "0";
    };
    size();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(size) : null;
    if (ro) { ro.observe(pin); if (topbar) ro.observe(topbar); sections.forEach((el) => { if (el) ro.observe(el); }); }
    window.addEventListener("resize", size);
    return () => { if (ro) ro.disconnect(); window.removeEventListener("resize", size); };
  }, []);

  useEffect(() => {
    const root = rootRef.current, wrap = wrapRef.current, pin = pinRef.current;
    const useCanvas = mode === "canvas";
    const imgs = mode === "images" ? Array.from(portraitRef.current.querySelectorAll("img")) : [];
    const backs = mode === "images" ? Array.from(portraitRef.current.querySelectorAll(".pf-frame-back")) : [];
    const canvas = useCanvas ? canvasRef.current : null;
    const bitmaps = useCanvas ? bitmapsRef.current : [];
    const inner = portraitRef.current.querySelector(".pf-portrait-in");
    const stages = Array.from(root.querySelectorAll(".pf-stage"));
    const sections = stages.map((stage) => stage.querySelector(".pf-section"));
    const last = FRAMES.length - 1;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let m = { wrapTop: 0, range: 1, vh: 1, tops: [] };
    let colors = [];
    let tab = "", linkCount = 0;
    let opa = FRAMES.map(() => -1), lastKey = -1;
    let blur = sections.map(() => -1), heroBlur = -1;
    let targetPos = 0, currentPos = 0, rafId = 0, lastT = 0;

    const recolor = () => {
      const rgb = (el) => (getComputedStyle(el).backgroundColor.match(/\d+/g) || ["48", "8", "84"]).slice(0, 3).join(", ");
      colors = [rgb(pin), ...sections.map((el) => rgb(el))];
    };

    const sizeCanvas = () => {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; lastKey = -1; }
    };

    const paint = (pos) => {
      if (useCanvas && bitmaps.length) {
        const raw = clamp01(pos / last) * (bitmaps.length - 1);
        const key = Math.round(raw * 100);
        if (key === lastKey) return;
        lastKey = key;
        sizeCanvas();
        const ctx = canvas.getContext("2d");
        const cw = canvas.width, ch = canvas.height;
        const tall = root.dataset.tall === "1";
        const place = (bmp) => {
          const bw = bmp.width, bh = bmp.height;
          const scale = Math.max(cw / bw, ch / bh);
          const sw = cw / scale, sh = ch / scale;
          return [(bw - sw) * (tall ? 0.46 : 0.5), (bh - sh) * (tall ? 0.10 : 0), sw, sh];
        };
        const nearest = (idx) => {
          for (let d = 0; d < bitmaps.length; d++) {
            const a = idx - d;
            if (a >= 0 && bitmaps[a]) return a;
            const b = idx + d;
            if (b < bitmaps.length && bitmaps[b]) return b;
          }
          return -1;
        };
        let a = nearest(Math.floor(raw));
        let b = nearest(Math.min(bitmaps.length - 1, Math.ceil(raw)));
        if (a < 0 && b < 0) return;
        if (a < 0) a = b;
        if (b < 0) b = a;
        if (a > b) [a, b] = [b, a];
        const t = a === b ? 0 : clamp01((raw - a) / Math.max(1, b - a));
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1 - t;
        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(bitmaps[a], ...place(bitmaps[a]), 0, 0, cw, ch);
        if (t > 0.001 && b !== a) {
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = t;
          ctx.drawImage(bitmaps[b], ...place(bitmaps[b]), 0, 0, cw, ch);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
        return;
      }
      for (let i = 0; i < imgs.length; i++) {
        const v = Math.max(0, 1 - Math.abs(pos - i));
        if (Math.abs(v - opa[i]) < 0.002) continue;
        opa[i] = v;
        const s = v.toFixed(3);
        imgs[i].style.opacity = s;
        backs[i].style.opacity = s;
      }
    };

    const tick = (now) => {
      const dt = Math.min(64, now - lastT || 16);
      lastT = now;
      const diff = targetPos - currentPos;
      if (Math.abs(diff) < 0.0006) {
        currentPos = targetPos;
        paint(currentPos);
        rafId = 0;
        return;
      }
      const tau = root.dataset.tall === "1" ? 55 : EASE_TAU;
      currentPos += diff * (1 - Math.exp(-dt / tau));
      paint(currentPos);
      rafId = requestAnimationFrame(tick);
    };
    const startTick = () => {
      if (rafId) return;
      lastT = performance.now();
      rafId = requestAnimationFrame(tick);
    };

    const measure = () => {
      const y = Math.max(0, window.scrollY - m.wrapTop);
      const p = clamp01(y / m.range);
      root.style.setProperty("--p", p.toFixed(3));
      root.dataset.intro = p < 0.985 ? "1" : "0";

      const hb = clamp01((y - (m.tops[0] - m.vh)) / Math.max(1, m.vh)) * 14;
      if (Math.abs(hb - heroBlur) >= 0.02) { heroBlur = hb; root.style.setProperty("--hero-blur", `${hb.toFixed(2)}px`); }
      sections.forEach((el, i) => {
        if (i >= sections.length - 1) return;
        const v = clamp01((y - (m.tops[i + 1] - m.vh)) / Math.max(1, m.vh)) * 14;
        if (Math.abs(v - blur[i]) < 0.02) return;
        blur[i] = v;
        el?.style.setProperty("--section-blur", `${v.toFixed(2)}px`);
      });
      const turnEnd = Math.max(1, m.tops[0] - m.vh * TURN_LEAD_VH);
      targetPos = Math.min(last, (y / turnEnd) * last);
      startTick();

      let now = "intro";
      for (let i = 0; i < sections.length; i++) {
        if (m.tops[i] - (y + m.wrapTop) < window.innerHeight * 0.4) now = sections[i].id;
      }
      const links = root.querySelectorAll(".pf-links a");
      if (now !== tab || links.length !== linkCount) {
        tab = now; linkCount = links.length;
        links.forEach((a) => {
          if (a.dataset.id === now) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
        const idx = sections.findIndex((el) => el?.id === now);
        root.style.setProperty("--menu-rgb", colors[idx + 1] || colors[0]);
      }

      if (!reduce) inner.style.transform = `scale(${(1.07 - 0.07 * p).toFixed(3)})`;
    };

    const remeasure = () => {
      m = {
        wrapTop: docTop(wrap),
        range: Math.max(1, wrap.offsetHeight - pin.offsetHeight),
        vh: pin.offsetHeight,
        tops: stages.map(docTop),
      };
      recolor();
      sizeCanvas();
      measure();
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; measure(); });
    };

    if (!useCanvas) {
      imgs.forEach((im) => { im.loading = "eager"; im.decoding = "async"; if ("fetchPriority" in im) im.fetchPriority = "high"; });
      Promise.all(imgs.map((im) => (im.decode ? im.decode().catch(() => {}) : Promise.resolve()))).catch(() => {});
    }

    const onFrames = () => { lastKey = -1; paint(currentPos); };
    sizeCanvas();
    paint(0);
    remeasure();
    window.addEventListener("pf-frames", onFrames);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", remeasure);
    return () => {
      window.removeEventListener("pf-frames", onFrames);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", remeasure);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [mode]);

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

          <div className={`pf-portrait${mode === "images" ? " is-images" : ""}`} ref={portraitRef} role="img" aria-label="Portrait that turns from profile to facing you as you scroll">
            <div className="pf-portrait-in">
              {mode === "images" && (
                <>
                  {FRAMES.map((src, i) => (<span key={`back-${i}`} className="pf-frame-back" aria-hidden="true"
                    style={{ WebkitMaskImage: `url(${src})`, maskImage: `url(${src})`, opacity: i === 0 ? 1 : 0 }} />))}
                  {FRAMES.map((src, i) => (<img key={i} src={src} alt="" draggable="false" decoding="async" loading="eager" style={{ opacity: i === 0 ? 1 : 0 }} />))}
                </>
              )}
              {mode === "checking" && <img className="pf-poster" src={FRAMES[0]} alt="" aria-hidden="true" draggable="false" />}
              <canvas ref={canvasRef} className="pf-canvas" aria-hidden="true" />
            </div>
          </div>

          <div className="pf-text">
            <p className="pf-hello">Hey, I'm</p>
            <h1>{ME.name.split(" ").map((w) => (<span key={w}>{w}</span>))}</h1>
          </div>

          <div className="pf-progress">
            <span className="pf-progress-label" aria-hidden="true">Scroll to meet me</span>
            <span className="pf-progress-track" aria-hidden="true"><span className="pf-progress-fill" /></span>
          </div>
        </section>
      </div>

      <div className="pf-stage pf-stage-about">
        <section id="about" className="pf-section pf-about" aria-label="About">
          <div className="pf-section-inner pf-about-inner">
            <div className="pf-about-lead">
              <p className="pf-eyebrow">About</p>
              <h2>{ABOUT.lead.map((part, i) => part.breakBefore
              ? <span key={i}><br /><mark className="pf-hl">{part.text}</mark></span>
              : part.highlight
                ? <mark key={i} className="pf-hl">{part.text}</mark>
                : <span key={i} className={part.noWrap ? "pf-nowrap" : undefined}>{part.text}</span>)}</h2>
            </div>
            <div className="pf-about-body">
              {ABOUT.more.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
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
