import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Alert,
  Tabs,
  Tab,
  CircularProgress,
} from "@mui/material";
import {
  People as PeopleIcon,
  VerifiedUser as VerifiedIcon,
  Gavel as DisputeIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "../../store/hooks";
import {
  selectAuthUser,
  selectIsAuthenticated,
} from "../../store/slices/authSelectors";

// Import admin components
import UserManagement from "./UserManagement";
import VerificationManagement from "./VerificationManagement";
//import DisputeManagement from "./DisputeManagement";

interface AdminDashboardProps {
  className?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({
  children,
  value,
  index,
  ...other
}) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ className }) => {
  const { t } = useTranslation();
  const user = useAppSelector(selectAuthUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [tabValue, setTabValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  // Add state for stats
  const [stats, setStats] = useState<{
    totalUsers: number;
    verifiedUsers: number;
    activeUsers: number;
    verificationRate: number;
  } | null>(null);

  // Check if user is admin (this would typically come from JWT token claims or user object)
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!isAuthenticated || !user) {
        setIsLoading(false);
        return;
      }

      try {
        // In a real implementation, you would check the user's role from the token or make an API call
        // For now, we'll simulate checking if user has admin role
        const token = localStorage.getItem("token");
        if (token) {
          // Decode JWT token to check for admin role (simplified)
          // In production, use a proper JWT library
          const payload = JSON.parse(atob(token.split(".")[1]));
          // Check for role in different possible claim names
          const userRoles =
            payload?.role ||
            payload?.roles ||
            payload?.[
              "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
            ] ||
            [];
          const hasAdminRole = Array.isArray(userRoles)
            ? userRoles.includes("Admin")
            : userRoles === "Admin";

          setIsAdmin(hasAdminRole);
        }
      } catch (error) {
        console.error("Error checking admin access:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [isAuthenticated, user]);

  // Fetch admin stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          setStats(await response.json());
        }
      } catch (e) {
        // Optionally handle error
      }
    };
    fetchStats();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (isLoading) {
    return (
      <Box className="flex justify-center items-center min-h-96">
        <CircularProgress />
        <Typography variant="h6" className="ml-4">
          {t("admin.checkingAccess", "Checking admin access...")}
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container maxWidth="lg" className={`py-8 ${className}`}>
        <Alert severity="warning">
          {t(
            "admin.loginRequired",
            "Please log in to access the admin dashboard."
          )}
        </Alert>
      </Container>
    );
  }

  if (!isAdmin) {
    return (
      <Container maxWidth="lg" className={`py-8 ${className}`}>
        <Alert severity="error">
          {t("admin.accessDenied", "Access denied. Admin privileges required.")}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" className={`py-8 ${className}`}>
      {/* Header */}
      <Box className="mb-8">
        <Typography
          variant="h4"
          component="h1"
          className="font-bold text-gray-900 dark:text-white mb-2"
        >
          {t("admin.dashboard.title", "Admin Dashboard")}
        </Typography>
        <Typography
          variant="subtitle1"
          className="text-gray-600 dark:text-gray-300"
        >
          {t(
            "admin.dashboard.subtitle",
            "Manage users and verifications"
          )}
        </Typography>
      </Box>

      {/* Quick Stats Cards */}
      <Grid container spacing={3} className="mb-8">
        <Grid item xs={12} sm={6} md={3}>
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="flex items-center justify-between">
              <Box>
                <Typography variant="h4" className="font-bold">
                  {stats ? stats.totalUsers : "--"}
                </Typography>
                <Typography variant="body2" className="opacity-80">
                  {t("admin.stats.totalUsers", "Total Users")}
                </Typography>
              </Box>
              <PeopleIcon className="text-4xl opacity-80" />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="flex items-center justify-between">
              <Box>
                <Typography variant="h4" className="font-bold">
                  {stats ? stats.verifiedUsers : "--"}
                </Typography>
                <Typography variant="body2" className="opacity-80">
                  {t(
                    "admin.stats.verifiedUsers",
                    "Verified Users"
                  )}
                </Typography>
              </Box>
              <VerifiedIcon className="text-4xl opacity-80" />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="flex items-center justify-between">
              <Box>
                <Typography variant="h4" className="font-bold">
                  {stats ? stats.activeUsers : "--"}
                </Typography>
                <Typography variant="body2" className="opacity-80">
                  {t("admin.stats.activeUsers", "Active Users")}
                </Typography>
              </Box>
              <DisputeIcon className="text-4xl opacity-80" />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardContent className="flex items-center justify-between">
              <Box>
                <Typography variant="h4" className="font-bold">
                  {stats ? `${stats.verificationRate.toFixed(1)}%` : "--"}
                </Typography>
                <Typography variant="body2" className="opacity-80">
                  {t("admin.stats.verificationRate", "Verification Rate")}
                </Typography>
              </Box>
              <VerifiedIcon className="text-4xl opacity-80" />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Paper className="bg-white dark:bg-gray-800">
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="admin dashboard tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              icon={<PeopleIcon />}
              label={t("admin.tabs.users", "User Management")}
              id="admin-tab-0"
              aria-controls="admin-tabpanel-0"
            />
            <Tab
              icon={<VerifiedIcon />}
              label={t("admin.tabs.verifications", "Verifications")}
              id="admin-tab-1"
              aria-controls="admin-tabpanel-1"
            />
            {/* TODO: Add disputes tab & component */}
            {/* <Tab
              icon={<DisputeIcon />}
              label={t("admin.tabs.disputes", "Disputes")}
              id="admin-tab-2"
              aria-controls="admin-tabpanel-2"
            /> */}
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <UserManagement />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <VerificationManagement />
        </TabPanel>

        {/* TODO: Add disputes tab & component later when time permits */}
        {/* <TabPanel value={tabValue} index={2}>
          <DisputeManagement />
        </TabPanel> */}
      </Paper>
    </Container>
  );
};

export default AdminDashboard;
