// All the text on the page lives here. Edit freely.

export const ME = {
  name: "Ashutosh Cherekar",
  tag: "I like to make things easier for",
  tagAccent: "everyone", // shown in the light-purple accent
};

// The About glass card
export const ABOUT = {
  lead: [
    { text: "Hi, I'm " },
    { text: "Ashutosh", highlight: true },
    { text: ", a final-year Computer Science and Engineering student from " },
    { text: "Bengaluru, India", highlight: true },
    { text: ". I live by one idea, " },
    { text: '"To make things easier for everyone."', highlight: true },
  ],
  more: "I build web apps from the first sketch to the shipped product, and I care about the small details that make something feel effortless to use.",
  facts: [["Based in", "Your City"], ["Focus", "Web apps"], ["Status", "Open to work"]],
};

export const PROJECTS = [
  {
    title: "Pulse Dashboard",
    text: "A real-time analytics dashboard with clean charts and a fast, keyboard-friendly UI.",
    tags: ["React", "Vite", "Charts"],
  },
  {
    title: "Taskflow",
    text: "A collaborative task board with drag-and-drop, filters, and a calm focus mode.",
    tags: ["React", "Node", "CSS"],
  },
  {
    title: "Frame by Frame",
    text: "A scroll-driven storytelling experiment built around timing, motion, and restraint.",
    tags: ["Motion", "React", "UI"],
  },
];

export const SKILLS = [
  { title: "Frontend", items: ["React", "JavaScript", "TypeScript", "CSS", "Accessibility"] },
  { title: "Tooling", items: ["Vite", "Git", "Chrome DevTools", "npm"] },
  { title: "Focus", items: ["Motion design", "UI systems", "Performance", "Detail"] },
];

export const FEATURED = [
  {
    title: "Northstar",
    text: "A calm home for goals, notes, and the small wins that add up over time.",
    tags: ["React", "Design", "Local-first"],
  },
  {
    title: "Motion Studies",
    text: "Short experiments in scroll, timing, and interfaces that feel alive.",
    tags: ["Motion", "CSS", "Storytelling"],
  },
];

export const EDUCATION = [
  { school: "Your University", degree: "B.Tech, Computer Science", years: "2020 — 2024", note: "Focused on human-computer interaction and web systems." },
  { school: "Self-taught", degree: "Frontend engineering", years: "Ongoing", note: "Building, reading docs, and shipping small projects." },
];

export const CONTACT = {
  email: "hello@example.com",
  note: "Have a project in mind, or just want to say hi? I'd love to hear about it.",
  links: [
    { label: "GitHub", href: "https://github.com/" },
    { label: "LinkedIn", href: "https://www.linkedin.com/" },
  ],
};

// Top-left tabs. Each name becomes the id it scrolls to (intro = top of page).
export const NAV = ["Intro", "About", "Projects", "Skills", "Featured", "Education", "Contact"];
