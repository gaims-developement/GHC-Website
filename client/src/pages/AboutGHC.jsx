import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Users, Trophy, Globe2, Sparkles, Book, Wrench } from "lucide-react";

const tracks = [
  { title: "Panel Discussions", icon: Users, text: "Engage with thought leaders on critical healthcare topics and future directions." },
  { title: "Awards", icon: Trophy, text: "Honoring excellence and outstanding contributions in global healthcare." },
  { title: "Networking", icon: Globe2, text: "Connect with professionals, researchers, and students from around the world." },
  { title: "Keynote Sessions", icon: Sparkles, text: "Inspiring talks from renowned experts shaping the future of medicine." },
  { title: "CMEs", icon: Book, text: "Continuing Medical Education sessions to upgrade clinical knowledge." },
  { title: "Workshops", icon: Wrench, text: "Hands-on training and skill-building in specialized medical fields." },
];

function SectionHeading({ eyebrow, title, text }) {
  return (
    <div className="section-heading">
      <p className="section-kicker">{eyebrow}</p>
      <h2 className="section-title">{title}</h2>
      {text && <p className="section-copy">{text}</p>}
    </div>
  );
}

function About() {
  return (
    <section id="about" className="section-shell relative overflow-hidden reveal-section">
      <div className="absolute top-1/2 -right-32 -z-10 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-gradient-to-br from-[#E91E63]/20 to-[#4FC3F7]/20 blur-[120px]" aria-hidden="true" />
      
      <div className="asym-grid items-center gap-12 md:gap-16">
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <SectionHeading eyebrow="About GHC" title="A healthcare forum designed for global coordination." />
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }} className="group relative">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#E91E63] to-[#4FC3F7] opacity-20 blur transition duration-1000 group-hover:opacity-40" />
          <div className="glass-card relative p-8 md:p-10 shadow-2xl backdrop-blur-xl bg-[#081b33]/80 border border-white/10 rounded-2xl">
            <p className="font-['Inter'] text-lg leading-relaxed text-slate-200">
              Global Healthcare Conclave is the flagship global health initiative of GAIMS, bringing together healthcare professionals, researchers, students and innovators to build practical answers for tomorrow's health systems.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {["Clinical excellence", "Research exchange", "Policy leadership"]?.map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-full border border-[#4FC3F7]/30 bg-[#4FC3F7]/10 px-4 py-2 font-['Sora'] text-sm font-semibold text-[#4FC3F7] transition hover:bg-[#4FC3F7]/20 hover:scale-105">
                  <Check className="h-4 w-4" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Mosaic() {
  return (
    <section className="section-shell reveal-section">
      <div className="mosaic-grid">
        <div className="mosaic-tile tile-large">
          <SectionHeading eyebrow="Conference Mosaic" title="One summit. Many connected rooms of healthcare leadership." text="The GHC experience moves from keynote strategy to workshops, research corridors, simulation labs and partner dialogue." />
        </div>
        {["Global policy forum", "Clinical innovation lab", "Research poster walk", "Student leadership circle"]?.map((item, index) => (
          <motion.div key={item} className="mosaic-tile" whileHover={{ y: -8, scale: 1.01 }}>
            <span>0{index + 1}</span>
            <h3>{item}</h3>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function AnimatedTrackHeading({ onComplete }) {
  const title = "Key highlights of the conclave.";
  const words = title.split(" ");

  return (
    <motion.div
      className="section-heading track-animated-heading"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.55 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
      onAnimationComplete={() => onComplete?.()}
    >
      <motion.p
        className="section-kicker"
        variants={{
          hidden: { opacity: 0, y: 14 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
        }}
      >
        Highlights
      </motion.p>
      <h2 className="section-title" aria-label={title}>
        {words.map((word, index) => (
          <span className="track-heading-word-mask" key={`${word}-${index}`} aria-hidden="true">
            <motion.span
              variants={{
                hidden: { opacity: 0, y: 42, rotateX: 18 },
                visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </h2>
      <motion.p
        className="section-copy"
        variants={{
          hidden: { opacity: 0, y: 18 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut", delay: 0.16 } },
        }}
      >
        Built for clinicians, researchers, students, policy thinkers and health technology leaders.
      </motion.p>
    </motion.div>
  );
}

function Tracks() {
  const [headingComplete, setHeadingComplete] = useState(false);

  return (
    <section id="tracks" className="relative pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <AnimatedTrackHeading onComplete={() => setHeadingComplete(true)} />
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16"
          initial="hidden"
          animate={headingComplete ? "visible" : "hidden"}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12, delayChildren: 0.14 } },
          }}
        >
          {tracks?.map((track, index) => {
            const Icon = track.icon;
            return (
              <motion.article
                key={track.title}
                className="track-card relative flex flex-col p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all duration-300"
                variants={{
                  hidden: { opacity: 0, y: 44, filter: "blur(10px)" },
                  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.76, ease: [0.22, 1, 0.36, 1] } },
                }}
                whileHover={{ y: -6, scale: 1.02, boxShadow: "0 12px 30px -4px rgba(13,71,161,0.12)" }}
              >
                <div className="absolute top-6 right-6 text-white font-bold text-5xl font-['Sora'] tracking-tighter drop-shadow-md">0{index + 1}</div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0D47A1]/10 to-[#00BCD4]/10 flex items-center justify-center text-[#0D47A1] mb-6 relative z-10"><Icon className="h-7 w-7" /></div>
                <h3 className="font-['Sora'] font-bold text-xl text-[#081B33] mb-3 relative z-10">{track.title}</h3>
                <p className="text-[#12385f]/70 leading-relaxed font-['DM_Sans'] relative z-10">{track.text}</p>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

export default function AboutGHC() {
  return (
    <>
      <About />
      <Mosaic />
      <Tracks />
    </>
  );
}
