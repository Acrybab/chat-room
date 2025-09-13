import { create } from "zustand";

type SignUpState = {
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (show: boolean) => void;
};

export const useSignUpStore = create<SignUpState>((set) => ({
  showPassword: false,
  setShowPassword: (show) => set({ showPassword: show }),
  showConfirmPassword: false,
  setShowConfirmPassword: (show) => set({ showConfirmPassword: show }),
}));
