import { MessageCircle } from "lucide-react";

export const HeaderSection = () => {
  return (
    <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary rounded-xl">
              <MessageCircle className="w-8 h-8 text-primary-foreground" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold tracking-tight">ChatRoom</h1>
              <p className="text-muted-foreground">Connect & Collaborate</p>
            </div>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Join conversations, share ideas, and connect with people from around
            the world in real-time.
          </p>
        </div>
      </div>
    </div>
  );
};
