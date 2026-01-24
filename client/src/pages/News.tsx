import { ARTICLES } from "@/lib/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, User, Search, Filter } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useMemo } from "react";

export default function News() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialCat = searchParams.get('cat') || 'All';
  
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["All", "NFL", "NBA", "CFB", "CBB", "MLB", "UFC"];

  const filteredArticles = useMemo(() => {
    return ARTICLES.filter(article => {
      const matchesCategory = selectedCategory === "All" || article.category === selectedCategory;
      const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-secondary py-16 border-b border-white/10">
        <div className="container px-4 md:px-6">
          <h1 className="text-4xl md:text-6xl font-heading font-bold text-white uppercase italic mb-6">
            Sports <span className="text-primary">News</span>
          </h1>
          
          <div className="flex flex-col md:flex-row gap-4 mt-8">
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search articles..." 
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <Button 
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat)}
                  className={`uppercase font-bold tracking-wider ${selectedCategory === cat ? 'bg-primary text-white border-primary' : 'bg-transparent text-gray-400 border-white/10 hover:text-white hover:bg-white/5'}`}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.length > 0 ? (
            filteredArticles.map((article) => (
              <Link key={article.id} href={`/news/${article.id}`}>
                <Card className="group overflow-hidden border bg-card hover:border-primary/50 transition-colors h-full flex flex-col cursor-pointer">
                  <div className="aspect-[16/9] overflow-hidden relative">
                    <div className="absolute top-4 left-4 z-10">
                      <Badge className="bg-primary text-white border-none text-xs font-bold uppercase tracking-wider rounded-sm">
                        {article.category}
                      </Badge>
                    </div>
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <CardContent className="p-6 space-y-4 flex-grow flex flex-col">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      <span className="flex items-center"><Calendar className="mr-1 h-3 w-3" /> {article.date}</span>
                      <span className="flex items-center"><User className="mr-1 h-3 w-3" /> {article.author}</span>
                    </div>
                    <h3 className="font-heading text-2xl font-bold leading-tight group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-muted-foreground line-clamp-3 text-sm flex-grow">
                      {article.excerpt}
                    </p>
                    <div className="flex gap-2 flex-wrap mt-4">
                        {article.tags.map(tag => (
                            <span key={tag} className="text-[10px] text-muted-foreground bg-secondary/5 px-2 py-1 rounded-sm uppercase tracking-wide font-bold">#{tag}</span>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              <Filter className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg">No articles found matching your criteria.</p>
              <Button variant="link" onClick={() => {setSelectedCategory('All'); setSearchQuery('')}}>Clear filters</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
