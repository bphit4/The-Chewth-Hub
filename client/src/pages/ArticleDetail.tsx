import { useRoute } from "wouter";
import { ARTICLES } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowLeft, Share2, Facebook, Twitter, Linkedin } from "lucide-react";
import { Link } from "wouter";
import NotFound from "./not-found";

export default function ArticleDetail() {
  const [match, params] = useRoute("/news/:id");
  const article = ARTICLES.find(a => a.id === params?.id);

  if (!match || !article) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Header */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <img 
          src={article.imageUrl} 
          alt={article.title} 
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-end container px-4 md:px-6 pb-12">
          <Link href="/news">
            <Button variant="link" className="text-white/80 hover:text-white mb-6 p-0 w-fit gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to News
            </Button>
          </Link>
          <Badge className="bg-primary text-white border-none w-fit mb-4 text-sm font-bold uppercase tracking-wider">
            {article.category}
          </Badge>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-heading font-bold text-white uppercase italic leading-tight max-w-4xl">
            {article.title}
          </h1>
          <div className="flex items-center gap-6 mt-6 text-gray-300 text-sm font-medium uppercase tracking-wide">
             <span className="flex items-center gap-2"><User className="h-4 w-4" /> {article.author}</span>
             <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {article.date}</span>
          </div>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-12 grid gap-12 lg:grid-cols-[1fr_300px]">
        {/* Main Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="lead text-xl md:text-2xl font-medium text-muted-foreground mb-8">
            {article.excerpt}
          </p>
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
          
          {/* Mock Long Content for Demo */}
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
          </p>
          <h2>Key Takeaways</h2>
          <p>
            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
          </p>
          <blockquote>
            "This is exactly what we've been waiting for. The intensity is back, and the fans are loving it."
          </blockquote>
          <p>
            Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
          </p>

          <div className="mt-12 pt-8 border-t border-border">
            <h4 className="font-heading text-lg font-bold uppercase mb-4">Tags</h4>
            <div className="flex gap-2 flex-wrap">
              {article.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="px-3 py-1 rounded-sm uppercase tracking-wide">#{tag}</Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="p-6 bg-secondary text-white rounded-lg">
            <h3 className="font-heading text-xl font-bold uppercase mb-4 italic">Share This</h3>
            <div className="flex gap-2">
              <Button size="icon" variant="outline" className="border-white/20 hover:bg-white/10 text-white rounded-full">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" className="border-white/20 hover:bg-white/10 text-white rounded-full">
                <Twitter className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" className="border-white/20 hover:bg-white/10 text-white rounded-full">
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" className="border-white/20 hover:bg-white/10 text-white rounded-full">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
             <h3 className="font-heading text-xl font-bold uppercase mb-4 text-foreground">Related News</h3>
             <div className="space-y-4">
               {ARTICLES.filter(a => a.id !== article.id).slice(0, 3).map(related => (
                 <Link key={related.id} href={`/news/${related.id}`}>
                    <div className="group cursor-pointer">
                      <div className="aspect-video rounded-md overflow-hidden mb-2">
                        <img src={related.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      </div>
                      <h4 className="font-heading font-bold leading-tight group-hover:text-primary transition-colors">
                        {related.title}
                      </h4>
                    </div>
                 </Link>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
