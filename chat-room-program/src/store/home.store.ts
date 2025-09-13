import { create } from "zustand";

export type HomeState = {
  roomName: string;
  roomDescription: string;
  setRoomName: (name: string) => void;
  setRoomDescription: (description: string) => void;
  isOpenDialog: boolean;
  setIsOpenDialog: (isOpen: boolean) => void;
};

const useHomeStore = create<HomeState>((set) => ({
  roomName: "",
  roomDescription: "",
  setRoomName: (name: string) => set({ roomName: name }),
  setRoomDescription: (description: string) =>
    set({ roomDescription: description }),
  isOpenDialog: false,
  setIsOpenDialog: (isOpen: boolean) => set({ isOpenDialog: isOpen }),
}));

export default useHomeStore;
