"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, Check, FileText, Layers, Pause, Play, Route, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import styles from "./landing-workflow.module.css";

const stages = [
  { title: "Brief & brand", icon: BookOpen, label: "THE STARTING POINT", heading: "Give the idea a foundation.", description: "Your goal, audience, voice, and source material become the context the rest of the campaign builds on.", output: "Campaign brief", rows: ["Goal · Introduce a new product", "Audience · Independent creators", "Voice · Clear, useful, considered"], note: "Brand sources stay connected to the campaign." },
  { title: "Strategy", icon: Route, label: "A CLEAR DIRECTION", heading: "Turn context into a plan.", description: "Shape the positioning, choose a creative direction, and map the timeline before producing content.", output: "Campaign direction", rows: ["Positioning · Make room for better work", "Creative direction · A calmer launch", "Timeline · Introduce → explain → invite"], note: "The brief informs each strategic decision." },
  { title: "Create", icon: Sparkles, label: "IDEAS TAKE SHAPE", heading: "One idea. The right expression.", description: "Develop platform-specific drafts from the same strategy and brand context, then refine them in the content canvas.", output: "Content canvas", rows: ["LinkedIn · The story behind the launch", "Instagram · A visual product introduction", "X · A concise launch conversation"], note: "Illustrative drafts · no live generation." },
  { title: "Evaluate", icon: ShieldCheck, label: "A MOMENT TO CHECK", heading: "Check the work before it moves on.", description: "Evaluate the current asset version for brand alignment and supported claims. Flag problems and revise before review.", output: "Quality review", rows: ["Brand voice · Check against guidelines", "Claims · Trace back to source material", "Revision · Resolve flagged content"], note: "A revision creates a new version to evaluate." },
  { title: "Approve", icon: Check, label: "YOUR JUDGMENT MATTERS", heading: "The final call belongs to you.", description: "Review the evaluated asset and explicitly approve its current version before publication. Changes require fresh approval.", output: "Human review", rows: ["Current asset · Version 2", "Evaluation · Review the findings", "Decision · Awaiting your approval"], note: "This preview never approves or publishes an asset." },
  { title: "Learn", icon: TrendingUp, label: "BRING THE LEARNING BACK", heading: "Make the next brief more informed.", description: "Compare experiments, review available results, and keep the learnings alongside the campaign that produced them.", output: "Campaign memory", rows: ["Experiments · Compare creative variants", "Results · Separate real and simulated data", "Learning · Carry evidence into the next brief"], note: "Simulated metrics are labeled in the workspace." },
];

export function LandingWorkflow() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.2 });
    if (root.current) observer.observe(root.current);
    return () => { preference.removeEventListener("change", update); observer.disconnect(); };
  }, []);

  const running = playing && visible && !reducedMotion;
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive((index) => (index + 1) % stages.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [running, active]);

  const stage = stages[active];
  const Icon = stage.icon;

  return <section ref={root} id="workflow" className={styles.section} aria-labelledby="workflow-title" data-running={running}>
    <div className={styles.intro}>
      <div><p className={styles.eyebrow}>THE WORKFLOW / IN MOTION</p><h2 id="workflow-title">Every step connected.<br /><span>Every decision considered.</span></h2></div>
      <p>Follow an idea through the workspace. The same campaign context connects the work, while you stay in control of the decisions.</p>
    </div>

    <div className={styles.board}>
      <div className={styles.toolbar}><span><span className={styles.dot} /> AN ILLUSTRATIVE CAMPAIGN</span><button type="button" onClick={() => setPlaying(!playing)} disabled={reducedMotion} aria-label={playing ? "Pause workflow animation" : "Play workflow animation"}>{playing && !reducedMotion ? <Pause size={13} /> : <Play size={13} />}{reducedMotion ? "Motion reduced" : playing ? "Pause" : "Play"}</button></div>

      <div className={styles.context}><span className={styles.contextIcon}><Layers size={23} aria-hidden="true" /></span><div><strong>One campaign brain</strong><p>Your brief, brand, sources, and decisions.</p></div><span className={styles.contextTag}>CONTEXT THAT TRAVELS WITH YOU</span></div>
      <div className={styles.branch} aria-hidden="true"><span /></div>

      <div className={styles.steps} aria-label="Explore campaign workflow stages">
        {stages.map(({ title, icon: StepIcon }, index) => <button type="button" key={title} className={`${styles.step} ${index === active ? styles.selected : ""}`} aria-pressed={index === active} aria-controls="workflow-detail" onClick={() => { setActive(index); setPlaying(false); }}><span className={styles.number}>0{index + 1}</span><StepIcon size={22} aria-hidden="true" /><strong>{title}</strong><span className={styles.stepProgress} key={`${active}-${playing}`} /></button>)}
      </div>

      <div id="workflow-detail" className={styles.detail}>
        <div key={`copy-${active}`} className={styles.copy}><p className={styles.eyebrow}>{stage.label}</p><h3>{stage.heading}</h3><p>{stage.description}</p><div className={styles.stepCount}><span>0{active + 1}</span> / 06 <ArrowRight size={16} aria-hidden="true" /></div></div>
        <div key={`preview-${active}`} className={styles.preview}><div className={styles.previewHeader}><Icon size={17} aria-hidden="true" /><span>{stage.output}</span><span className={styles.sample}>EXAMPLE</span></div><div className={styles.previewRows}>{stage.rows.map((row, index) => <div key={row} style={{ animationDelay: `${index * 90}ms` }}><span className={styles.rowMark}><FileText size={13} aria-hidden="true" /></span>{row}</div>)}</div><p className={styles.previewNote}>{stage.note}</p></div>
      </div>
      <div className={styles.bottom}><span>Brief <ArrowRight size={12} aria-hidden="true" /> Campaign <ArrowRight size={12} aria-hidden="true" /> Learning <span className={styles.return}>↳ back to your next brief</span></span><p>Illustrative walkthrough. No live campaign data or actions.</p></div>
    </div>
    <p className={styles.hint}>Select any step to explore it at your own pace.</p>
  </section>;
}
