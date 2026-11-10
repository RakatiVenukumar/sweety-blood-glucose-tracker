import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./layouts/AppShell";
import FoundationPreview from "./pages/FoundationPreview";
import PlaceholderPage from "./pages/PlaceholderPage";

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<FoundationPreview />} />
        <Route path="/dashboard" element={<PlaceholderPage title="Your dashboard" eyebrow="Coming next" />} />
        <Route path="/readings" element={<PlaceholderPage title="Glucose readings" eyebrow="Coming next" />} />
        <Route path="/reports" element={<PlaceholderPage title="Your reports" eyebrow="Coming next" />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
