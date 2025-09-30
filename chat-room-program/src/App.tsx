import { RouterProvider } from "react-router-dom";

import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <div>
      <RouterProvider router={router} />
      <Toaster />
    </div>
  );
}

export default App;
