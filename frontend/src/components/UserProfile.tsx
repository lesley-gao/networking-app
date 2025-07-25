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
  TextField,
  InputAdornment,
  DialogTitle,
  DialogContent,
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
import SubmitVerification from "./forms/SubmitVerification";
import { useTheme } from "../themes/ThemeProvider";
import useIsDarkMode from "../themes/useIsDarkMode";
import {
  useUpdateFlightCompanionRequestMutation,
  useDeleteFlightCompanionRequestMutation,
  useUpdateFlightCompanionOfferMutation,
  useDeleteFlightCompanionOfferMutation,
  useUpdatePickupRequestMutation,
  useDeletePickupRequestMutation,
  useUpdatePickupOfferMutation,
  useDeletePickupOfferMutation,
} from '../store/api/flightCompanionApi';
import FlightCompanionRequestForm from './forms/FlightCompanionRequestForm';
import FlightCompanionOfferForm from './forms/FlightCompanionOfferForm';

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

// Custom Phone Number Input Component
interface PhoneNumberInputProps {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  placeholder?: string;
}

const PhoneNumberInput: React.FC<PhoneNumberInputProps> = ({
  label,
  value,
  onChange,
  error,
  helperText,
  disabled,
  placeholder = "21 123 4567"
}) => {
  // Remove +64 prefix for display and add it back when saving
  const displayValue = (value || '').startsWith('+64') ? (value || '').substring(3) : value || '';
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Only allow numbers and spaces
    const cleanedValue = inputValue.replace(/[^0-9\s]/g, '');
    // Add +64 prefix
    const fullValue = cleanedValue ? `+64${cleanedValue}` : '';
    onChange(fullValue);
  };

  return (
    <TextField
      label={label}
      value={displayValue || ''}
      onChange={handleChange}
      error={error}
      helperText={helperText}
      disabled={disabled}
      placeholder={placeholder}
      fullWidth
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PhoneIcon className="text-gray-400" sx={{ mr: 1 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                +64
              </Typography>
            </Box>
          </InputAdornment>
        )
      }}
    />
  );
};

// UserProfile Component
const UserProfile: React.FC<UserProfileProps> = () => {
  const { t, i18n } = useTranslation();
  const { muiTheme } = useTheme();
  const isDarkMode = useIsDarkMode();

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

  // Add state for user's requests and offers
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [myOffers, setMyOffers] = useState<any[]>([]);
  const [myPickupRequests, setMyPickupRequests] = useState<any[]>([]);
  const [myPickupOffers, setMyPickupOffers] = useState<any[]>([]);
  const [myReqOffLoading, setMyReqOffLoading] = useState<boolean>(false);
  const [myReqOffError, setMyReqOffError] = useState<string | null>(null);

  // Mutations for edit/delete
  const [updateRequest, { isLoading: updatingRequest }] = useUpdateFlightCompanionRequestMutation();
  const [deleteRequest, { isLoading: deletingRequest }] = useDeleteFlightCompanionRequestMutation();
  const [updateOffer, { isLoading: updatingOffer }] = useUpdateFlightCompanionOfferMutation();
  const [deleteOffer, { isLoading: deletingOffer }] = useDeleteFlightCompanionOfferMutation();
  const [updatePickupRequest, { isLoading: updatingPickupRequest }] = useUpdatePickupRequestMutation();
  const [deletePickupRequest, { isLoading: deletingPickupRequest }] = useDeletePickupRequestMutation();
  const [updatePickupOffer, { isLoading: updatingPickupOffer }] = useUpdatePickupOfferMutation();
  const [deletePickupOffer, { isLoading: deletingPickupOffer }] = useDeletePickupOfferMutation();

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editType, setEditType] = useState<'request' | 'offer' | 'pickupRequest' | 'pickupOffer' | null>(null);
  const [editItem, setEditItem] = useState<any>(null);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'request' | 'offer' | 'pickupRequest' | 'pickupOffer' | null>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);

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

      // Sync UI language with user's preferred language
      const currentUILanguage = i18n.language?.split('-')[0] || 'en';
      const userPreferredLanguageCode = data.preferredLanguage === "Chinese" ? "zh" : "en";
      
      if (currentUILanguage !== userPreferredLanguageCode) {
        i18n.changeLanguage(userPreferredLanguageCode);
      }
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

  // Fetch user's requests and offers
  const fetchMyRequestsAndOffers = async () => {
    try {
      setMyReqOffLoading(true);
      setMyReqOffError(null);
      const response = await fetch("/api/user/my-requests-offers", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch requests/offers");
      const data = await response.json();
      setMyRequests(data.flightCompanionRequests || []);
      setMyOffers(data.flightCompanionOffers || []);
      setMyPickupRequests(data.pickupRequests || []);
      setMyPickupOffers(data.pickupOffers || []);
    } catch (error) {
      setMyReqOffError("Could not load your requests/offers.");
    } finally {
      setMyReqOffLoading(false);
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

      // Update UI language if preferred language changed
      if (data.preferredLanguage !== profile?.preferredLanguage) {
        const languageCode = data.preferredLanguage === "Chinese" ? "zh" : "en";
        i18n.changeLanguage(languageCode);
        
        // Show language change notification
        const languageName = data.preferredLanguage === "Chinese" ? "中文" : "English";
        showSnackbar(`${t("languageChanged")} ${languageName}`, "info");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showSnackbar(t("errorUpdatingProfile"), "error");
    } finally {
      setLoading(false);
    }
  };

  // Edit handlers
  const handleEdit = (type: 'request' | 'offer' | 'pickupRequest' | 'pickupOffer', item: any) => {
    setEditType(type);
    setEditItem(item);
    setEditDialogOpen(true);
  };
  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditType(null);
    setEditItem(null);
  };
  const handleEditSubmit = async (data: any) => {
    try {
      if (editType === 'request') {
        await updateRequest({ id: editItem.id, data }).unwrap();
        showSnackbar('Request updated!', 'success');
      } else if (editType === 'offer') {
        await updateOffer({ id: editItem.id, data }).unwrap();
        showSnackbar('Offer updated!', 'success');
      } else if (editType === 'pickupRequest') {
        await updatePickupRequest({ id: editItem.id, data }).unwrap();
        showSnackbar('Pickup request updated!', 'success');
      } else if (editType === 'pickupOffer') {
        await updatePickupOffer({ id: editItem.id, data }).unwrap();
        showSnackbar('Pickup offer updated!', 'success');
      }
      handleEditClose();
      fetchMyRequestsAndOffers();
    } catch (error) {
      showSnackbar('Failed to update.', 'error');
    }
  };
  // Delete handlers
  const handleDelete = (type: 'request' | 'offer' | 'pickupRequest' | 'pickupOffer', item: any) => {
    setDeleteType(type);
    setDeleteItem(item);
    setDeleteDialogOpen(true);
  };
  const handleDeleteConfirm = async () => {
    try {
      if (deleteType === 'request') {
        await deleteRequest(deleteItem.id).unwrap();
        showSnackbar('Request deleted!', 'success');
      } else if (deleteType === 'offer') {
        await deleteOffer(deleteItem.id).unwrap();
        showSnackbar('Offer deleted!', 'success');
      } else if (deleteType === 'pickupRequest') {
        await deletePickupRequest(deleteItem.id).unwrap();
        showSnackbar('Pickup request deleted!', 'success');
      } else if (deleteType === 'pickupOffer') {
        await deletePickupOffer(deleteItem.id).unwrap();
        showSnackbar('Pickup offer deleted!', 'success');
      }
      setDeleteDialogOpen(false);
      setDeleteType(null);
      setDeleteItem(null);
      fetchMyRequestsAndOffers();
    } catch (error) {
      showSnackbar('Failed to delete.', 'error');
    }
  };
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteType(null);
    setDeleteItem(null);
  };

  // Effects
  useEffect(() => {
    if (isAuthenticated) {
      fetchProfile();
      fetchStats();
      fetchMyRequestsAndOffers(); // fetch user's requests/offers
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
    <Box className="flex items-center justify-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className={`w-4 h-4 ${
            star <= Math.round(rating) ? "text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
      <Typography variant="body2" className="ml-2 text-gray-600 dark:text-gray-100">
        {rating.toFixed(1)} ({profile.totalRatings} {t("reviews")})
      </Typography>
    </Box>
  );

  return (
    <Container maxWidth="lg" className="py-6">
      {/* Header */}
      <Box className="mb-6 mt-10">
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
          <Card sx={{ background: isDarkMode ? muiTheme.palette.background.paper : undefined }}>
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
                  sx={
                    !isEditing && isDarkMode
                      ? {
                          color: '#00BCD4',
                          borderColor: '#00BCD4',
                          backgroundColor: 'transparent',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 188, 212, 0.1)',
                            borderColor: '#00BCD4',
                            color: '#00BCD4',
                          },
                        }
                      : isEditing && isDarkMode
                      ? {
                          color: '#00BCD4',
                          borderColor: '#00BCD4',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 188, 212, 0.1)',
                            borderColor: '#00BCD4',
                            color: '#00BCD4',
                          },
                        }
                      : {}
                  }
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
                        <PhoneNumberInput
                          label={t("phoneNumber")}
                          value={field.value}
                          onChange={field.onChange}
                          error={!!fieldState.error}
                          helperText={
                            fieldState.error?.message ||
                            t("validation.phoneNumberFormat")
                          }
                          disabled={!isEditing}
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
                            { value: "English", label: t("English") },
                            { value: "Chinese", label: t("Chinese") },
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
                        <PhoneNumberInput
                          label={t("emergencyPhone")}
                          value={field.value}
                          onChange={field.onChange}
                          error={!!fieldState.error}
                          helperText={
                            fieldState.error?.message ||
                            t("validation.phoneNumberFormat")
                          }
                          disabled={!isEditing}
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
          <Card className="mb-4" sx={{ background: isDarkMode ? muiTheme.palette.background.paper : undefined }}>
            <CardContent className="text-center p-6" sx={{ background: isDarkMode ? muiTheme.palette.background.paper : undefined }}>
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

              <Typography variant="body2" className="text-gray-600 mt-3 dark:text-gray-100">
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
                  sx={isDarkMode ? {
                    color: '#00BCD4',
                    borderColor: '#00BCD4',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 188, 212, 0.1)',
                      borderColor: '#00BCD4',
                      color: '#00BCD4',
                    },
                  } : {}}
                >
                  {t("submitVerification")}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          {stats && (
            <Card sx={{ background: isDarkMode ? muiTheme.palette.background.paper : undefined }}>
              <CardContent className="p-6" sx={{ background: isDarkMode ? muiTheme.palette.background.paper : undefined }}>
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

      {/* My Requests/Offers Section */}
      <Box className="my-8">
        <Typography variant="h5" className="mb-4 font-bold">
          My Flight Companion Requests
        </Typography>
        {myReqOffLoading ? (
          <Box className="flex justify-center items-center py-4">
            <CircularProgress size={28} />
          </Box>
        ) : myReqOffError ? (
          <Alert severity="error">{myReqOffError}</Alert>
        ) : myRequests.length === 0 ? (
          <Typography>No requests found.</Typography>
        ) : (
          myRequests.map((req) => (
            <Card key={req.id} className="mb-2">
              <CardContent>
                <Typography>
                  {req.flightNumber} - {req.airline} ({req.departureAirport} → {req.arrivalAirport}) on {new Date(req.flightDate).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Status: {req.isMatched ? "Matched" : "Open"}
                </Typography>
                <Box className="flex gap-2 mt-2">
                  <Button size="small" variant="outlined" onClick={() => handleEdit('request', req)} disabled={updatingRequest}>
                    Edit
                  </Button>
                  <Button size="small" variant="outlined" color="error" onClick={() => handleDelete('request', req)} disabled={deletingRequest}>
                    Delete
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))
        )}

        <Typography variant="h5" className="mb-4 font-bold mt-8">
          My Flight Companion Offers
        </Typography>
        {myReqOffLoading ? (
          <Box className="flex justify-center items-center py-4">
            <CircularProgress size={28} />
          </Box>
        ) : myReqOffError ? (
          <Alert severity="error">{myReqOffError}</Alert>
        ) : myOffers.length === 0 ? (
          <Typography>No offers found.</Typography>
        ) : (
          myOffers.map((offer) => (
            <Card key={offer.id} className="mb-2">
              <CardContent>
                <Typography>
                  {offer.flightNumber} - {offer.airline} ({offer.departureAirport} → {offer.arrivalAirport}) on {new Date(offer.flightDate).toLocaleDateString()}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Status: {offer.isAvailable ? "Available" : "Matched"}
                </Typography>
                <Box className="flex gap-2 mt-2">
                  <Button size="small" variant="outlined" onClick={() => handleEdit('offer', offer)} disabled={updatingOffer}>
                    Edit
                  </Button>
                  <Button size="small" variant="outlined" color="error" onClick={() => handleDelete('offer', offer)} disabled={deletingOffer}>
                    Delete
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))
        )}

        <Typography variant="h5" className="mb-4 font-bold mt-8">
          My Pickup Requests
        </Typography>
        {myReqOffLoading ? (
          <Box className="flex justify-center items-center py-4">
            <CircularProgress size={28} />
          </Box>
        ) : myReqOffError ? (
          <Alert severity="error">{myReqOffError}</Alert>
        ) : myPickupRequests.length === 0 ? (
          <Typography>No pickup requests found.</Typography>
        ) : (
          myPickupRequests.map((req) => (
            <Card key={req.id} className="mb-2">
              <CardContent>
                <Typography>
                  {req.airport} on {new Date(req.arrivalDate).toLocaleDateString()} (Offered: ${req.offeredAmount})
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Status: {req.isMatched ? "Matched" : "Open"}
                </Typography>
                <Box className="flex gap-2 mt-2">
                  <Button size="small" variant="outlined" onClick={() => handleEdit('pickupRequest', req)} disabled={updatingPickupRequest}>
                    Edit
                  </Button>
                  <Button size="small" variant="outlined" color="error" onClick={() => handleDelete('pickupRequest', req)} disabled={deletingPickupRequest}>
                    Delete
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))
        )}

        <Typography variant="h5" className="mb-4 font-bold mt-8">
          My Pickup Offers
        </Typography>
        {myReqOffLoading ? (
          <Box className="flex justify-center items-center py-4">
            <CircularProgress size={28} />
          </Box>
        ) : myReqOffError ? (
          <Alert severity="error">{myReqOffError}</Alert>
        ) : myPickupOffers.length === 0 ? (
          <Typography>No pickup offers found.</Typography>
        ) : (
          myPickupOffers.map((offer) => (
            <Card key={offer.id} className="mb-2">
              <CardContent>
                <Typography>
                  {offer.airport} (Base Rate: ${offer.baseRate})
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Status: {offer.isAvailable ? "Available" : "Matched"}
                </Typography>
                <Box className="flex gap-2 mt-2">
                  <Button size="small" variant="outlined" onClick={() => handleEdit('pickupOffer', offer)} disabled={updatingPickupOffer}>
                    Edit
                  </Button>
                  <Button size="small" variant="outlined" color="error" onClick={() => handleDelete('pickupOffer', offer)} disabled={deletingPickupOffer}>
                    Delete
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      {/* Verification Dialog */}
      <Dialog
        open={showVerificationDialog}
        onClose={() => {
          setShowVerificationDialog(false);
          fetchProfile(); // Refetch profile when dialog closes
        }}
        maxWidth="sm"
        fullWidth
      >
          <SubmitVerification />
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
      <Box className="my-20">
        <Typography
          variant="h4"
          component="h2"
          className="mb-4 font-bold text-gray-800 dark:text-white"
        >
          {t("paymentHistory")}
        </Typography>
        <PaymentHistory />
      </Box>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="md" fullWidth>
        <DialogTitle>Edit {editType === 'request' ? 'Request' : editType === 'offer' ? 'Offer' : editType === 'pickupRequest' ? 'Pickup Request' : 'Pickup Offer'}</DialogTitle>
        <DialogContent>
          {editType === 'request' && (
            <FlightCompanionRequestForm
              onSubmit={handleEditSubmit}
              onCancel={handleEditClose}
              loading={updatingRequest}
              initialData={editItem}
            />
          )}
          {editType === 'offer' && (
            <FlightCompanionOfferForm
              onSubmit={handleEditSubmit}
              onCancel={handleEditClose}
              loading={updatingOffer}
              initialData={editItem}
            />
          )}
          {editType === 'pickupRequest' && editItem && (
            <Box component="form" onSubmit={e => { e.preventDefault(); handleEditSubmit({
              airport: (e.target as any).airport.value,
              arrivalDate: (e.target as any).arrivalDate.value,
              offeredAmount: Number((e.target as any).offeredAmount.value),
              additionalNotes: (e.target as any).additionalNotes.value,
            }); }}>
              <TextField name="airport" label="Airport" defaultValue={editItem.airport} fullWidth margin="normal" required />
              <TextField name="arrivalDate" label="Arrival Date" type="datetime-local" defaultValue={editItem.arrivalDate?.slice(0,16)} fullWidth margin="normal" required InputLabelProps={{ shrink: true }} />
              <TextField name="offeredAmount" label="Offered Amount" type="number" defaultValue={editItem.offeredAmount} fullWidth margin="normal" required />
              <TextField name="additionalNotes" label="Additional Notes" defaultValue={editItem.additionalNotes} fullWidth margin="normal" />
              <Box className="flex gap-2 mt-4">
                <Button type="submit" variant="contained" color="primary" disabled={updatingPickupRequest}>Save</Button>
                <Button onClick={handleEditClose} variant="outlined">Cancel</Button>
              </Box>
            </Box>
          )}
          {editType === 'pickupOffer' && editItem && (
            <Box component="form" onSubmit={e => { e.preventDefault(); handleEditSubmit({
              airport: (e.target as any).airport.value,
              baseRate: Number((e.target as any).baseRate.value),
              averageRating: Number((e.target as any).averageRating.value),
              additionalInfo: (e.target as any).additionalInfo.value,
            }); }}>
              <TextField name="airport" label="Airport" defaultValue={editItem.airport} fullWidth margin="normal" required />
              <TextField name="baseRate" label="Base Rate" type="number" defaultValue={editItem.baseRate} fullWidth margin="normal" required />
              <TextField name="averageRating" label="Average Rating" type="number" defaultValue={editItem.averageRating} fullWidth margin="normal" required />
              <TextField name="additionalInfo" label="Additional Info" defaultValue={editItem.additionalInfo} fullWidth margin="normal" />
              <Box className="flex gap-2 mt-4">
                <Button type="submit" variant="contained" color="primary" disabled={updatingPickupOffer}>Save</Button>
                <Button onClick={handleEditClose} variant="outlined">Cancel</Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this {deleteType}?</Typography>
          <Box className="flex gap-2 mt-4">
            <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deletingRequest || deletingOffer || updatingPickupRequest || updatingPickupOffer}>
              Delete
            </Button>
            <Button onClick={handleDeleteCancel} variant="outlined">
              Cancel
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default UserProfile;
