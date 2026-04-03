import { createBrowserRouter } from "react-router";
import AuthLayout from "./components/AuthLayout";
import Root from "./components/Root";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientForm from "./pages/ClientForm";
import ClientDetails from "./pages/ClientDetails";
import Contracts from "./pages/Contracts";
import ContractForm from "./pages/ContractForm";
import ContractDetails from "./pages/ContractDetails";
import Financial from "./pages/Financial";
import TransactionForm from "./pages/TransactionForm";
import TransactionDetails from "./pages/TransactionDetails";
import NotFound from "./pages/NotFound";
import ClientPortal from "./pages/ClientPortal";
import ClientPortalLogin from "./pages/ClientPortalLogin";
import ClientPortalSignup from "./pages/ClientPortalSignup";
import ClientPortalDashboard from "./pages/ClientPortalDashboard";
import ClientPortalFirstAccess from "./pages/ClientPortalFirstAccess";
import DueReminders from "./pages/DueReminders";
import Security from "./pages/Security";
import Users from "./pages/Users";
import AuthDebug from "./pages/AuthDebug";

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/login",
        Component: Login,
      },
      {
        path: "/reset-password",
        Component: ResetPassword,
      },
      {
        path: "/auth-debug",
        Component: AuthDebug,
      },
      {
        path: "/client-portal",
        Component: ClientPortal,
      },
      // Client Portal Routes (all need auth context)
      {
        path: "/client-portal/login",
        Component: ClientPortalLogin,
      },
      {
        path: "/client-portal/signup",
        Component: ClientPortalSignup,
      },
      {
        path: "/client-portal/dashboard",
        Component: ClientPortalDashboard,
      },
      {
        path: "/client-portal/first-access",
        Component: ClientPortalFirstAccess,
      },
      {
        path: "/",
        Component: Root,
        children: [
          { index: true, Component: Dashboard },
          { path: "clients", Component: Clients },
          { path: "clients/new", Component: ClientForm },
          { path: "clients/:id", Component: ClientDetails },
          { path: "clients/:id/edit", Component: ClientForm },
          { path: "contracts", Component: Contracts },
          { path: "contracts/new", Component: ContractForm },
          { path: "contracts/:id", Component: ContractDetails },
          { path: "contracts/:id/edit", Component: ContractForm },
          { path: "financial", Component: Financial },
          { path: "financial/transactions/new", Component: TransactionForm },
          { path: "financial/transactions/:id/edit", Component: TransactionForm },
          { path: "financial/transactions/:id", Component: TransactionDetails },
          { path: "reminders", Component: DueReminders },
          { path: "security", Component: Security },
          { path: "users", Component: Users },
          { path: "*", Component: NotFound },
        ],
      },
    ],
  },
]);