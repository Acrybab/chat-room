import { Root } from "@/layouts/Root";
import { Home } from "@/pages/Home";
import { NotFound } from "@/pages/NotFound";
import { Room } from "@/pages/Room";
import { SignIn } from "@/pages/Sign-In";
import { SignUp } from "@/pages/SignUp";
import { createBrowserRouter } from "react-router-dom";
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "/room/:roomId",
        element: <Room />,
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
  {
    path: "/sign-in",
    element: <SignIn />,
  },
  {
    path: "/sign-up",
    element: <SignUp />,
  },
]);
