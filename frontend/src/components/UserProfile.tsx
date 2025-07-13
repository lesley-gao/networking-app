// ClientApp/src/components/UserProfile.tsx
import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Avatar,
  Chip,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  VerifiedUser as VerifiedIcon,
  Star as StarIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as LanguageIcon,
  ContactPhone as EmergencyIcon,
  Upload as UploadIcon,
  Security as SecurityIcon,
} from "@mui/icons-material";
import { Input } from "./ui";
import { useAppSelector } from "../store/hooks";
import PaymentHistory from "./PaymentHistory";
import { useTranslation } from "react-i18next";
import { z } from "zod";

// TypeScript interfaces
interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  preferredLanguage: string;
  isVerified: boolean;
  emergencyContact?: string;
  emergencyPhone?: string;
  rating: number;
  totalRatings: number;
  createdAt: string;
  lastLoginAt?: string;
}

interface UserStats {
  totalFlightCompanionRequests: number;
  totalFlightCompanionOffers: number;
  totalPickupRequests: number;
  totalPickupOffers: number;
  completedServices: number;
  averageRating: number;
  totalRatings: number;
}

interface UserProfileProps {}

// UserProfile Component
const UserProfile: React.FC<UserProfileProps> = () => {
  const { t } = useTranslation();

  // Zod schemas and types (must be inside component, before useForm)
  const userProfileSchema = React.useMemo(
    () =>
      z.object({
        firstName: z
          .string()
          .min(1, t("validation.firstNameRequired"))
          .max(50, t("validation.firstNameMax"))
          .regex(/^[a-zA-Z\s]+$/, t("validation.firstNameRegex")),
        lastName: z
          .string()
          .min(1, t("validation.lastNameRequired"))
          .max(50, t("validation.lastNameMax"))
          .regex(/^[a-zA-Z\s]+$/, t("validation.lastNameRegex")),
        phoneNumber: z
          .string()
          .optional()
          .refine(
            (val) => !val || /^\+64\d{8,9}$/.test(val),
            t("validation.phoneNumberFormat")
          ),
        preferredLanguage: z.enum(["English", "Chinese"], {
          errorMap: () => ({
            message: t("validation.preferredLanguageRequired"),
          }),
        }),
        emergencyContact: z
          .string()
          .optional()
          .refine(
            (val) => !val || (val.length >= 2 && val.length <= 100),
            t("validation.emergencyContactLength")
          ),
        emergencyPhone: z
          .string()
          .optional()
          .refine(
            (val) => !val || /^\+64\d{8,9}$/.test(val),
            t("validation.emergencyPhoneFormat")
          ),
      }),
    [t]
  );
  type UserProfileFormData = z.infer<typeof userProfileSchema>;

  const verificationSchema = React.useMemo(
    () =>
      z.object({
        documentReferences: z
          .string()
          .min(10, t("validation.documentReferencesMin"))
          .max(500, t("validation.documentReferencesMax")),
      }),
    [t]
  );
  type VerificationFormData = z.infer<typeof verificationSchema>;

  // State Management
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [showVerificationDialog, setShowVerificationDialog] =
    useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  // Redux Integration
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  // Profile Form
  const profileForm = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phoneNumber: "",
      preferredLanguage: "English",
      emergencyContact: "",
      emergencyPhone: "",
    },
  });

  // Verification Form
  const verificationForm = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      documentReferences: "",
    },
  });

  // Helper Functions
  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info" | "warning"
  ): void => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = (): void => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Data Fetching
  const fetchProfile = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch profile");

      const data: UserProfile = await response.json();
      setProfile(data);

      // Update form with fetched data
      profileForm.reset({
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber || "",
        preferredLanguage: data.preferredLanguage as "English" | "Chinese",
        emergencyContact: data.emergencyContact || "",
        emergencyPhone: data.emergencyPhone || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      showSnackbar(t("errorLoadingProfile"), "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (): Promise<void> => {
    try {
      const response = await fetch("/api/user/stats", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch stats");

      const data: UserStats = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      showSnackbar(t("errorLoadingStatistics"), "error");
    }
  };

  // Event Handlers
  const handleEditToggle = (): void => {
    setIsEditing(!isEditing);
    if (isEditing) {
      // Reset form to original values when canceling
      profileForm.reset({
        firstName: profile?.firstName || "",
        lastName: profile?.lastName || "",
        phoneNumber: profile?.phoneNumber || "",
        preferredLanguage:
          (profile?.preferredLanguage as "English" | "Chinese") || "English",
        emergencyContact: profile?.emergencyContact || "",
        emergencyPhone: profile?.emergencyPhone || "",
      });
    }
  };

  const handleProfileSubmit = async (
    data: UserProfileFormData
  ): Promise<void> => {
    try {
      setLoading(true);

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to update profile");

      const updatedProfile: UserProfile = await response.json();
      setProfile(updatedProfile);
      setIsEditing(false);
      showSnackbar(t("profileUpdated"), "success");
    } catch (error) {
      console.error("Error updating profile:", error);
      showSnackbar(t("errorUpdatingProfile"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (
    data: VerificationFormData
  ): Promise<void> => {
    try {
      setLoading(true);

      const response = await fetch("/api/user/submit-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to submit verification");

      showSnackbar(t("verificationDocumentsSubmitted"), "success");
      setShowVerificationDialog(false);
      verificationForm.reset();

      // Refresh profile to get updated verification status
      await fetchProfile();
    } catch (error) {
      console.error("Error submitting verification:", error);
      showSnackbar(t("errorSubmittingVerificationDocuments"), "error");
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Render loading state
  if (loading && !profile) {
    return (
      <Container maxWidth="lg" className="py-6">
        <Box className="flex justify-center items-center py-12">
          <CircularProgress size={40} />
        </Box>
      </Container>
    );
  }

  // Render unauthenticated state
  if (!isAuthenticated || !profile) {
    return (
      <Container maxWidth="lg" className="py-6">
        <Alert severity="warning">{t("pleaseLoginProfile")}</Alert>
      </Container>
    );
  }

  // Render Stars for Rating
  const renderStars = (rating: number): JSX.Element => (
    <Box className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className={`w-4 h-4 ${
            star <= Math.round(rating) ? "text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
      <Typography variant="body2" className="ml-2 text-gray-600">
        {rating.toFixed(1)} ({profile.totalRatings} {t("reviews")})
      </Typography>
    </Box>
  );

  return (
    <Container maxWidth="lg" className="py-6">
      {/* Header */}
      <Box className="mb-6">
        <Typography
          variant="h3"
          component="h1"
          className="mb-2 font-bold text-gray-800 dark:text-white"
        >
          {t("userProfile")}
        </Typography>
        <Typography variant="h6" className="text-gray-600 dark:text-gray-300">
          {t("manageAccount")}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Profile Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent className="p-6">
              <Box className="flex justify-between items-center mb-6">
                <Typography variant="h5" className="font-semibold">
                  {t("profileInformation")}
                </Typography>
                <Button
                  variant={isEditing ? "outlined" : "contained"}
                  startIcon={isEditing ? <CancelIcon /> : <EditIcon />}
                  onClick={handleEditToggle}
                  disabled={loading}
                >
                  {isEditing ? t("cancel") : t("edit")}
                </Button>
              </Box>

              <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
                <Grid container spacing={3}>
                  {/* Basic Information */}
                  <Grid item xs={12}>
                    <Typography
                      variant="h6"
                      className="mb-3 text-gray-700 dark:text-gray-300"
                    >
                      {t("basicInformation")}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="firstName"
                      control={profileForm.control}
                      render={({ field, fieldState }) => (
                        <Input.TextField
                          {...field}
                          label={t("firstName")}
                          disabled={!isEditing}
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          fullWidth
                          required
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="lastName"
                      control={profileForm.control}
                      render={({ field, fieldState }) => (
                        <Input.TextField
                          {...field}
                          label={t("lastName")}
                          disabled={!isEditing}
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          fullWidth
                          required
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Input.TextField
                      label={t("email")}
                      value={profile.email}
                      disabled={true}
                      fullWidth
                      helperText={t("emailCannotBeChanged")}
                      startAdornment={<EmailIcon className="text-gray-400" />}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="phoneNumber"
                      control={profileForm.control}
                      render={({ field, fieldState }) => (
                        <Input.TextField
                          {...field}
                          label={t("phoneNumber")}
                          disabled={!isEditing}
                          error={!!fieldState.error}
                          helperText={
                            fieldState.error?.message ||
                            t("validation.phoneNumberFormat")
                          }
                          fullWidth
                          placeholder="+64 21 123 4567"
                          startAdornment={
                            <PhoneIcon className="text-gray-400" />
                          }
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="preferredLanguage"
                      control={profileForm.control}
                      render={({ field, fieldState }) => (
                        <Input.Select
                          {...field}
                          label={t("preferredLanguage")}
                          disabled={!isEditing}
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          fullWidth
                          options={[
                            { value: "English", label: t("english") },
                            { value: "Chinese", label: t("chinese") },
                          ]}
                        />
                      )}
                    />
                  </Grid>

                  {/* Emergency Contact */}
                  <Grid item xs={12}>
                    <Divider className="my-4" />
                    <Typography
                      variant="h6"
                      className="mb-3 text-gray-700 dark:text-gray-300"
                    >
                      {t("emergencyContact")}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="emergencyContact"
                      control={profileForm.control}
                      render={({ field, fieldState }) => (
                        <Input.TextField
                          {...field}
                          label={t("emergencyContact")}
                          disabled={!isEditing}
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          fullWidth
                          startAdornment={
                            <EmergencyIcon className="text-gray-400" />
                          }
                        />
                      )}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Controller
                      name="emergencyPhone"
                      control={profileForm.control}
                      render={({ field, fieldState }) => (
                        <Input.TextField
                          {...field}
                          label={t("emergencyPhone")}
                          disabled={!isEditing}
                          error={!!fieldState.error}
                          helperText={
                            fieldState.error?.message ||
                            t("validation.phoneNumberFormat")
                          }
                          fullWidth
                          placeholder="+64 21 123 4567"
                          startAdornment={
                            <PhoneIcon className="text-gray-400" />
                          }
                        />
                      )}
                    />
                  </Grid>

                  {/* Save Button */}
                  {isEditing && (
                    <Grid item xs={12}>
                      <Box className="flex justify-end gap-3 pt-4">
                        <Button
                          type="submit"
                          variant="contained"
                          startIcon={
                            loading ? (
                              <CircularProgress size={20} />
                            ) : (
                              <SaveIcon />
                            )
                          }
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {loading ? t("saving") : t("saveChanges")}
                        </Button>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Profile Summary */}
          <Card className="mb-4">
            <CardContent className="text-center p-6">
              <Avatar
                className="mx-auto mb-4 w-20 h-20 bg-blue-600"
                sx={{ width: 80, height: 80 }}
              >
                <PersonIcon sx={{ fontSize: 40 }} />
              </Avatar>

              <Typography variant="h5" className="font-semibold mb-2">
                {profile.firstName} {profile.lastName}
              </Typography>

              <Box className="flex justify-center items-center gap-2 mb-3">
                {profile.isVerified ? (
                  <Chip
                    icon={<VerifiedIcon />}
                    label={t("verified")}
                    color="success"
                    size="small"
                  />
                ) : (
                  <Chip
                    icon={<SecurityIcon />}
                    label={t("unverified")}
                    color="warning"
                    size="small"
                  />
                )}
                <Chip
                  icon={<LanguageIcon />}
                  label={profile.preferredLanguage}
                  variant="outlined"
                  size="small"
                />
              </Box>

              {renderStars(profile.rating)}

              <Typography variant="body2" className="text-gray-600 mt-3">
                {t("memberSince")}{" "}
                {new Date(profile.createdAt).toLocaleDateString()}
              </Typography>

              {!profile.isVerified && (
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={() => setShowVerificationDialog(true)}
                  className="mt-4"
                  fullWidth
                >
                  {t("submitVerification")}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          {stats && (
            <Card>
              <CardContent className="p-6">
                <Typography variant="h6" className="font-semibold mb-4">
                  {t("activityStatistics")}
                </Typography>

                <Box className="space-y-3">
                  <Box className="flex justify-between">
                    <Typography variant="body2">
                      {t("requestsCreated")}:
                    </Typography>
                    <Typography variant="body2" className="font-semibold">
                      {stats.totalFlightCompanionRequests +
                        stats.totalPickupRequests}
                    </Typography>
                  </Box>

                  <Box className="flex justify-between">
                    <Typography variant="body2">
                      {t("servicesOffered")}:
                    </Typography>
                    <Typography variant="body2" className="font-semibold">
                      {stats.totalFlightCompanionOffers +
                        stats.totalPickupOffers}
                    </Typography>
                  </Box>

                  <Box className="flex justify-between">
                    <Typography variant="body2">
                      {t("completedServices")}:
                    </Typography>
                    <Typography variant="body2" className="font-semibold">
                      {stats.completedServices}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box className="flex justify-between">
                    <Typography variant="body2">
                      {t("averageRating")}:
                    </Typography>
                    <Typography variant="body2" className="font-semibold">
                      {stats.averageRating.toFixed(1)}/5.0
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Verification Dialog */}
      <Dialog
        open={showVerificationDialog}
        onClose={() => setShowVerificationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" className="flex items-center gap-2">
            <SecurityIcon />
            {t("submitVerificationDocuments")}
          </Typography>
        </DialogTitle>

        <form
          onSubmit={verificationForm.handleSubmit(handleVerificationSubmit)}
        >
          <DialogContent>
            <Typography variant="body2" className="mb-4 text-gray-600">
              {t("verificationDialogDesc")}
            </Typography>

            <Controller
              name="documentReferences"
              control={verificationForm.control}
              render={({ field, fieldState }) => (
                <Input.TextField
                  {...field}
                  label={t("documentReferences")}
                  error={!!fieldState.error}
                  helperText={
                    fieldState.error?.message || t("documentReferencesHelper")
                  }
                  fullWidth
                  multiline
                  rows={4}
                  placeholder={t("documentReferencesPlaceholder")}
                />
              )}
            />
          </DialogContent>

          <DialogActions className="p-4">
            <Button
              onClick={() => setShowVerificationDialog(false)}
              disabled={loading}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={20} /> : <UploadIcon />
              }
            >
              {loading ? t("submitting") : t("submit")}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          variant="filled"
          className="w-full"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Payment History */}
      <Box className="mt-6">
        <Typography variant="h4" component="h2" className="mb-4 font-bold text-gray-800 dark:text-white">
          {t("paymentHistory")}
        </Typography>
        <PaymentHistory />
      </Box>
    </Container>
  );
};

export default UserProfile;
