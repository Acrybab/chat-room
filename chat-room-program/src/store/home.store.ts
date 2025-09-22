import { create } from "zustand";

export type HomeState = {
  roomName: string;
  roomDescription: string;
  setRoomName: (name: string) => void;
  setRoomDescription: (description: string) => void;
  isOpenDialog: boolean;
  setIsOpenDialog: (isOpen: boolean) => void;
  roomCategory: string;
  setRoomCategory: (category: string) => void;
};

const useHomeStore = create<HomeState>((set) => ({
  roomName: "",
  roomDescription: "",
  setRoomName: (name: string) => set({ roomName: name }),
  setRoomDescription: (description: string) =>
    set({ roomDescription: description }),
  isOpenDialog: false,
  setIsOpenDialog: (isOpen: boolean) => set({ isOpenDialog: isOpen }),
  roomCategory: "",
  setRoomCategory: (category: string) => set({ roomCategory: category }),
}));

export default useHomeStore;
