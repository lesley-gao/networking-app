import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Tooltip,
} from "@mui/material";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridToolbar,
} from "@mui/x-data-grid";
import {
  Block as BlockIcon,
  CheckCircle as ActivateIcon,
  VerifiedUser as VerifyIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  preferredLanguage: string;
  isVerified: boolean;
  isActive: boolean;
  rating: number;
  totalRatings: number;
  createdAt: string;
  lastLoginAt?: string;
}

interface UserManagementProps {
  className?: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ className }) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info",
  });

  // Fetch users data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const response = await fetch("/api/admin/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "warning" | "info"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleToggleUserStatus = async (
    userId: number,
    currentStatus: boolean
  ) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user status");
      }

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, isActive: !currentStatus } : user
        )
      );

      showSnackbar(
        t("admin.users.statusUpdated", "User status updated successfully"),
        "success"
      );
    } catch (error) {
      console.error("Error updating user status:", error);
      showSnackbar(
        t("admin.users.statusUpdateError", "Failed to update user status"),
        "error"
      );
    }
  };

  const handleVerifyUser = async (userId: number) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/users/${userId}/verify`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to verify user");
      }

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, isVerified: true } : user
        )
      );

      showSnackbar(
        t("admin.users.userVerified", "User verified successfully"),
        "success"
      );
    } catch (error) {
      console.error("Error verifying user:", error);
      showSnackbar(
        t("admin.users.verifyError", "Failed to verify user"),
        "error"
      );
    }
  };

  const columns: GridColDef[] = [
    {
      field: "id",
      headerName: t("admin.users.columns.id", "ID"),
      width: 70,
      type: "number",
    },
    {
      field: "fullName",
      headerName: t("admin.users.columns.name", "Name"),
      width: 180,
      renderCell: (params: any) => {
        if (!params || !params.row) return "";
        return `${params.row.firstName || ""} ${params.row.lastName || ""}`;
      },
    },
    {
      field: "email",
      headerName: t("admin.users.columns.email", "Email"),
      width: 250,
    },
    {
      field: "phoneNumber",
      headerName: t("admin.users.columns.phone", "Phone"),
      width: 150,
    },
    {
      field: "preferredLanguage",
      headerName: t("admin.users.columns.language", "Language"),
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value === "Chinese" ? "secondary" : "primary"}
          variant="filled"
        />
      ),
    },
    {
      field: "isVerified",
      headerName: t("admin.users.columns.verified", "Verified"),
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={
            params.value
              ? t("verified", "Verified")
              : t("unverified", "Unverified")
          }
          size="small"
          color={params.value ? "success" : "warning"}
          variant={params.value ? "filled" : "outlined"}
        />
      ),
    },
    {
      field: "isActive",
      headerName: t("admin.users.columns.status", "Status"),
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={
            params.value ? t("active", "Active") : t("inactive", "Inactive")
          }
          size="small"
          color={params.value ? "success" : "error"}
          variant={params.value ? "filled" : "outlined"}
        />
      ),
    },
    {
      field: "rating",
      headerName: t("admin.users.columns.rating", "Rating"),
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box className="flex items-center">
          <span className="mr-1">⭐</span>
          <span>{params.value.toFixed(1)}</span>
          <span className="text-gray-500 ml-1">
            ({params.row.totalRatings})
          </span>
        </Box>
      ),
    },
    {
      field: "createdAt",
      headerName: t("admin.users.columns.joinedDate", "Joined"),
      width: 120,
      valueFormatter: (params: any) => {
        return new Date(params.value).toLocaleDateString();
      },
    },
    {
      field: "actions",
      headerName: t("admin.users.columns.actions", "Actions"),
      width: 200,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Box className="flex space-x-1" sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>

          {!params.row.isVerified && (
            <Tooltip title={t("admin.users.actions.verify", "Verify User")}>
              <IconButton
                size="small"
                onClick={() => handleVerifyUser(params.row.id)}
                className="text-green-600 hover:bg-green-50"
              >
                <VerifyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip
            title={
              params.row.isActive
                ? t("admin.users.actions.deactivate", "Deactivate")
                : t("admin.users.actions.activate", "Activate")
            }
          >
            <IconButton
              size="small"
              onClick={() =>
                handleToggleUserStatus(params.row.id, params.row.isActive)
              }
              className={
                params.row.isActive
                  ? "text-red-600 hover:bg-red-50"
                  : "text-green-600 hover:bg-green-50"
              }
            >
              {params.row.isActive ? (
                <BlockIcon fontSize="small" />
              ) : (
                <ActivateIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box className={`h-full ${className}`}>
      <Box className="mb-4 flex justify-between items-center">
        <Typography variant="h6" className="font-semibold">
          {t("admin.users.title", "User Management")}
        </Typography>
      </Box>

      <Box style={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10 },
            },
          }}
          slots={{
            toolbar: GridToolbar,
          }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
          className="bg-white dark:bg-gray-800"
        />
      </Box>

      {/* Edit User Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {t("admin.users.editDialog.title", "Edit User")}
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box className="mt-4 space-y-4">
              <TextField
                fullWidth
                label={t("firstName", "First Name")}
                value={selectedUser.firstName}
                variant="outlined"
              />
              <TextField
                fullWidth
                label={t("lastName", "Last Name")}
                value={selectedUser.lastName}
                variant="outlined"
              />
              <TextField
                fullWidth
                label={t("email", "Email")}
                value={selectedUser.email}
                variant="outlined"
                disabled
              />
              <TextField
                fullWidth
                label={t("phoneNumber", "Phone Number")}
                value={selectedUser.phoneNumber || ""}
                variant="outlined"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            {t("cancel", "Cancel")}
          </Button>
          <Button variant="contained" onClick={() => setEditDialogOpen(false)}>
            {t("save", "Save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;
