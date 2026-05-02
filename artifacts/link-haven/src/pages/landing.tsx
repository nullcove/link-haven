import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Bookmark,
  FolderOpen,
  Hash,
  Search,
  Star,
  Archive,
  Globe,
  Zap,
  Shield,
  Download,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: FolderOpen,
    title: "Smart Collections",
    desc: "Organise bookmarks into coloured, icon-tagged collections. Nested, flexible, and fast.",
    color: "#6366f1",
  },
  {
    icon: Hash,
    title: "Powerful Tagging",
    desc: "Tag anything. Filter by multiple tags at once. Your taxonomy, your rules.",
    color: "#8b5cf6",
  },
  {
    icon: Search,
    title: "Instant Search",
    desc: "Find anything across titles, descriptions, and URLs the moment you type.",
    color: "#a78bfa",
  },
  {
    icon: Star,
    title: "Favourites",
    desc: "Star the links that matter most. Your favourite tab, always one click away.",
    color: "#f59e0b",
  },
  {
    icon: Archive,
    title: "Read-Later Archive",
    desc: "Archive instead of delete. Every link you've ever saved stays accessible.",
    color: "#10b981",
  },
  {
    icon: Shield,
    title: "Fully Private",
    desc: "Your data lives on your own server. No ads, no tracking, no third parties.",
    color: "#ef4444",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Paste any URL",
    desc: "Drop a link and Link Haven fetches the title, description, favicon, and preview image automatically.",
  },
  {
    n: "02",
    title: "Organise it",
    desc: "Assign it to a collection, add tags, write a personal note — all in one focused form.",
  },
  {
    n: "03",
    title: "Find it again",
    desc: "Search, filter by type, browse by tag or collection. Rediscovery is the whole point.",
  },
];

const STATS = [
  { n: "100%", label: "Open Source" },
  { n: "0", label: "Ads or Tracking" },
  { n: "5+", label: "View Modes" },
  { n: "∞", label: "Bookmarks" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080810] text-white selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-white/5 backdrop-blur-xl bg-[#080810]/80">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm text-white/50">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how" className="hover:text-white transition-colors">How it works</a>
            <a href="#why" className="hover:text-white transition-colors">Why Link Haven</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/50 hover:text-white transition-colors hidden sm:block">
              Sign in
            </Link>
            <Link href="/signup">
              <button className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium transition-colors">
                Get started
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-36 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px]" />
          <div className="absolute top-40 left-1/4 w-[300px] h-[300px] bg-violet-700/10 rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-8">
              <div className="size-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Open-source · Self-hostable · Built for focus
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-[0.95]">
              Your bookmarks,{" "}
              <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                finally at peace.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/45 max-w-2xl mx-auto mb-10 leading-relaxed">
              Link Haven is a beautiful, private bookmark manager. Save links, organise collections,
              tag everything — and actually find things again. A Raindrop.io alternative you fully own.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/signup">
                <button className="group flex items-center gap-2 px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base transition-all shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:shadow-[0_0_60px_rgba(99,102,241,0.4)]">
                  Get started — free
                  <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link href="/login">
                <button className="flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/10 hover:border-white/20 text-white/70 hover:text-white font-medium text-base transition-all hover:bg-white/5">
                  Sign in
                </button>
              </Link>
            </div>
          </motion.div>

          {/* App preview mockup */}
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-20 relative"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0f0f1a] shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
              <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5 bg-[#111120]">
                <div className="flex gap-1.5">
                  <div className="size-3 rounded-full bg-[#ff5f57]" />
                  <div className="size-3 rounded-full bg-[#febc2e]" />
                  <div className="size-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="px-4 py-1 rounded-md bg-white/5 border border-white/5 text-xs text-white/30 font-mono">
                    link-haven — All Bookmarks
                  </div>
                </div>
              </div>
              <div className="flex h-72 md:h-96">
                <div className="w-48 border-r border-white/5 bg-[#0d0d18] p-3 flex flex-col gap-1 shrink-0 hidden sm:flex">
                  {["All Bookmarks", "Favourites", "Archive"].map((item, i) => (
                    <div key={i} className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs ${i === 0 ? "bg-indigo-500/20 text-indigo-300" : "text-white/30"}`}>
                      <div className={`size-1.5 rounded-full ${i === 0 ? "bg-indigo-400" : "bg-white/20"}`} />
                      {item}
                    </div>
                  ))}
                  <div className="mt-3 px-2 text-[10px] text-white/20 uppercase tracking-wider">Collections</div>
                  {[
                    { name: "Design", color: "#6366f1" },
                    { name: "Development", color: "#10b981" },
                    { name: "Reading", color: "#f59e0b" },
                  ].map((c) => (
                    <div key={c.name} className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-white/30">
                      <div className="size-2 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </div>
                  ))}
                </div>
                <div className="flex-1 p-4 grid grid-cols-2 md:grid-cols-3 gap-3 content-start overflow-hidden">
                  {[
                    { title: "Figma", domain: "figma.com", tag: "design", color: "#6366f1" },
                    { title: "GitHub", domain: "github.com", tag: "dev", color: "#10b981" },
                    { title: "MDN Web Docs", domain: "developer.mozilla.org", tag: "docs", color: "#8b5cf6" },
                    { title: "Tailwind CSS", domain: "tailwindcss.com", tag: "css", color: "#06b6d4" },
                    { title: "Linear", domain: "linear.app", tag: "tools", color: "#8b5cf6" },
                    { title: "Paul Graham", domain: "paulgraham.com", tag: "reading", color: "#f59e0b" },
                  ].map((card, i) => (
                    <div key={i} className="rounded-lg border border-white/5 bg-[#141425] p-3 flex flex-col gap-2">
                      <div className="size-7 rounded-md flex items-center justify-center" style={{ backgroundColor: card.color + "22" }}>
                        <Globe className="size-3.5" style={{ color: card.color }} />
                      </div>
                      <div className="text-xs font-medium text-white/80 line-clamp-1">{card.title}</div>
                      <div className="text-[10px] text-white/25 line-clamp-1">{card.domain}</div>
                      <div className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30 w-fit">#{card.tag}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#080810] to-transparent pointer-events-none" />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-14 border-y border-white/5">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">{s.n}</div>
              <div className="text-sm text-white/35">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Everything you need.{" "}
              <span className="text-white/30">Nothing you don't.</span>
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">
              Inspired by Raindrop.io but built for people who want to own their own data.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="group p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] transition-all"
              >
                <div
                  className="size-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: f.color + "18", border: `1px solid ${f.color}30` }}
                >
                  <f.icon className="size-5" style={{ color: f.color }} />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">How it works</h2>
            <p className="text-white/40 text-lg">Three steps. Seconds to start.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="text-6xl font-black text-white/5 mb-4 font-mono">{s.n}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="hidden md:block absolute top-16 -right-4 size-6 text-white/10" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Link Haven */}
      <section id="why" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Why not just use Raindrop?</h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto">
              Raindrop is great — until you hit the free tier limits or want control over your own data.
              Link Haven gives you all the features, forever, for free.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: Zap, title: "No paid tier", desc: "Every feature is available from day one. No upsells, no feature gates." },
              { icon: Shield, title: "Your data, your server", desc: "Self-host it. Export it. Delete it. No one else has access to your links." },
              { icon: Globe, title: "Full-text search always", desc: "Raindrop locks full-text search behind Pro. Here it's just... search." },
              { icon: Download, title: "Import from Raindrop", desc: "Bring all your existing bookmarks over in one step. Nothing gets left behind." },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
                <div className="size-10 shrink-0 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <item.icon className="size-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block mb-8 p-px rounded-2xl bg-gradient-to-b from-indigo-500/30 to-transparent">
            <div className="px-10 py-12 rounded-2xl bg-[#0d0d1a]">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Ready to save your web?
              </h2>
              <p className="text-white/40 mb-8 text-lg">
                Free account. No credit card required. Start in seconds.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/signup">
                  <button className="group flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-[0_0_40px_rgba(99,102,241,0.3)]">
                    Create free account
                    <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <Link href="/login">
                  <button className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 font-medium transition-all">
                    Sign in
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo />
          <div className="flex items-center gap-6 text-sm text-white/25">
            <Link href="/login" className="hover:text-white/60 transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-white/60 transition-colors">Sign up</Link>
            <a href="#features" className="hover:text-white/60 transition-colors">Features</a>
          </div>
          <p className="text-sm text-white/20">
            &copy; {new Date().getFullYear()} Link Haven
          </p>
        </div>
      </footer>
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="size-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
        <Bookmark className="size-3.5 text-indigo-400 fill-indigo-500/30" />
      </div>
      <span className="font-bold text-white tracking-tight">Link Haven</span>
    </div>
  );
}
