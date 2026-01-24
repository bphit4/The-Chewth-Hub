import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ARTICLES, PODCAST_EPISODES } from "@/lib/mockData";
import { Plus, Trash, Edit, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "password") {
      setIsLoggedIn(true);
      toast({
        title: "Welcome back, Admin",
        description: "You have successfully logged in.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Invalid credentials.",
      });
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="font-heading text-2xl font-bold uppercase">Admin Login</CardTitle>
            <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="admin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 font-bold uppercase">
                Login
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-4">
                Hint: Use 'admin' and 'password'
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container flex h-16 items-center px-4">
          <h1 className="font-heading text-2xl font-bold uppercase mr-8">CMS Dashboard</h1>
          <div className="ml-auto flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">Logged in as Admin</span>
            <Button variant="outline" size="sm" onClick={() => setIsLoggedIn(false)}>Logout</Button>
          </div>
        </div>
      </div>

      <div className="container p-8">
        <Tabs defaultValue="articles" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="articles">Articles</TabsTrigger>
              <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
              <TabsTrigger value="categories">Categories</TabsTrigger>
            </TabsList>
            <Button className="bg-primary hover:bg-primary/90 gap-2">
              <Plus className="h-4 w-4" /> Create New
            </Button>
          </div>

          <TabsContent value="articles">
            <Card>
              <CardHeader>
                <CardTitle>Manage Articles</CardTitle>
                <CardDescription>View, edit, and delete news articles.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ARTICLES.map((article) => (
                    <div key={article.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <img src={article.imageUrl} alt="" className="h-12 w-12 rounded object-cover" />
                        <div>
                          <h4 className="font-bold font-heading uppercase">{article.title}</h4>
                          <p className="text-sm text-muted-foreground">{article.date} • {article.author}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive"><Trash className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="podcasts">
            <Card>
              <CardHeader>
                <CardTitle>Manage Podcasts</CardTitle>
                <CardDescription>Upload new episodes and manage feed.</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                  {PODCAST_EPISODES.map((ep) => (
                    <div key={ep.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded bg-secondary flex items-center justify-center text-white font-bold">
                            {ep.id.split('-')[1]}
                        </div>
                        <div>
                          <h4 className="font-bold font-heading uppercase">{ep.title}</h4>
                          <p className="text-sm text-muted-foreground">{ep.duration} • {ep.date}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive"><Trash className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
