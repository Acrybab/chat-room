import {
  Home,
  ArrowLeft,
  MessageCircle,
  Search,
  RefreshCw,
  AlertCircle,
  Compass,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const NotFound = () => {
  const handleGoHome = () => {
    // Navigate to home - replace with your router navigation
    window.location.href = "/";
  };

  const handleGoBack = () => {
    // Go back in history
    window.history.back();
  };

  const handleRefresh = () => {
    // Refresh the page
    window.location.reload();
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const searchTerm =
      (form.elements.namedItem("search") as HTMLInputElement)?.value || "";
    if (searchTerm.trim()) {
      // Handle search - replace with your search logic
      console.log("Searching for:", searchTerm);
      // Example: navigate to search results
      // navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  // Popular rooms/pages suggestions
  const popularDestinations = [
    { name: "General Chat", path: "/room/1", icon: MessageCircle, users: 24 },
    { name: "Tech Talk", path: "/room/2", icon: MessageCircle, users: 15 },
    { name: "Random Chat", path: "/room/3", icon: MessageCircle, users: 8 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-6">
              <div className="relative">
                <div className="text-8xl md:text-9xl font-bold text-muted-foreground/20 select-none">
                  404
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <Compass className="w-16 h-16 text-primary animate-spin-slow" />
                    <AlertCircle className="absolute -top-2 -right-2 w-6 h-6 text-destructive" />
                  </div>
                </div>
              </div>
            </div>

            <CardTitle className="text-3xl md:text-4xl font-bold mb-2">
              Page Not Found
            </CardTitle>
            <CardDescription className="text-lg mb-6">
              Oops! The page you're looking for seems to have wandered off into
              the digital void. Don't worry, it happens to the best of us!
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleGoHome} size="lg" className="gap-2">
                <Home className="w-4 h-4" />
                Go Home
              </Button>
              <Button
                onClick={handleGoBack}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </Button>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">
                Looking for something specific?
              </h3>
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  name="search"
                  placeholder="Search for rooms, topics, or users..."
                  className="flex-1"
                />
                <Button type="submit" variant="outline">
                  <Search className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Popular Chat Rooms</CardTitle>
            <CardDescription>
              Maybe you were looking for one of these popular destinations?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {popularDestinations.map((room, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer group"
                  onClick={() => (window.location.href = room.path)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <room.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{room.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Join the conversation
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    {room.users} online
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Still can't find what you're looking for?
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button variant="link" size="sm">
                  Contact Support
                </Button>
                <Button variant="link" size="sm">
                  Report a Problem
                </Button>
                <Button variant="link" size="sm">
                  View Documentation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Error Code: 404 | Page Not Found |
            <span className="ml-1">
              Time: {new Date().toLocaleTimeString()}
            </span>
          </p>
        </div>
      </div>

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-secondary/5 rounded-full blur-3xl" />
        <div className="absolute top-3/4 left-1/3 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />
      </div>
    </div>
  );
};
