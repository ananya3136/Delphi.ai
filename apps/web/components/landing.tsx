"use client";

import { ReactLenis, useLenis } from "lenis/react";
import { ArrowDown, ArrowUpRight, BookOpen, Check, FileText, MessageSquare, Route, ShieldCheck, Sparkles } from "lucide-react";
import styles from "./landing.module.css";
import React from "react";
import { LandingWorkflow } from "./landing-workflow";
import Image from "next/image";

const steps = [
  { icon: FileText, title: "Start with your brief", text: "Define your audience, goal, and channels. Give the campaign a clear starting point." },
  { icon: BookOpen, title: "Bring your brand", text: "Keep product context, voice, and source documents close to every creative decision." },
  { icon: ShieldCheck, title: "Review with intention", text: "Evaluate content, request revisions, and approve the current version before publication." },
];

export function Landing() {
  const lenis = useLenis();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, target: string) => {
    if (lenis) {
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
    }
  };

  return (
    <ReactLenis root>
      <div className={styles.page}>
        <a className={styles.skip} href="#main">Skip to content</a>
        <header className={styles.header}>
          <nav className={styles.nav} aria-label="Main navigation">
            <a href="#about" onClick={(e) => handleNavClick(e, '#about')}>About</a>
            <a href="#help" onClick={(e) => handleNavClick(e, '#help')}>Help</a>
            <a href="#contact" onClick={(e) => handleNavClick(e, '#contact')}>Contact</a>
          </nav>
          <a className={styles.launch} href="/dashboard">Launch Delph.ai <ArrowUpRight size={16} aria-hidden="true" /></a>
        </header>

        <main id="main">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <a className={styles.brand} href="#main" aria-label="Delph.ai home"><span className={styles.brandMark}><Image src="/logo.png" alt="" width={46} height={46} /></span>delph<span>.ai</span></a>
            <p className={styles.eyebrow}><span /> THE CAMPAIGN WORKSPACE</p>
            <h1 id="hero-title">A clear direction.<br />A connected campaign.<br /><em>Your next launch.</em></h1>
            <p className={styles.lead}>Turn the spark of an idea into a considered campaign. Bring your brief, brand, content, and review into one place—and keep the creative decisions in your hands.</p>
            <div className={styles.actions}><a className={styles.primary} href="/dashboard">Launch Delph.ai <ArrowUpRight size={18} aria-hidden="true" /></a><a className={styles.secondary} href="#workflow">Explore the workflow <ArrowDown size={16} aria-hidden="true" /></a></div>
            <p className={styles.heroNote}><ShieldCheck size={15} aria-hidden="true" /> Brand context first. Human approval always.</p>
          </div>

          <figure className={styles.visual} aria-labelledby="workflow-caption">
            <div className={styles.visualTop}><span><span className={styles.liveDot} /> CAMPAIGN IN FOCUS</span><span>Illustrative workflow</span></div>
            <div className={styles.campaignHeading}><p>FROM IDEA TO INTENTION</p><h2>The next chapter<br />of your brand.</h2><span className={styles.pill}>Campaign workspace</span></div>
            <div className={styles.flow}>
              <div className={styles.flowRow}><span className={styles.flowIcon}><BookOpen size={19} aria-hidden="true" /></span><div><strong>Brand context</strong><p>Your voice. Your sources.</p></div><Check size={16} aria-hidden="true" /></div>
              <div className={styles.flowRow}><span className={styles.flowIcon}><Route size={19} aria-hidden="true" /></span><div><strong>Strategy & direction</strong><p>A plan with a purpose.</p></div><Check size={16} aria-hidden="true" /></div>
              <div className={`${styles.flowRow} ${styles.activeRow}`}><span className={styles.flowIcon}><Sparkles size={19} aria-hidden="true" /></span><div><strong>Content & evaluation</strong><p>Shape it. Check it. Refine it.</p></div><span className={styles.smallLabel}>Review</span></div>
              <div className={styles.approval}><ShieldCheck size={18} aria-hidden="true" /><div><strong>You make the final call.</strong><p>Approval belongs to the current asset version.</p></div></div>
            </div>
            <figcaption id="workflow-caption">One campaign thread, from the first brief to the final review. This illustration contains no live campaign data.</figcaption>
          </figure>
        </section>

        <div className={styles.ribbon}><span>CONTEXT</span><span aria-hidden="true">↗</span><span>STRATEGY</span><span aria-hidden="true">↗</span><span>CONTENT</span><span aria-hidden="true">↗</span><span>HUMAN REVIEW</span><span aria-hidden="true">↗</span><span>LEARNING</span></div>

        <LandingWorkflow />

        <section id="about" className={styles.section} aria-labelledby="about-title">
          <div className={styles.sectionIntro}><p className={styles.eyebrow}>01 / ABOUT DELPH.AI</p><h2 id="about-title">Less scattered thinking.<br /><span>More connected work.</span></h2><p>For founders, creators, and small marketing teams, Delph.ai connects the decisions behind a campaign. Each stage builds on the same campaign context, so the brief stays part of the conversation.</p></div>
          <div className={styles.cards}>{steps.map(({ icon: Icon, title, text }, index) => <article className={styles.card} key={title}><div className={styles.cardTop}><Icon size={24} aria-hidden="true" /><span>0{index + 1}</span></div><h3>{title}</h3><p>{text}</p></article>)}</div>
        </section>

        <section id="help" className={`${styles.section} ${styles.help}`} aria-labelledby="help-title">
          <div className={styles.sectionIntro}><p className={styles.eyebrow}>02 / A LITTLE GUIDANCE</p><h2 id="help-title">Start small.<br /><span>Build with clarity.</span></h2><p>Your first campaign starts with a goal and a little context. You can refine the direction as you go.</p><a className={styles.secondary} href="/dashboard">Open your workspace <ArrowUpRight size={17} aria-hidden="true" /></a></div>
          <div className={styles.faq}>
            <details open><summary>What should I bring to my first campaign?</summary><p>A short brief, your target audience, a campaign objective, and the channels you want to use. Add brand guidelines or product information to ground the work.</p></details>
            <details><summary>How does review work?</summary><p>Evaluate the content and review its current version before approving it for publication. Revisions need fresh approval; previous versions and approval history remain part of the campaign record.</p></details>
            <details><summary>What should I know about demo mode?</summary><p>Deterministic generation uses repeatable outputs rather than live AI generation. Simulated metrics are demonstration data, not real campaign performance. Check the labels in your workspace before interpreting results.</p></details>
          </div>
        </section>

        <section id="contact" className={styles.contact} aria-labelledby="contact-title"><div><p className={styles.eyebrow}>03 / KEEP THE CONVERSATION GOING</p><h2 id="contact-title">Questions, ideas,<br />or something to improve?</h2><p>Visit the project repository to check documentation and existing issues. If issue reporting is enabled, share the steps to reproduce a problem and the expected result. Keep credentials and private campaign content out of public reports.</p></div><a className={styles.repository} href="https://github.com/aktionknight/Delph.ai" target="_blank" rel="noopener noreferrer"><MessageSquare size={24} aria-hidden="true" /><strong>Visit the repository</strong><span>Documentation & issue reporting</span><span className={styles.repositoryLink}>GitHub · opens in a new tab <ArrowUpRight size={16} aria-hidden="true" /></span></a></section>
        </main>
        <footer className={styles.footer}><a className={styles.brand} href="#main">delph<span>.ai</span></a><p>A thoughtful path from brief to launch.</p><a href="/dashboard">Enter your workspace <ArrowUpRight size={15} aria-hidden="true" /></a></footer>
      </div>
    </ReactLenis>
  );
}
