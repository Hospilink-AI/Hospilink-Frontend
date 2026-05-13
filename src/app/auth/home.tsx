// import { useState, useRef, useEffect } from "react";
// import { useRouter } from "expo-router";

// const NAVY = "#0B1730";
// const MUTED = "#6B7280";

// /* ─── SVG Icons ─── */
// const LinkIcon = () => (
//     <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
//         <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
//     </svg>
// );

// const BrainIcon = () => (
//     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M9.5 2a2.5 2.5 0 0 1 5 0M9.5 2C7 2 5 4 5 6.5c0 1-.3 2-.8 2.8C3.4 10.5 3 11.7 3 13a5 5 0 0 0 4 4.9V20h10v-2.1A5 5 0 0 0 21 13c0-1.3-.4-2.5-1.2-3.7-.5-.8-.8-1.8-.8-2.8C19 4 17 2 14.5 2" />
//         <path d="M9 13h.01M15 13h.01M9.5 17a3 3 0 0 0 5 0" />
//     </svg>
// );

// const ClockIcon = () => (
//     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round">
//         <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 15" />
//     </svg>
// );

// const ShieldIcon = () => (
//     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5 4.5-1.35 8-6.25 8-11.5V6L12 2z" />
//         <path d="M9 12l2 2 4-4" />
//     </svg>
// );

// const PayIcon = () => (
//     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1B2B45" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
//         <rect x="2" y="5" width="20" height="14" rx="3" /><path d="M2 10h20" />
//         <circle cx="7" cy="15" r="1.5" fill="#1B2B45" />
//         <rect x="11" y="14" width="6" height="2" rx="1" fill="#1B2B45" />
//     </svg>
// );

// const DutyIcon = () => (
//     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1B2B45" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
//         <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
//         <path d="M8 14h2M8 17h2M13 14h3M13 17h3" />
//     </svg>
// );

// const SuperviseIcon = () => (
//     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1B2B45" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
//         <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
//         <path d="M18 14l2 2 4-4" />
//     </svg>
// );

// const AnalyticsIcon = () => (
//     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1B2B45" strokeWidth="1.5" strokeLinecap="round">
//         <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
//     </svg>
// );

// const BellIcon = () => (
//     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1B2B45" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
//         <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
//     </svg>
// );

// const ChevDown = ({ open }) => (
//     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"
//         style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .25s", flexShrink: 0 }}>
//         <polyline points="6 9 12 15 18 9" />
//     </svg>
// );

// const services = [
//     { Icon: PayIcon, title: "One-Hand Payments", desc: "Integrated payment system for seamless, one-hand processing from onboarding and payouts to salaries." },
//     { Icon: DutyIcon, title: "Duty Management", desc: "Streamlined scheduling of duty rosters, shift management, and attendance tracking to ensure seamless hospital operations." },
//     { Icon: SuperviseIcon, title: "Clinical Supervision", desc: "Experienced intensivists provide clinical oversight, ensuring quality compliance and improved patient outcomes." },
//     { Icon: AnalyticsIcon, title: "Performance Analytics", desc: "Real-time data insights on staff performance, patient outcomes, and operational efficiency across departments." },
//     { Icon: BellIcon, title: "Smart Notifications", desc: "Automated alerts for shift changes, duty swaps, compliance deadlines, and critical patient updates." },
// ];

// const faqs = [
//     { q: "What services does Hospilink provide?", a: "Hospilink provides AI-powered staff matching, real-time scheduling, verified professional onboarding, duty management, clinical supervision, and integrated payment processing for hospitals and medical staff." },
//     { q: "Who can use Hospilink?", a: "Hospilink is designed for hospitals, clinics, and qualified medical professionals including doctors, nurses, and allied health staff looking for flexible staffing opportunities." },
//     { q: "How does Hospilink verify medical professionals?", a: "All medical staff undergo thorough credential verification, license validation, and background checks through our automated compliance system before being listed on the platform." },
//     { q: "Is my personal and professional information secure?", a: "Yes. Hospilink uses end-to-end encryption and complies with healthcare data privacy regulations to ensure all personal and professional information remains fully secure." },
//     { q: "Is there a registration fee to join Hospilink?", a: "Registration is free for medical professionals. Hospitals subscribe to our platform with plans tailored to their size and staffing needs." },
// ];

// export default function App() {

//     const router = useRouter();
//     const [scrolled, setScrolled] = useState(false);
//     const [mobileMenu, setMobileMenu] = useState(false);
//     const [carouselIdx, setCarouselIdx] = useState(0);
//     const [openFaq, setOpenFaq] = useState(null);

//     const heroRef = useRef(null);
//     const featureRef = useRef(null);
//     const solutionRef = useRef(null);
//     const aboutRef = useRef(null);
//     const faqRef = useRef(null);

//     useEffect(() => {
//         const fn = () => setScrolled(window.scrollY > 2);
//         window.addEventListener("scroll", fn);
//         return () => window.removeEventListener("scroll", fn);
//     }, []);

//     const scrollTo = (ref) => {
//         setMobileMenu(false);
//         setTimeout(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
//     };

//     const maxIdx = Math.max(0, services.length - 3);

//     return (
//         <div style={{ fontFamily: "Inter, 'Segoe UI', sans-serif", background: "#fff", color: NAVY, overflowX: "hidden" }}>
//             <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
//         *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
//         html { scroll-behavior:smooth; }
//         button { font-family:inherit; }

//         /* container */
//         .container { width:100%; max-width:1200px; margin:auto; padding-left:32px; padding-right:32px; }

//         /* nav buttons */
//         .nav-link { background:none; border:none; color:rgba(229,231,235,0.9); font-size:14px; font-weight:500; cursor:pointer; transition:opacity .2s; padding:0; }
//         .nav-link:hover { opacity:.75; }

//         /* nav sign in — white filled pill */
//         .primary-btn {
//           background:#fff;
//           color:${NAVY};
//           border:none;
//           padding:10px 26px;
//           border-radius:8px;
//           font-weight:600;
//           font-size:14px;
//           cursor:pointer;
//           transition:opacity .15s;
//         }
//         .primary-btn:hover { opacity:.9; }

//         /* hero sign in — dark filled */
//         .dark-btn {
//           background:${NAVY};
//           color:#fff;
//           border:none;
//           padding:13px 28px;
//           border-radius:8px;
//           font-weight:600;
//           font-size:15px;
//           cursor:pointer;
//           transition:opacity .15s;
//         }
//         .dark-btn:hover { opacity:.85; }

//         /* cta white btn */
//         .white-btn {
//           background:#fff;
//           color:${NAVY};
//           border:none;
//           padding:13px 28px;
//           border-radius:8px;
//           font-weight:600;
//           font-size:14px;
//           cursor:pointer;
//           transition:opacity .15s;
//         }
//         .white-btn:hover { opacity:.9; }

//         /* service card */
//         .service-card {
//           flex:1;
//           border:1px solid #E5E7EB;
//           background:#fff;
//           padding:36px 22px 30px;
//           text-align:center;
//           border-radius:2px;
//           transition:box-shadow .2s;
//         }
//         .service-card:hover { box-shadow:0 4px 22px rgba(0,0,0,.08); }

//         /* faq */
//         .faq-item { border-bottom:1px solid #E5E7EB; }
//         .faq-item:first-child { border-top:1px solid #E5E7EB; }
//         .faq-btn { width:100%; display:flex; justify-content:space-between; align-items:center; background:none; border:none; padding:22px 0; cursor:pointer; text-align:left; }

//         /* footer links */
//         .flink { background:none; border:none; color:#9CA3AF; font-size:13px; font-family:inherit; cursor:pointer; display:block; margin-bottom:11px; text-align:left; padding:0; transition:color .15s; }
//         .flink:hover { color:#fff; }

//         /* carousel arrow */
//         .arr { width:36px; height:36px; border-radius:50%; border:1px solid #E5E7EB; background:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; transition:background .15s; }
//         .arr:hover:not(:disabled) { background:#F9FAFB; }
//         .arr:disabled { opacity:.3; cursor:default; }

//         /* hamburger */
//         .hmb { display:none; background:none; border:none; cursor:pointer; }

//         /* ── Responsive ── */
//         @media(max-width:900px) {
//           .hero-flex { flex-direction:column !important; }
//           .hero-image { display:none !important; }
//           .why-flex { flex-direction:column !important; }
//           .why-img { display:none !important; }
//           .cta-flex { flex-direction:column !important; }
//           .cta-img { display:none !important; }
//           .svc-row { flex-direction:column !important; }
//           .faq-layout { flex-direction:column !important; gap:28px !important; }
//           .footer-grid { grid-template-columns:1fr 1fr !important; }
//           .steps { grid-template-columns:56px 1fr !important; }
//           .step-desc { display:none !important; }
//           .stats { grid-template-columns:1fr 1fr !important; }
//           .dnav { display:none !important; }
//           .hmb { display:flex !important; }
//         }
//         @media(max-width:600px) {
//           .footer-grid { grid-template-columns:1fr !important; }
//         }
//       `}</style>

//             {/* ════════════════════════════════════════════
//           NAVBAR
//       ════════════════════════════════════════════ */}
//             <nav style={{
//                 position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
//                 background: NAVY, height: 64,
//                 display: "flex", alignItems: "center",
//                 borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "none",
//             }}>
//                 <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>

//                     {/* Logo */}
//                     <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
//                         <div style={{
//                             width: 34, height: 34, borderRadius: 8,
//                             background: "rgba(255,255,255,0.1)",
//                             display: "flex", alignItems: "center", justifyContent: "center",
//                         }}>
//                             <LinkIcon />
//                         </div>
//                         <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, letterSpacing: "0.04em" }}>HOSPILINK</span>
//                     </div>

//                     {/* Desktop links */}
//                     <div className="dnav" style={{ display: "flex", alignItems: "center", gap: 36 }}>
//                         <button className="nav-link" onClick={() => scrollTo(featureRef)}>Features</button>
//                         <button className="nav-link" onClick={() => scrollTo(solutionRef)}>Solutions</button>
//                         <button className="nav-link" onClick={() => scrollTo(aboutRef)}>About Us</button>
//                         <button className="primary-btn" onClick={() => scrollTo(heroRef)}>Sign In</button>
//                     </div>

//                     {/* Hamburger */}
//                     <button className="hmb" onClick={() => setMobileMenu(o => !o)}>
//                         <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
//                             {mobileMenu
//                                 ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
//                                 : <><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></>
//                             }
//                         </svg>
//                     </button>
//                 </div>
//             </nav>

//             {/* Mobile menu */}
//             {mobileMenu && (
//                 <div style={{
//                     position: "fixed", top: 64, left: 0, right: 0, zIndex: 999,
//                     background: NAVY, padding: "8px 24px 20px",
//                     borderBottom: "1px solid rgba(255,255,255,0.08)",
//                     boxShadow: "0 8px 24px rgba(0,0,0,.3)",
//                 }}>
//                     {[["Features", featureRef], ["Solutions", solutionRef], ["About Us", aboutRef]].map(([l, r]) => (
//                         <button key={l} className="nav-link" onClick={() => scrollTo(r)}
//                             style={{ display: "block", padding: "13px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", width: "100%", textAlign: "left" }}>
//                             {l}
//                         </button>
//                     ))}
//                     <button className="primary-btn" style={{ marginTop: 14 }} onClick={() => scrollTo(heroRef)}>Sign In</button>
//                 </div>
//             )}

//             {/* ════════════════════════════════════════════
//           HERO
//       ════════════════════════════════════════════ */}
//             <section ref={heroRef}>
//                 <div className="container" style={{ paddingTop: 140, paddingBottom: 0 }}>
//                     <div className="hero-flex" style={{ display: "flex", alignItems: "center", gap: 60 }}>

//                         {/* LEFT — text */}
//                         <div style={{ flex: 1, maxWidth: 560 }}>
//                             <h1 style={{
//                                 fontSize: "clamp(36px,5.2vw,64px)",
//                                 lineHeight: 1.06,
//                                 fontWeight: 800,
//                                 marginBottom: 22,
//                                 letterSpacing: "-0.04em",
//                                 color: NAVY,
//                             }}>
//                                 Revolutionizing Healthcare Staff Management
//                             </h1>
//                             <p style={{ color: MUTED, fontSize: "clamp(15px,1.4vw,18px)", lineHeight: 1.7, marginBottom: 32, maxWidth: 420 }}>
//                                 Connect hospitals with qualified medical staff seamlessly
//                             </p>
//                             <button className="dark-btn" onClick={() => scrollTo(featureRef)}>Sign In</button>
//                         </div>

//                         {/* RIGHT — blob + photo */}
//                         <div className="hero-image" style={{ width: 470, height: 520, flexShrink: 0, position: "relative" }}>
//                             {/* The left-rounded blob — positioned bottom-right */}
//                             <div style={{
//                                 position: "absolute",
//                                 right: 0,
//                                 bottom: 0,
//                                 width: "100%",
//                                 height: "84%",
//                                 background: "#E8EEF8",
//                                 borderRadius: "120px 0 0 120px",
//                             }} />
//                             {/* Doctor photo */}
//                             <img
//                                 src="https://images.unsplash.com/photo-1582750433449-648ed127bb54?q=80&w=1200&auto=format&fit=crop"
//                                 alt="Healthcare professional"
//                                 style={{
//                                     position: "relative",
//                                     zIndex: 1,
//                                     width: "100%",
//                                     height: "100%",
//                                     objectFit: "contain",
//                                     objectPosition: "bottom center",
//                                     display: "block",
//                                 }}
//                             />
//                         </div>
//                     </div>
//                 </div>

//                 {/* STATS BAR */}
//                 <div className="container" style={{ paddingBottom: 80 }}>
//                     <div className="stats" style={{
//                         display: "grid",
//                         gridTemplateColumns: "repeat(4,1fr)",
//                         border: "1px solid #E5E7EB",
//                         borderRadius: 12,
//                         background: "#fff",
//                         boxShadow: "0 1px 8px rgba(0,0,0,.05)",
//                         overflow: "hidden",
//                         marginTop: 48,
//                     }}>
//                         {[
//                             ["99.9%", "Satisfaction Rate"],
//                             ["500+", "Hospitals"],
//                             ["10,000+", "Medical Staff"],
//                             ["50,000+", "Duties Completed"],
//                         ].map(([num, label], i) => (
//                             <div key={label} style={{
//                                 padding: "26px 20px",
//                                 textAlign: "center",
//                                 borderRight: i < 3 ? "1px solid #E5E7EB" : "none",
//                             }}>
//                                 <div style={{ fontSize: "clamp(22px,2.2vw,30px)", fontWeight: 800, color: NAVY, letterSpacing: "-0.02em" }}>
//                                     {num}
//                                 </div>
//                                 <div style={{ fontSize: 13, color: MUTED, marginTop: 6 }}>{label}</div>
//                             </div>
//                         ))}
//                     </div>
//                 </div>
//             </section>

//             {/* ════════════════════════════════════════════
//           WHY CHOOSE HOSPILINK
//       ════════════════════════════════════════════ */}
//             <section ref={featureRef} style={{ borderTop: "1px solid #F3F4F6", paddingBlock: "clamp(56px,7vw,96px)" }}>
//                 <div className="container">
//                     <div className="why-flex" style={{ display: "flex", gap: "clamp(32px,5vw,72px)", alignItems: "center" }}>
//                         {/* Photo */}
//                         <div className="why-img" style={{
//                             flex: "0 0 clamp(240px,34vw,420px)",
//                             height: "clamp(280px,34vw,400px)",
//                             borderRadius: 12,
//                             overflow: "hidden",
//                             boxShadow: "0 4px 28px rgba(0,0,0,.10)",
//                         }}>
//                             <img
//                                 src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=700&q=80&fit=crop"
//                                 alt="Medical team"
//                                 style={{ width: "100%", height: "100%", objectFit: "cover" }}
//                             />
//                         </div>

//                         {/* Features list */}
//                         <div style={{ flex: 1 }}>
//                             <h2 style={{ fontSize: "clamp(22px,2.5vw,32px)", fontWeight: 800, color: NAVY, marginBottom: 8, letterSpacing: "-0.02em" }}>
//                                 Why Choose Hospilink
//                             </h2>
//                             <p style={{ fontSize: 14, color: MUTED, marginBottom: 32, lineHeight: 1.6 }}>
//                                 Comprehensive solution for modern healthcare staffing needs
//                             </p>
//                             {[
//                                 { Icon: BrainIcon, title: "Smart Staff Matching", desc: "AI-powered matching system connects hospitals with the right medical professionals based on skills, availability, and preferences." },
//                                 { Icon: ClockIcon, title: "Real Time Scheduling", desc: "Dynamic duty management with instant notifications, conflict prevention, and automated scheduling for optimal staff utilization." },
//                                 { Icon: ShieldIcon, title: "Verified Professionals", desc: "All medical staff are thoroughly verified with credentials, licenses, and background checks for complete peace of mind." },
//                             ].map(({ Icon, title, desc }) => (
//                                 <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 22 }}>
//                                     <div style={{
//                                         width: 38, height: 38, minWidth: 38, borderRadius: 8,
//                                         border: "1px solid #E5E7EB", background: "#fff",
//                                         display: "flex", alignItems: "center", justifyContent: "center",
//                                     }}>
//                                         <Icon />
//                                     </div>
//                                     <div>
//                                         <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{title}</div>
//                                         <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.7 }}>{desc}</div>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 </div>
//             </section>

//             {/* ════════════════════════════════════════════
//           SERVICES
//       ════════════════════════════════════════════ */}
//             <section ref={solutionRef} style={{ borderTop: "1px solid #F3F4F6", paddingBlock: "clamp(56px,7vw,96px)" }}>
//                 <div className="container">
//                     <h2 style={{
//                         textAlign: "center",
//                         fontSize: "clamp(18px,2vw,26px)",
//                         fontWeight: 800, color: NAVY,
//                         marginBottom: 52, lineHeight: 1.3,
//                         letterSpacing: "-0.02em",
//                     }}>
//                         Empowering Hospitals with Reliable Doctor<br />Workforce Management Services
//                     </h2>

//                     <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
//                         <button className="arr" onClick={() => setCarouselIdx(i => Math.max(0, i - 1))} disabled={carouselIdx === 0}>
//                             <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
//                         </button>

//                         <div className="svc-row" style={{ display: "flex", flex: 1, gap: 0 }}>
//                             {services.slice(carouselIdx, carouselIdx + 3).map(({ Icon, title, desc }, i) => (
//                                 <div key={title} className="service-card" style={{
//                                     borderRight: i < 2 ? "none" : "1px solid #E5E7EB",
//                                     borderLeft: i === 0 ? "1px solid #E5E7EB" : "none",
//                                     borderRadius: i === 0 ? "8px 0 0 8px" : i === 2 ? "0 8px 8px 0" : "0",
//                                 }}>
//                                     <div style={{
//                                         width: 56, height: 56, borderRadius: "50%",
//                                         border: "1.5px solid #E5E7EB", background: "#fff",
//                                         display: "flex", alignItems: "center", justifyContent: "center",
//                                         margin: "0 auto 18px",
//                                     }}>
//                                         <Icon />
//                                     </div>
//                                     <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 10 }}>{title}</div>
//                                     <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.75 }}>{desc}</div>
//                                 </div>
//                             ))}
//                         </div>

//                         <button className="arr" onClick={() => setCarouselIdx(i => Math.min(maxIdx, i + 1))} disabled={carouselIdx >= maxIdx}>
//                             <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
//                         </button>
//                     </div>
//                 </div>
//             </section>

//             {/* ════════════════════════════════════════════
//           HOW IT WORKS
//       ════════════════════════════════════════════ */}
//             <section ref={aboutRef} style={{ borderTop: "1px solid #F3F4F6", paddingBlock: "clamp(56px,7vw,96px)" }}>
//                 <div className="container">
//                     <h2 style={{ fontSize: "clamp(22px,2.5vw,30px)", fontWeight: 800, color: NAVY, marginBottom: 36, letterSpacing: "-0.02em" }}>
//                         How It Works
//                     </h2>
//                     {[
//                         { n: "1", title: "Create Account", desc: "Sign up as a hospital or medical staff member with a simple registration process." },
//                         { n: "2", title: "Complete Profile", desc: "Add your professional details, preferences, and availability for better matching." },
//                         { n: "3", title: "Start Connecting", desc: "Hospitals post duties and staff accept them instantly through our platform." },
//                     ].map(({ n, title, desc }) => (
//                         <div key={n} className="steps" style={{
//                             display: "grid", gridTemplateColumns: "60px 240px 1fr",
//                             alignItems: "center", padding: "24px 0",
//                             borderBottom: "1px solid #F3F4F6",
//                         }}>
//                             <div style={{
//                                 width: 36, height: 36, borderRadius: "50%",
//                                 border: "1.5px solid #D1D5DB",
//                                 display: "flex", alignItems: "center", justifyContent: "center",
//                                 fontSize: 14, fontWeight: 600, color: "#374151",
//                             }}>{n}</div>
//                             <div style={{ fontSize: "clamp(15px,1.6vw,18px)", fontWeight: 700, color: NAVY }}>{title}</div>
//                             <div className="step-desc" style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.7 }}>{desc}</div>
//                         </div>
//                     ))}
//                 </div>
//             </section>

//             {/* ════════════════════════════════════════════
//           CTA
//       ════════════════════════════════════════════ */}
//             <section style={{ background: NAVY, paddingBlock: "clamp(48px,6vw,80px)" }}>
//                 <div className="container">
//                     <div className="cta-flex" style={{ display: "flex", alignItems: "center", gap: "clamp(28px,4vw,64px)" }}>
//                         <div className="cta-img" style={{
//                             flex: "0 0 clamp(140px,18vw,210px)",
//                             height: "clamp(190px,25vw,280px)",
//                             borderRadius: 12, overflow: "hidden", flexShrink: 0,
//                         }}>
//                             <img
//                                 src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=85&fit=crop&crop=top"
//                                 alt="Doctor"
//                                 style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top center" }}
//                             />
//                         </div>
//                         <div>
//                             <h2 style={{ fontSize: "clamp(24px,3vw,40px)", fontWeight: 800, color: "#fff", lineHeight: 1.15, marginBottom: 14, letterSpacing: "-0.02em" }}>
//                                 Ready to Transform Healthcare Staffing?
//                             </h2>
//                             <p style={{ fontSize: 14, color: "#9CA3AF", lineHeight: 1.75, marginBottom: 28, maxWidth: 460 }}>
//                                 Join thousands of healthcare professionals already using Hospilink
//                             </p>
//                             <button className="white-btn">Get Started Today</button>
//                         </div>
//                     </div>
//                 </div>
//             </section>

//             {/* ════════════════════════════════════════════
//           FAQ
//       ════════════════════════════════════════════ */}
//             <section ref={faqRef} style={{ paddingBlock: "clamp(56px,7vw,96px)" }}>
//                 <div className="container">
//                     <div className="faq-layout" style={{ display: "flex", gap: "clamp(32px,5vw,80px)" }}>
//                         <div style={{ flex: "0 0 clamp(180px,22vw,260px)" }}>
//                             <h2 style={{ fontSize: "clamp(20px,2.2vw,28px)", fontWeight: 800, color: NAVY, marginBottom: 14, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
//                                 Frequently Asked Questions
//                             </h2>
//                             <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.75 }}>
//                                 Find answers to common questions about Hospilink, healthcare staffing, account management, and platform services.
//                             </p>
//                         </div>
//                         <div style={{ flex: 1 }}>
//                             {faqs.map((item, i) => (
//                                 <div key={i} className="faq-item">
//                                     <button className="faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
//                                         <span style={{ fontSize: 14, fontWeight: 500, color: NAVY }}>{item.q}</span>
//                                         <ChevDown open={openFaq === i} />
//                                     </button>
//                                     {openFaq === i && (
//                                         <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.75, paddingBottom: 18, paddingRight: 32 }}>
//                                             {item.a}
//                                         </div>
//                                     )}
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 </div>
//             </section>

//             {/* ════════════════════════════════════════════
//           FOOTER
//       ════════════════════════════════════════════ */}
//             <footer style={{ background: NAVY, paddingTop: 56, paddingBottom: 24 }}>
//                 <div className="container">
//                     <div className="footer-grid" style={{
//                         display: "grid",
//                         gridTemplateColumns: "2.2fr 1fr 1fr 1fr",
//                         gap: "clamp(24px,4vw,48px)",
//                         paddingBottom: 40,
//                         borderBottom: "1px solid rgba(255,255,255,.07)",
//                         marginBottom: 20,
//                     }}>
//                         {/* Brand */}
//                         <div>
//                             <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
//                                 <div style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
//                                     <LinkIcon />
//                                 </div>
//                                 <span style={{ color: "#fff", fontWeight: 700, fontSize: 14, letterSpacing: "0.04em" }}>HOSPILINK</span>
//                             </div>
//                             <p style={{ fontSize: 12.5, color: "#9CA3AF", lineHeight: 1.75, maxWidth: 210, marginBottom: 18 }}>
//                                 Connect with us for seamless healthcare staffing solutions and opportunities.
//                             </p>
//                             <div style={{ display: "flex", gap: 8 }}>
//                                 {[
//                                     <svg key="ig" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1" fill="#9CA3AF" /></svg>,
//                                     <svg key="tw" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 16 2c-2.5 0-4.5 2-4.5 4.5 0 .35.04.7.1 1C7.69 7.34 4.07 5.35 1.64 2.36A4.48 4.48 0 0 0 1 4.57c0 1.57.8 2.95 2 3.75A4.49 4.49 0 0 1 .96 7.8v.06A4.5 4.5 0 0 0 4.57 12.3a4.49 4.49 0 0 1-2.03.08 4.5 4.5 0 0 0 4.2 3.12A9 9 0 0 1 0 17.54 12.76 12.76 0 0 0 6.91 20c8.3 0 12.84-6.87 12.84-12.83 0-.2 0-.39-.01-.58A9.18 9.18 0 0 0 22 4.6a9.04 9.04 0 0 1-2.6.71A4.5 4.5 0 0 0 21.4 3z" /></svg>,
//                                     <svg key="li" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>,
//                                     <svg key="yt" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>,
//                                 ].map((icon, i) => (
//                                     <div key={i} style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,.09)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
//                                         {icon}
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>

//                         <div>
//                             <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>For Hospitals</div>
//                             {["Post Duties", "Find Staff", "Manage Schedules"].map(l => <button key={l} className="flink">{l}</button>)}
//                         </div>
//                         <div>
//                             <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>For Medical Staff</div>
//                             {["Find Opportunities", "Manage Availability", "Track Earnings"].map(l => <button key={l} className="flink">{l}</button>)}
//                         </div>
//                         <div>
//                             <div style={{ color: "#fff", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Support</div>
//                             <button className="flink">Help Center</button>
//                             <div onPress={() => router.push("/privacy-policy")}>
//                                 <button className="flink">Help Center</button>
//                             </div>
//                         </div>
//                     </div>

//                     <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
//                         <span style={{ fontSize: 12, color: "#6B7280" }}>© 2025 Hospilink. All rights reserved.</span>
//                         <TouchableOpacity onPress={() => router.push("/privacy-policy")}>
//                             <Text style={[styles.flink, { marginBottom: 0 }]}>Privacy Policy</Text>
//                         </TouchableOpacity>
//                     </div>
//                 </div>
//             </footer>
//         </div>
//     );
// }




import React, { useRef, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    StatusBar,
    Image,
    Platform,
} from "react-native";
import { useRouter } from "expo-router";
import Svg, {
    Path,
    Rect,
    Circle,
    Polyline,
    Line,
    Polygon,
} from "react-native-svg";

const NAVY = "#0B1730";
const MUTED = "#6B7280";
const BORDER = "#E5E7EB";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const isDesktop = SCREEN_WIDTH >= 900;

interface Service {
    Icon: React.FC;
    title: string;
    desc: string;
}

interface FAQ {
    q: string;
    a: string;
}

const LinkIcon: React.FC<{ size?: number; color?: string }> = ({
    size = 17,
    color = "#fff",
}) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
            d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Path
            d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

const BrainIcon: React.FC = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path
            d="M9.5 2a2.5 2.5 0 0 1 5 0"
            stroke="#374151"
            strokeWidth="1.5"
        />
    </Svg>
);

const ClockIcon: React.FC = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="9" stroke="#374151" strokeWidth="1.5" />
        <Polyline
            points="12 7 12 12 15 15"
            stroke="#374151"
            strokeWidth="1.5"
            strokeLinecap="round"
        />
    </Svg>
);

const ShieldIcon: React.FC = () => (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path
            d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5"
            stroke="#374151"
            strokeWidth="1.5"
        />
    </Svg>
);

const PayIcon: React.FC = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Rect
            x="2"
            y="5"
            width="20"
            height="14"
            rx="3"
            stroke={NAVY}
            strokeWidth="1.5"
        />
    </Svg>
);

const DutyIcon: React.FC = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Rect
            x="3"
            y="4"
            width="18"
            height="18"
            rx="2"
            stroke={NAVY}
            strokeWidth="1.5"
        />
    </Svg>
);

const SuperviseIcon: React.FC = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="8" r="4" stroke={NAVY} strokeWidth="1.5" />
    </Svg>
);

const ChevronDownIcon: React.FC<{ open: boolean }> = ({ open }) => (
    <Svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        style={{
            transform: [{ rotate: open ? "180deg" : "0deg" }],
        }}
    >
        <Polyline
            points="6 9 12 15 18 9"
            stroke="#9CA3AF"
            strokeWidth="2"
            strokeLinecap="round"
        />
    </Svg>
);

const services: Service[] = [
    {
        Icon: PayIcon,
        title: "One-Hand Payments",
        desc: "Integrated payment system for seamless, one-hand processing from onboarding and payouts to salaries.",
    },
    {
        Icon: DutyIcon,
        title: "Duty Management",
        desc: "Streamlined scheduling of duty rosters, shift management, and attendance tracking.",
    },
    {
        Icon: SuperviseIcon,
        title: "Clinical Supervision",
        desc: "Experienced intensivists provide clinical oversight and quality compliance.",
    },
];

const faqs: FAQ[] = [
    {
        q: "What services does Hospilink provide?",
        a: "Hospilink provides AI-powered healthcare staffing solutions.",
    },
    {
        q: "Who can use Hospilink?",
        a: "Hospitals and medical professionals can use Hospilink.",
    },
    {
        q: "How does Hospilink verify medical professionals?",
        a: "All professionals undergo strict verification checks.",
    },
    {
        q: "Is my personal and professional information secure?",
        a: "Yes, all information is securely encrypted.",
    },
    {
        q: "Is there a registration fee to join Hospilink?",
        a: "Registration is free for medical staff.",
    },
];

export default function LandingPage() {
    const router = useRouter();

    const scrollRef = useRef<ScrollView>(null);

    const featureY = useRef(0);
    const solutionY = useRef(0);
    const aboutY = useRef(0);

    const [faqOpen, setFaqOpen] = useState<number | null>(null);

    const scrollTo = (y: number) => {
        scrollRef.current?.scrollTo({
            y,
            animated: true,
        });
    };

    return (
        <View style={styles.root}>
            <StatusBar
                backgroundColor={NAVY}
                barStyle="light-content"
            />

            {/* NAVBAR */}

            <View style={styles.navbar}>
                <View style={styles.container}>
                    <View style={styles.navInner}>
                        <TouchableOpacity style={styles.logoRow}
                                    onPress={() =>
                                        router.push("/auth/home")
                                    }
                                >
                                    <View style={styles.logoIcon}>
                                        <LinkIcon />
                                    </View>

                                    <Text style={styles.logoText}>
                                        HOSPILINK
                                    </Text>
                                </TouchableOpacity>

                        {isDesktop && (
                            <View style={styles.desktopNav}>
                                <TouchableOpacity
                                    onPress={() => scrollTo(featureY.current)}
                                >
                                    <Text style={styles.navLink}>
                                        Features
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => scrollTo(solutionY.current)}
                                >
                                    <Text style={styles.navLink}>
                                        Solutions
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => scrollTo(aboutY.current)}
                                >
                                    <Text style={styles.navLink}>
                                        About Us
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() =>
                                        router.push("/auth/login")
                                    }  style={styles.whiteBtn}>
                                    <Text style={styles.whiteBtnText}>
                                        Sign In
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* BODY */}

            <ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
            >
                {/* HERO */}

                <View style={styles.container}>
                    <View style={styles.heroContainer}>
                        <View style={styles.heroLeft}>
                            <Text style={styles.heroTitle}>
                                Revolutionizing Healthcare Staff
                                Management
                            </Text>

                            <Text style={styles.heroSubtitle}>
                                Connect hospitals with qualified medical
                                staff seamlessly
                            </Text>

                            <TouchableOpacity style={styles.darkBtn}>
                                <Text style={styles.darkBtnText}>
                                    Sign In
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.heroRight}>
                            <View style={styles.heroShape} />

                            <Image
                                source={require("../../../assets/Images/hero-doctor.png")}
                                style={styles.heroImage}
                                resizeMode="contain"
                            />
                        </View>
                    </View>

                    {/* STATS */}

                    <View style={styles.statsBar}>
                        {[
                            ["99.9%", "Satisfaction Rate"],
                            ["500+", "Hospitals"],
                            ["10,000+", "Medical Staff"],
                            ["50,000+", "Duties Completed"],
                        ].map(([num, label], i) => (
                            <View
                                key={i}
                                style={[
                                    styles.statItem,
                                    i !== 3 && styles.statBorder,
                                ]}
                            >
                                <Text style={styles.statNumber}>
                                    {num}
                                </Text>

                                <Text style={styles.statLabel}>
                                    {label}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* WHY CHOOSE */}

                <View
                    onLayout={(e) => {
                        featureY.current =
                            e.nativeEvent.layout.y;
                    }}
                    style={styles.section}
                >
                    <View style={styles.container}>
                        <View style={styles.whyContainer}>
                            <Image
                                source={require("../../../assets/Images/hero-doctor.png")}
                                style={styles.teamImage}
                                resizeMode="cover"
                            />

                            <View style={styles.whyContent}>
                                <Text style={styles.sectionTitle}>
                                    Why Choose Hospilink
                                </Text>

                                <Text style={styles.sectionSubtitle}>
                                    Comprehensive solution for modern
                                    healthcare staffing needs
                                </Text>

                                {[
                                    {
                                        Icon: BrainIcon,
                                        title: "Smart Staff Matching",
                                    },
                                    {
                                        Icon: ClockIcon,
                                        title: "Real Time Scheduling",
                                    },
                                    {
                                        Icon: ShieldIcon,
                                        title: "Verified Professionals",
                                    },
                                ].map(({ Icon, title }, i) => (
                                    <View
                                        key={i}
                                        style={styles.featureRow}
                                    >
                                        <View style={styles.featureIcon}>
                                            <Icon />
                                        </View>

                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.featureTitle}>
                                                {title}
                                            </Text>

                                            <Text style={styles.featureDesc}>
                                                AI-powered staffing system for
                                                healthcare professionals.
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>

                {/* SERVICES */}

                <View
                    onLayout={(e) => {
                        solutionY.current =
                            e.nativeEvent.layout.y;
                    }}
                    style={styles.section}
                >
                    <View style={styles.container}>
                        <Text style={styles.centerTitle}>
                            Empowering Hospitals with Reliable
                            Doctor Workforce Management Services
                        </Text>

                        <View style={styles.serviceRow}>
                            {services.map((item, i) => (
                                <View
                                    key={i}
                                    style={styles.serviceCard}
                                >
                                    <View style={styles.serviceIcon}>
                                        <item.Icon />
                                    </View>

                                    <Text style={styles.serviceTitle}>
                                        {item.title}
                                    </Text>

                                    <Text style={styles.serviceDesc}>
                                        {item.desc}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>

                {/* HOW IT WORKS */}

                <View
                    onLayout={(e) => {
                        aboutY.current =
                            e.nativeEvent.layout.y;
                    }}
                    style={styles.section}
                >
                    <View style={styles.container}>
                        <Text style={styles.sectionTitle}>
                            How It Works
                        </Text>

                        {[
                            "Create Account",
                            "Complete Profile",
                            "Start Connecting",
                        ].map((step, i) => (
                            <View
                                key={i}
                                style={styles.stepRow}
                            >
                                <Text style={styles.stepNumber}>
                                    {i + 1}
                                </Text>

                                <Text style={styles.stepTitle}>
                                    {step}
                                </Text>

                                <Text style={styles.stepDesc}>
                                    Sign up as a hospital or medical
                                    professional.
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* CTA */}

                <View style={styles.ctaSection}>
                    <View style={styles.container}>
                        <View style={styles.ctaWrapper}>
                            <Image
                                source={require("../../../assets/Images/hero-doctor.png")}
                                style={styles.ctaImage}
                            />

                            <View style={styles.ctaContent}>
                                <Text style={styles.ctaTitle}>
                                    Ready to Transform Healthcare
                                    Staffing?
                                </Text>

                                <Text style={styles.ctaSubtitle}>
                                    Join thousands of healthcare
                                    professionals already using
                                    Hospilink
                                </Text>

                                <TouchableOpacity
                                    style={styles.whiteBtn}
                                >
                                    <Text style={styles.whiteBtnText}>
                                        Get Started Today
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>

                {/* FAQ */}

                <View style={styles.section}>
                    <View style={styles.container}>
                        <View style={styles.faqWrapper}>
                            <View style={styles.faqLeft}>
                                <Text style={styles.sectionTitle}>
                                    Frequently Asked Questions
                                </Text>

                                <Text style={styles.sectionSubtitle}>
                                    Find answers to common questions
                                    about Hospilink.
                                </Text>
                            </View>

                            <View style={styles.faqRight}>
                                {faqs.map((faq, i) => (
                                    <View
                                        key={i}
                                        style={styles.faqItem}
                                    >
                                        <TouchableOpacity
                                            style={styles.faqButton}
                                            onPress={() =>
                                                setFaqOpen(
                                                    faqOpen === i ? null : i
                                                )
                                            }
                                        >
                                            <Text
                                                style={styles.faqQuestion}
                                            >
                                                {faq.q}
                                            </Text>

                                            <ChevronDownIcon
                                                open={faqOpen === i}
                                            />
                                        </TouchableOpacity>

                                        {faqOpen === i && (
                                            <Text style={styles.faqAnswer}>
                                                {faq.a}
                                            </Text>
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>

                {/* FOOTER */}

                <View style={styles.footer}>
                    <View style={styles.container}>
                        <View style={styles.footerGrid}>
                            <View>

                                <TouchableOpacity style={styles.logoRow}
                                    onPress={() =>
                                        router.push("/auth/contact-us")
                                    }
                                >
                                    <View style={styles.logoIcon}>
                                        <LinkIcon />
                                    </View>

                                    <Text style={styles.logoText}>
                                        HOSPILINK
                                    </Text>
                                </TouchableOpacity>

                                <Text style={styles.footerText}>
                                    Connect with us for seamless
                                    healthcare staffing solutions.
                                </Text>
                            </View>

                            <View>
                                <Text style={styles.footerHeading}>
                                    For Hospitals
                                </Text>

                                <Text style={styles.footerLink}>
                                    Post Duties
                                </Text>

                                <Text style={styles.footerLink}>
                                    Find Staff
                                </Text>
                            </View>

                            <View>
                                <Text style={styles.footerHeading}>
                                    Support
                                </Text>

                                <TouchableOpacity
                                    onPress={() =>
                                        router.push("/auth/contact-us")
                                    }
                                >
                                    <Text style={styles.footerLink}>
                                        Contact Us
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() =>
                                        router.push(
                                            "/auth/privacy-policy"
                                        )
                                    }
                                >
                                    <Text style={styles.footerLink}>
                                        Privacy Policy
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.footerBottom}>
                            <Text style={styles.copyText}>
                                © 2025 Hospilink. All rights
                                reserved.
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#fff",
    },

    container: {
        width: "100%",
        maxWidth: 1200,
        alignSelf: "center",
        paddingHorizontal: 20,
    },

    navbar: {
        height: 64,
        backgroundColor: NAVY,
        justifyContent: "center",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 5,
            },
        }),
    },

    navInner: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    logoRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    logoIcon: {
        width: 34,
        height: 34,
        borderRadius: 8,
        backgroundColor: "rgba(255,255,255,0.08)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },

    logoText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 15,
        letterSpacing: 1,
    },

    desktopNav: {
        flexDirection: "row",
        alignItems: "center",
        gap: 36,
    },

    navLink: {
        color: "#E5E7EB",
        fontSize: 14,
        fontWeight: "500",
    },

    heroContainer: {
        flexDirection: isDesktop ? "row" : "column",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 70,
        gap: 60,
    },

    heroLeft: {
        flex: 1,
        maxWidth: 580,
    },

    heroTitle: {
        fontSize: isDesktop ? 58 : 36,
        lineHeight: isDesktop ? 66 : 44,
        fontWeight: "800",
        color: NAVY,
        marginBottom: 20,
        letterSpacing: -2,
    },

    heroSubtitle: {
        fontSize: 16,
        color: MUTED,
        lineHeight: 28,
        marginBottom: 30,
        maxWidth: 400,
    },

    heroRight: {
        width: isDesktop ? 430 : "100%",
        height: isDesktop ? 480 : 320,
        position: "relative",
        justifyContent: "flex-end",
    },

    heroShape: {
        position: "absolute",
        width: "100%",
        height: "80%",
        backgroundColor: "#E7EEF8",
        borderRadius: 120,
        bottom: 0,
    },

    heroImage: {
        width: "100%",
        height: "100%",
    },

    darkBtn: {
        backgroundColor: NAVY,
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 8,
        alignSelf: "flex-start",
    },

    darkBtnText: {
        color: "#fff",
        fontWeight: "600",
    },

    whiteBtn: {
        backgroundColor: "#fff",
        paddingHorizontal: 26,
        paddingVertical: 13,
        borderRadius: 8,
        alignSelf: "flex-start",
    },

    whiteBtnText: {
        color: NAVY,
        fontWeight: "600",
    },

    statsBar: {
        flexDirection: "row",
        marginTop: 40,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 10,
        overflow: "hidden",
        marginBottom: 60,
    },

    statItem: {
        flex: 1,
        paddingVertical: 22,
        alignItems: "center",
    },

    statBorder: {
        borderRightWidth: 1,
        borderRightColor: BORDER,
    },

    statNumber: {
        fontSize: 24,
        fontWeight: "800",
        color: NAVY,
    },

    statLabel: {
        fontSize: 12,
        color: MUTED,
        marginTop: 6,
    },

    section: {
        paddingVertical: 70,
    },

    whyContainer: {
        flexDirection: isDesktop ? "row" : "column",
        gap: 50,
        alignItems: "center",
    },

    teamImage: {
        width: isDesktop ? 420 : "100%",
        height: 320,
        borderRadius: 8,
    },

    whyContent: {
        flex: 1,
    },

    sectionTitle: {
        fontSize: 40,
        fontWeight: "800",
        color: NAVY,
        marginBottom: 14,
        lineHeight: 48,
    },

    sectionSubtitle: {
        fontSize: 14,
        color: MUTED,
        lineHeight: 24,
        marginBottom: 28,
    },

    featureRow: {
        flexDirection: "row",
        gap: 16,
        marginBottom: 24,
    },

    featureIcon: {
        width: 44,
        height: 44,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
    },

    featureTitle: {
        fontWeight: "700",
        color: NAVY,
        marginBottom: 6,
    },

    featureDesc: {
        color: MUTED,
        lineHeight: 22,
        fontSize: 14,
    },

    centerTitle: {
        fontSize: 38,
        fontWeight: "800",
        textAlign: "center",
        lineHeight: 50,
        marginBottom: 50,
        color: NAVY,
    },

    serviceRow: {
        flexDirection: isDesktop ? "row" : "column",
        gap: 20,
    },

    serviceCard: {
        flex: 1,
        borderWidth: 1,
        borderColor: BORDER,
        padding: 30,
        alignItems: "center",
    },

    serviceIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: BORDER,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
    },

    serviceTitle: {
        fontWeight: "700",
        marginBottom: 12,
        color: NAVY,
    },

    serviceDesc: {
        color: MUTED,
        textAlign: "center",
        lineHeight: 22,
        fontSize: 14,
    },

    stepRow: {
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
        paddingVertical: 28,
    },

    stepNumber: {
        width: 80,
        fontSize: 28,
        fontWeight: "600",
        color: NAVY,
    },

    stepTitle: {
        width: 260,
        fontSize: 24,
        fontWeight: "700",
        color: NAVY,
    },

    stepDesc: {
        flex: 1,
        color: MUTED,
        lineHeight: 24,
    },

    ctaSection: {
        backgroundColor: NAVY,
        paddingVertical: 80,
    },

    ctaWrapper: {
        flexDirection: isDesktop ? "row" : "column",
        gap: 50,
        alignItems: "center",
    },

    ctaImage: {
        width: isDesktop ? 240 : "100%",
        height: 280,
        borderRadius: 10,
    },

    ctaContent: {
        flex: 1,
    },

    ctaTitle: {
        color: "#fff",
        fontSize: 52,
        lineHeight: 60,
        fontWeight: "800",
        marginBottom: 18,
    },

    ctaSubtitle: {
        color: "#A5B4C7",
        fontSize: 16,
        lineHeight: 28,
        marginBottom: 30,
    },

    faqWrapper: {
        flexDirection: isDesktop ? "row" : "column",
        gap: 60,
    },

    faqLeft: {
        width: isDesktop ? 300 : "100%",
    },

    faqRight: {
        flex: 1,
    },

    faqItem: {
        borderBottomWidth: 1,
        borderBottomColor: BORDER,
    },

    faqButton: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 24,
    },

    faqQuestion: {
        fontSize: 16,
        color: NAVY,
        fontWeight: "500",
        flex: 1,
        paddingRight: 20,
    },

    faqAnswer: {
        color: MUTED,
        lineHeight: 24,
        paddingBottom: 20,
    },

    footer: {
        backgroundColor: NAVY,
        paddingTop: 80,
        paddingBottom: 30,
    },

    footerGrid: {
        flexDirection: isDesktop ? "row" : "column",
        justifyContent: "space-between",
        gap: 40,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.08)",
        paddingBottom: 40,
    },

    footerHeading: {
        color: "#fff",
        fontWeight: "700",
        marginBottom: 18,
    },

    footerText: {
        color: "#A5B4C7",
        lineHeight: 24,
        marginTop: 14,
        maxWidth: 240,
    },

    footerLink: {
        color: "#A5B4C7",
        marginBottom: 12,
    },

    footerBottom: {
        paddingTop: 24,
    },

    copyText: {
        color: "#7B8794",
        fontSize: 13,
    },
});