import { Button } from "@/components/ui/button";

import { useForm } from "react-hook-form";
import { MessageCircle } from "lucide-react";
import { useSignUpStore } from "@/store/signUp.store";
import { SignUpForm } from "@/features/sign-up/SignUpForm";
export interface SignUpFormValues {
  email: string;
  password: string;
}

export const SignUp = () => {
  const signUpForm = useForm<SignUpFormValues>();
  const {
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
  } = useSignUpStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome to Chat Room Program
            </h1>
            <p className="text-muted-foreground">
              Create your account to join the conversation
            </p>
          </div>
        </div>

        <SignUpForm
          signUpForm={signUpForm}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          showConfirmPassword={showConfirmPassword}
          setShowConfirmPassword={setShowConfirmPassword}
        />
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button variant="link" className="p-0 h-auto font-medium">
              Sign in here
            </Button>
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            By creating an account, you agree to our{" "}
            <Button variant="link" className="p-0 h-auto text-xs underline">
              Terms of Service
            </Button>{" "}
            and{" "}
            <Button variant="link" className="p-0 h-auto text-xs underline">
              Privacy Policy
            </Button>
          </p>
        </div>
      </div>

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-secondary/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
};
