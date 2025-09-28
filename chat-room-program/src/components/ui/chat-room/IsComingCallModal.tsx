import { Button } from "../button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../dialog";
import { Avatar, AvatarFallback } from "../avatar";
import { Phone, PhoneOff, User } from "lucide-react";
import type { InComingCallData } from "@/pages/Room";

interface IsComingCallModalProps {
  isOpenCallModal: true;
  setIsOpenCallModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleCloseModal: () => void;
  isCommingCall: InComingCallData;
  setCallOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const IsComingCallModal = ({
  isOpenCallModal,
  setIsOpenCallModal,
  handleCloseModal,
  isCommingCall,
  setCallOpen,
}: IsComingCallModalProps) => {
  const handleAccept = () => {
    // Xử lý logic accept call ở đây
    setCallOpen(true);
    setIsOpenCallModal(false);
  };

  const handleDecline = () => {
    handleCloseModal();
  };

  return (
    <Dialog
      open={isOpenCallModal}
      onOpenChange={() => setIsOpenCallModal(false)}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center pb-4">
          <DialogTitle className="text-lg font-semibold text-muted-foreground">
            Incoming Call
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-6">
          {/* Caller Avatar */}
          <div className="relative">
            <Avatar className="h-24 w-24 ring-4 ring-primary/20">
              {/* <AvatarImage src={callerAvatar} alt={callerName} /> */}
              <AvatarFallback className="text-2xl font-semibold bg-primary/10">
                {isCommingCall.initiator.email.charAt(0).toUpperCase() || (
                  <User className="h-8 w-8" />
                )}
              </AvatarFallback>
            </Avatar>
            {/* Pulse animation */}
            <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping" />
          </div>

          {/* Caller Info */}
          <div className="text-center space-y-1">
            <h3 className="text-2xl font-semibold">
              {isCommingCall.initiator.email}
            </h3>
            {/* {callerPhone && (
              <p className="text-muted-foreground">{callerPhone}</p>
            )} */}
            <p className="text-sm text-muted-foreground">Calling...</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-8 pt-4">
          {/* Decline Button */}
          <Button
            variant="destructive"
            size="lg"
            className="h-14 w-14 rounded-full p-0 hover:scale-105 transition-transform"
            onClick={handleDecline}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>

          {/* Accept Button */}
          <Button
            variant="default"
            size="lg"
            className="h-14 w-14 rounded-full p-0 bg-green-600 hover:bg-green-700 hover:scale-105 transition-transform"
            onClick={handleAccept}
          >
            <Phone className="h-6 w-6" />
          </Button>
        </div>

        {/* Additional Options */}
        <div className="flex justify-center gap-4 pt-4 border-t">
          <Button variant="ghost" size="sm">
            Message
          </Button>
          <Button variant="ghost" size="sm">
            Remind Me
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
