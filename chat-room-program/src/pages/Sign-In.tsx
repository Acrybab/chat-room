import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { setToken } from "@/lib/cookies";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye } from "lucide-react";
import { socket } from "@/components/ui/chat-room/socket";
import { useAuth } from "@/hooks/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

export interface SignInForm {
  email: string;
  password: string;
}

export const SignIn = () => {
  const navigate = useNavigate();
  const { handleLogIn } = useAuth();

  const SignInSchema = z.object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address")
      .refine((val) => val.includes("@"), {
        message: "Email must contain @",
      }),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(16, "Password must be at most 16 characters")
      .refine((val) => /[A-Z]/.test(val), {
        message: "Password must contain at least one uppercase letter",
      })
      .refine((val) => /[0-9]/.test(val), {
        message: "Password must contain at least one number",
      })
      .refine((val) => /[!@#$%^&*(),.?":{}|<>]/.test(val), {
        message: "Password must contain at least one special character",
      }),
  });

  const signInForm = useForm<SignInForm>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(SignInSchema),
  });

  const signInFunction = async (data: SignInForm) => {
    const respone = await axios.post(
      "https://chat-room-be-production.up.railway.app/auth/signin",
      {
        email: data.email,
        password: data.password,
      }
    );
    return respone.data;
  };

  const { mutate: signIn } = useMutation({
    mutationFn: signInFunction,
    onSuccess: (data) => {
      const user = data.data.user;
      const token = data.data.accessToken;
      handleLogIn(user);
      setToken(token);

      if (socket.connected) {
        socket.disconnect();
      }

      socket.io.opts.query = {
        userId: user.id.toString(),
      };
      socket.auth = { userId: user.id, token };

      socket.connect();

      socket.on("connect", () => {
        console.log("✅ Socket connected:", socket.id);
        console.log("✅ UserId sent:", user.id);
        socket.emit("onlineUser", { userId: user.id });
      });

      socket.on("connect_error", (error) => {
        console.error("❌ Socket connect error:", error);
      });

      socket.on("userStatusChanged", (data) => {
        console.log("👥 User status changed:", data);
      });

      navigate("/");
    },
    onError: (error) => {
      console.log(error);
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Chat Room Program
        </h1>
        <p className="text-gray-600">
          Sign in to your account to continue the conversation
        </p>
      </div>

      {/* Your existing content with added styling */}
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-2">
            Sign In
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Enter your information to access your account
          </p>

          <div>
            <form
              onSubmit={signInForm.handleSubmit((data) => signIn(data))}
              className="space-y-6"
            >
              <Form {...signInForm}>
                <FormField
                  control={signInForm.control}
                  name="email"
                  render={() => (
                    <FormItem>
                      <div>
                        <FormLabel className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </FormLabel>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                            <Mail className="h-5 w-5 text-gray-400" />
                          </div>
                          <FormControl>
                            <Input
                              placeholder="Enter your email"
                              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                              onChange={(e) => {
                                signInForm.setValue("email", e.target.value);
                                signInForm.trigger("email");
                              }}
                              value={signInForm.getValues("email")}
                            />
                          </FormControl>
                        </div>
                        {/* Move FormMessage outside of relative container */}
                        <FormMessage className="text-xs text-red-500 mt-1" />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={signInForm.control}
                  name="password"
                  render={() => (
                    <FormItem>
                      <div>
                        <FormLabel className="block text-sm font-medium text-gray-700 mb-2">
                          Password
                        </FormLabel>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                            <Lock className="h-5 w-5 text-gray-400" />
                          </div>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter your password"
                              max={16}
                              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
                              onChange={(e) => {
                                signInForm.setValue("password", e.target.value);
                                signInForm.trigger("password");
                              }}
                              value={signInForm.getValues("password")}
                            />
                          </FormControl>
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center z-10"
                          >
                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          </button>
                        </div>
                        {/* Move FormMessage outside of relative container */}
                        <FormMessage className="text-xs text-red-500 mt-1" />
                      </div>
                    </FormItem>
                  )}
                />
              </Form>
              <div>
                <button
                  type="submit"
                  className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
                >
                  Sign In
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="mt-6 mb-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    OR CONTINUE WITH
                  </span>
                </div>
              </div>
            </div>

            {/* Social Sign In Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  window.location.href =
                    "https://chat-room-be-production.up.railway.app/auth/google/login";
                }}
                type="button"
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </button>

              <button
                type="button"
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </button>
            </div>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
              <span className="text-gray-600">Don't have an account? </span>
              <button
                type="button"
                className="font-medium text-gray-900 hover:text-gray-700"
                onClick={() => navigate("/signup")}
              >
                Sign up here
              </button>
            </div>
          </div>
        </div>

        {/* Terms and Privacy */}
        <div className="mt-6 text-center text-sm text-gray-600">
          By signing in, you agree to our{" "}
          <button className="font-medium text-gray-900 hover:text-gray-700 underline">
            Terms of Service
          </button>{" "}
          and{" "}
          <button className="font-medium text-gray-900 hover:text-gray-700 underline">
            Privacy Policy
          </button>
        </div>
      </div>
    </div>
  );
};
