import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppProvider } from "@/context/AppContext";
import { AppLayout } from "@/components/layout/AppLayout";

import Home from "@/pages/Home";

import ManagerDashboard from "@/pages/manager/Dashboard";
import ManagerLeads from "@/pages/manager/Leads";
import ManagerQuotes from "@/pages/manager/Quotes";
import ManagerJobs from "@/pages/manager/Jobs";
import ManagerUsers from "@/pages/manager/Users";
import ManagerSettings from "@/pages/manager/Settings";

import SalesDashboard from "@/pages/sales/Dashboard";
import SalesLeads from "@/pages/sales/Leads";
import SalesQuotes from "@/pages/sales/Quotes";

import FieldDashboard from "@/pages/field/Dashboard";
import FieldJobs from "@/pages/field/Jobs";
import FieldComplete from "@/pages/field/Complete";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Home} />

        <Route path="/manager" component={ManagerDashboard} />
        <Route path="/manager/leads" component={ManagerLeads} />
        <Route path="/manager/quotes" component={ManagerQuotes} />
        <Route path="/manager/jobs" component={ManagerJobs} />
        <Route path="/manager/users" component={ManagerUsers} />
        <Route path="/manager/settings" component={ManagerSettings} />

        <Route path="/sales" component={SalesDashboard} />
        <Route path="/sales/leads" component={SalesLeads} />
        <Route path="/sales/quotes" component={SalesQuotes} />

        <Route path="/field" component={FieldDashboard} />
        <Route path="/field/jobs" component={FieldJobs} />
        <Route path="/field/jobs/:jobId/complete" component={FieldComplete} />

        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
