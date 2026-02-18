import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AppProvider } from "./store";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </AppProvider>
  );
}
