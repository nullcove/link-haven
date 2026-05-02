import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.5)]">
            <div className="size-3 bg-primary rounded-sm shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
          </div>
          <span className="font-bold text-lg tracking-tight">Link Haven</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Sign In
          </Link>
          <Link href="/signup" className="text-sm font-medium">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)]">
              Get Started
            </Button>
          </Link>
        </nav>
      </header>

      <main>
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(var(--primary),0.15),transparent_50%)]" />
          
          <div className="container max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 text-balance">
                A private sanctuary <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">for your web.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                Quiet, organized, and beautiful. Link Haven is a calm space to collect, organize, and rediscover your bookmarks without the noise.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto text-base px-8 h-12 bg-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(var(--primary),0.3)]">
                    Start Collecting
                  </Button>
                </Link>
                <Link href="/app">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 h-12 border-white/10 hover:bg-white/5">
                    Try without login
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="mt-20 relative mx-auto rounded-xl overflow-hidden border border-white/10 shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
              <img 
                src="/hero.png" 
                alt="Link Haven Interface" 
                className="w-full h-auto rounded-xl"
              />
            </motion.div>
          </div>
        </section>

        <section className="py-20 md:py-32 px-6 bg-white/5">
          <div className="container max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Designed for focus.</h2>
                <p className="text-muted-foreground text-lg mb-6">
                  We stripped away the clutter so you can focus on the content. High-density views when you need them, breathing room when you don't.
                </p>
                <ul className="space-y-4">
                  {[
                    "Nested collections and tagging",
                    "Full-text search across all links",
                    "Beautiful dark mode by default"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-foreground">
                      <div className="size-1.5 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                <img src="/feature1.png" alt="Focus design" className="w-full h-auto" />
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-32 px-6">
          <div className="container max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center flex-row-reverse">
              <div className="order-2 md:order-1 relative rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                <img src="/feature2.png" alt="Organization" className="w-full h-auto" />
              </div>
              <div className="order-1 md:order-2">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Your personal knowledge graph.</h2>
                <p className="text-muted-foreground text-lg mb-6">
                  Connect ideas across your collections with an intuitive tagging system. Rediscover old links through powerful search and smart categorization.
                </p>
                <Link href="/signup">
                  <Button variant="link" className="p-0 h-auto text-primary hover:text-primary/80">
                    See how it works &rarr;
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-10 border-t border-white/5 text-center text-muted-foreground">
        <p className="text-sm">&copy; {new Date().getFullYear()} Link Haven. A calm place for links.</p>
      </footer>
    </div>
  );
}
