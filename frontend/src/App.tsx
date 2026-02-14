import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/pages/DashboardPage";
import { SimulationsPage } from "@/pages/SimulationsPage";
import { DataSourcesPage } from "@/pages/DataSourcesPage";
import { IntegrationsPage } from "@/pages/IntegrationsPage";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/simulations" element={<SimulationsPage />} />
          <Route path="/data" element={<DataSourcesPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
