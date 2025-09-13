import { Button } from "../button";
import { Card, CardContent } from "../card";

interface FooterProps {
  handleCreateRoom: (roomName: string, description: string) => void;
  handleJoinRoom: (roomId: number, userId: number) => void;
}
export const Footer = ({ handleCreateRoom, handleJoinRoom }: FooterProps) => {
  return (
    <div className="mt-12 text-center">
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Ready to start chatting?</h3>
            <p className="text-muted-foreground">
              Join thousands of users already connecting and sharing ideas in
              our vibrant community.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                onClick={() => handleCreateRoom("New Room", "Room Description")}
              >
                Create Your Own Room
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleJoinRoom(1, 11)}
              >
                Join General Chat
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
