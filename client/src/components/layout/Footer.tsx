import { Facebook, Twitter, Instagram, Youtube, Mail } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="w-full bg-secondary text-secondary-foreground py-12 border-t border-border">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="font-heading text-2xl font-bold uppercase italic">
              The <span className="text-primary">Chewth</span>
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Unfiltered sports talk covering the games you love. No corporate scripts, just raw opinions and real analysis.
            </p>
          </div>
          
          <div>
            <h4 className="font-heading text-lg font-semibold mb-4 uppercase">Sports</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/news?cat=NFL"><a className="hover:text-primary">NFL</a></Link></li>
              <li><Link href="/news?cat=NBA"><a className="hover:text-primary">NBA</a></Link></li>
              <li><Link href="/news?cat=CFB"><a className="hover:text-primary">College Football</a></Link></li>
              <li><Link href="/news?cat=UFC"><a className="hover:text-primary">UFC</a></Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-lg font-semibold mb-4 uppercase">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about"><a className="hover:text-primary">About Us</a></Link></li>
              <li><Link href="/contact"><a className="hover:text-primary">Contact</a></Link></li>
              <li><Link href="/privacy"><a className="hover:text-primary">Privacy Policy</a></Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-lg font-semibold mb-4 uppercase">Follow Us</h4>
            <div className="flex space-x-4">
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-primary hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-primary hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 bg-white/5 rounded-full hover:bg-primary hover:text-white transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
            <div className="mt-4 flex items-center space-x-2 text-sm text-muted-foreground">
               <Mail className="h-4 w-4" />
               <span>contact@thechewth.com</span>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-white/10 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} The Chewth Sports Media. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
