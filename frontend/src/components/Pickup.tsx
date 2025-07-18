import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  LocalTaxi as TaxiIcon,
  Add as AddIcon,
  ContactMail as ContactIcon,
  LocationOn as LocationIcon,
  Flight as FlightIcon,
  Person as PersonIcon,
  Luggage as LuggageIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
} from "@mui/icons-material";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { addNotification } from "../store/slices/uiSlice";
import { selectIsAuthenticated } from "../store/slices/authSelectors";
import {
  useGetPickupRequestsQuery,
  useGetPickupOffersQuery,
  useCreatePickupRequestMutation,
  type PickupRequest,
  type PickupOffer,
  type CreatePickupRequestData,
} from "../store/api/pickupApi";
import PickupRequestForm from "./forms/PickupRequestForm";
import PickupOfferForm from "./forms/PickupOfferForm";
import { useTheme } from "../themes/ThemeProvider";
import useIsDarkMode from "../themes/useIsDarkMode";

// TypeScript Interfaces
interface PickupProps {}

// Main Component
const Pickup: React.FC<PickupProps> = () => {
  // Redux State
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // Add theme and dark mode detection
  const { muiTheme } = useTheme();
  const isDarkMode = useIsDarkMode();

  // RTK Query hooks replace manual fetch calls
  const {
    data: requests = [],
    isLoading: requestsLoading,
    error: requestsError,
    refetch: refetchRequests,
  } = useGetPickupRequestsQuery();

  const {
    data: offers = [],
    isLoading: offersLoading,
    error: offersError,
    refetch: refetchOffers,
  } = useGetPickupOffersQuery();

  const [createRequest, { isLoading: createRequestLoading }] =
    useCreatePickupRequestMutation();

  // Loading and error states
  const isLoading = requestsLoading || offersLoading;
  const error = requestsError || offersError;

  // Local State
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false);
  const [formType, setFormType] = useState<"request" | "offer">("request");
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  // Helper Functions
  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "warning" | "info"
  ): void => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = (): void => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Event Handlers
  const handleTabChange = (
    event: React.SyntheticEvent,
    newValue: number
  ): void => {
    setActiveTab(newValue);
  };

  const handleRequestSubmit = async (data: any): Promise<void> => {
    try {
      const requestData: CreatePickupRequestData = {
        flightNumber: data.flightNumber,
        arrivalDate: data.arrivalDate,
        arrivalTime: data.arrivalTime,
        airport: data.airport,
        destinationAddress: data.destinationAddress,
        passengerName: data.passengerName,
        passengerPhone: data.passengerPhone,
        passengerCount: data.passengerCount,
        hasLuggage: data.hasLuggage,
        offeredAmount: data.offeredAmount,
        specialRequests: data.specialRequests,
      };

      // Use RTK Query mutation instead of manual fetch
      await createRequest(requestData).unwrap();

      dispatch(
        addNotification({
          message: "Pickup request created successfully!",
          type: "success",
        })
      );

      setShowCreateDialog(false);
    } catch (error) {
      console.error("Error creating pickup request:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error creating pickup request";
      showSnackbar(errorMessage, "error");

      dispatch(
        addNotification({
          message: "Failed to create pickup request",
          type: "error",
        })
      );
    }
  };

  const handleOfferSubmit = async (data: any): Promise<void> => {
    try {
      // TODO: Implement offer creation using RTK Query when pickupApi is extended with offer creation
      console.log("Offer data:", data);

      dispatch(
        addNotification({
          message: "Pickup offer created successfully!",
          type: "success",
        })
      );

      setShowCreateDialog(false);
      showSnackbar(
        "Offer created successfully! (Mock implementation)",
        "success"
      );
    } catch (error) {
      console.error("Error creating offer:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error creating offer";
      showSnackbar(errorMessage, "error");

      dispatch(
        addNotification({
          message: "Failed to create pickup offer",
          type: "error",
        })
      );
    }
  };

  const handleContactDriver = (offer: PickupOffer): void => {
    showSnackbar(`Contacting driver for ${offer.vehicleType}`, "info");
  };

  const handleContactPassenger = (request: PickupRequest): void => {
    showSnackbar(`Contacting passenger for ${request.flightNumber}`, "info");
  };

  const handleOpenCreateDialog = (type: "request" | "offer"): void => {
    if (!isAuthenticated) {
      setSnackbar({
        open: true,
        message: "Please log in to use this feature.",
        severity: "warning",
      });
      return;
    }
    setFormType(type);
    setShowCreateDialog(true);
  };

  // Render Functions
  const renderRequestCard = (request: PickupRequest): JSX.Element => (
    <Card
      key={request.id}
      className="mb-4 hover:shadow-lg transition-shadow duration-200"
      style={{
        background: isDarkMode ? muiTheme.palette.background.paper : undefined,
      }}
    >
      <CardContent>
        <Box className="flex justify-between items-start mb-4">
          <Box className="flex items-center space-x-3">
            <FlightIcon style={{ color: isDarkMode ? "#00BCD4" : "#0B3866" }} />
            <Box>
              <Typography
                variant="h6"
                className="font-semibold text-gray-900 dark:text-gray-100"
              >
                {request.flightNumber}
              </Typography>
              <Chip
                label={request.airport}
                size="small"
                className="bg-blue-100 text-blue-800"
                sx={{
                  backgroundColor: isDarkMode ? "#112233" : "#DBEAFE",
                  color: isDarkMode ? "#00BCD4" : "#0B3866",
                }}
              />
            </Box>
          </Box>
          <Chip
            label={`NZD $${request.offeredAmount}`}
            className="bg-green-100 text-green-800 font-semibold"
            sx={{
              backgroundColor: isDarkMode ? "#003C2F" : "#D1FAE5",
              color: isDarkMode ? "#00E676" : "#168046",
            }}
          />
        </Box>

        <Box className="space-y-3 ">
          <Box className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
            <Box className="flex items-center space-x-2">
              <ScheduleIcon fontSize="small" />
              <span>{new Date(request.arrivalDate).toLocaleDateString()}</span>
              <span>{request.arrivalTime}</span>
            </Box>
          </Box>

          <Box className="flex items-start space-x-2">
            <LocationIcon
              fontSize="small"
              className="text-gray-400 mt-1 dark:text-gray-300"
            />
            <Typography
              variant="body2"
              className="text-gray-700 dark:text-gray-300"
            >
              <strong>To:</strong> {request.destinationAddress}
            </Typography>
          </Box>

          <Box className="flex items-center space-x-4 text-sm dark:text-gray-300">
            <Box className="flex items-center space-x-1">
              <PersonIcon fontSize="small" className="text-gray-400 " />
              <span>
                <strong>Passengers:</strong> {request.passengerCount}
              </span>
            </Box>
            {request.hasLuggage && (
              <Chip
                icon={<LuggageIcon />}
                label="Has Luggage"
                size="small"
                className="bg-blue-50 text-blue-700"
              />
            )}
          </Box>

          {request.passengerName && (
            <Typography
              variant="body2"
              className="text-gray-600 dark:text-gray-300"
            >
              <strong>Contact:</strong> {request.passengerName}
            </Typography>
          )}

          {request.specialRequests && (
            <Typography
              variant="body2"
              className="text-gray-600 dark:text-gray-300"
            >
              <strong>Special Requests:</strong> {request.specialRequests}
            </Typography>
          )}
        </Box>
      </CardContent>

      <CardActions className="justify-between bg-gray-50 dark:bg-gray-800">
        <Chip
          label={request.isMatched ? "Driver Found" : "Looking for Driver"}
          color={request.isMatched ? "success" : "default"}
          variant={request.isMatched ? "filled" : "outlined"}
          sx={
            request.isMatched
              ? {
                  backgroundColor: isDarkMode ? "#FFD600" : undefined,
                  color: isDarkMode ? "#333" : undefined,
                }
              : {
                  color: isDarkMode ? "#00BCD4" : undefined,
                  borderColor: isDarkMode ? "#00BCD4" : undefined,
                }
          }
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={<ContactIcon />}
          onClick={() => handleContactPassenger(request)}
          sx={{
            color: isDarkMode ? "#00BCD4" : "#0B3866",
            borderColor: isDarkMode ? "#00BCD4" : "#0B3866",
            "&:hover": {
              backgroundColor: isDarkMode
                ? "rgba(0, 188, 212, 0.1)"
                : "rgba(11, 56, 102, 0.1)",
            },
          }}
        >
          Contact
        </Button>
      </CardActions>
    </Card>
  );

  const renderOfferCard = (offer: PickupOffer): JSX.Element => (
    <Card
      key={offer.id}
      className="mb-4 hover:shadow-lg transition-shadow duration-200"
      style={{
        background: isDarkMode ? muiTheme.palette.background.paper : undefined,
      }}
    >
      <CardContent>
        <Box className="flex justify-between items-start mb-4">
          <Box className="flex items-center space-x-3">
            <TaxiIcon className="text-[#168046]" />
            <Box>
              <Typography
                variant="h6"
                className="font-semibold text-gray-900 dark:text-gray-100"
              >
                {offer.vehicleType}
              </Typography>
              <Chip
                label={offer.airport}
                size="small"
                className="bg-green-100 text-green-800"
                sx={{
                  backgroundColor: isDarkMode ? "#003C2F" : "#D1FAE5",
                  color: isDarkMode ? "#00E676" : "#168046",
                }}
              />
            </Box>
          </Box>
          <Box className="flex items-center space-x-1">
            <StarIcon className="text-yellow-500" fontSize="small" />
            <Typography variant="body2" className="font-medium">
              {offer.rating}
            </Typography>
          </Box>
        </Box>

        <Box className="space-y-2 mb-3">
          <Typography
            variant="body2"
            className="text-gray-600 dark:text-gray-300"
          >
            <strong>Capacity:</strong> {offer.maxPassengers} passengers max
          </Typography>

          <Typography
            variant="body2"
            className="text-gray-600 dark:text-gray-300"
          >
            <strong>Service Area:</strong> {offer.serviceArea}
          </Typography>

          {offer.languages && (
            <Typography
              variant="body2"
              className="text-gray-600 dark:text-gray-300"
            >
              <strong>Languages:</strong> {offer.languages}
            </Typography>
          )}

          <Typography
            variant="body2"
            className="text-gray-600 dark:text-gray-300"
          >
            <strong>Experience:</strong> {offer.totalTrips} completed rides
          </Typography>

          {offer.additionalServices && (
            <Typography
              variant="body2"
              className="text-gray-600 dark:text-gray-300"
            >
              <strong>Services:</strong> {offer.additionalServices}
            </Typography>
          )}
        </Box>

        <Box className="flex justify-between items-center">
          <Chip
            label={`$${offer.baseRate}`}
            className="bg-green-100 text-green-800 font-semibold"
            sx={{
              backgroundColor: isDarkMode ? "#003C2F" : "#D1FAE5",
              color: isDarkMode ? "#00E676" : "#168046",
            }}
          />
          {offer.canHandleLuggage && (
            <Chip
              icon={<LuggageIcon />}
              label="Luggage OK"
              size="small"
              className="bg-blue-50 text-blue-700"
              sx={{
                backgroundColor: isDarkMode ? "#112233" : "#DBEAFE",
                color: isDarkMode ? "#00BCD4" : "#0B3866",
              }}
            />
          )}
        </Box>
      </CardContent>

      <CardActions className="justify-between bg-gray-50 dark:bg-gray-800 mt-auto">
        <Chip label="Available" color="success" variant="outlined" />
        <Button
          variant="outlined"
          size="small"
          startIcon={<ContactIcon />}
          onClick={() => handleContactDriver(offer)}
          sx={{
            color: "#168046",
            borderColor: "#168046",
            "&:hover": {
              backgroundColor: "rgba(22, 128, 70, 0.1)",
            },
          }}
        >
          Contact
        </Button>
      </CardActions>
    </Card>
  );

  // Early return for error state
  if (error) {
    return (
      <Container maxWidth={false} className="py-8">
        <Paper
          className="p-6 text-center"
          style={{
            background: isDarkMode ? muiTheme.palette.background.paper : undefined,
          }}
        >
          <Typography variant="h6" color="error" className="mb-4">
            Error loading data
          </Typography>
          <Typography variant="body2" className="mb-4">
            {error.toString()}
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              refetchRequests();
              refetchOffers();
            }}
            sx={{
              backgroundColor: isDarkMode ? "#00BCD4" : "#0B3866",
              color: "#fff",
              "&:hover": {
                backgroundColor: isDarkMode
                  ? "rgba(0, 188, 212, 0.9)"
                  : "rgba(11, 56, 102, 0.9)",
              },
            }}
          >
            Retry
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} className="py-20 mb-20">
      {/* Header */}
      <Paper
        elevation={0}
        className="mb-8 p-6 "
        style={{
          background: isDarkMode ? muiTheme.palette.background.paper : undefined,
        }}
      >
        <Box className="text-center">
          <Typography
            variant="h3"
            component="h1"
            className="font-bold text-gray-900 dark:text-gray-100 mb-2"
          >
            Airport Pickup Service
          </Typography>
          <Typography
            variant="body1"
            className="text-gray-600 dark:text-gray-300"
          >
            Connect with reliable drivers for airport transfers
          </Typography>
        </Box>
      </Paper>

      {/* Navigation Tabs */}
      <Paper
        elevation={1}
        className="mb-6"
        style={{
          background: isDarkMode ? muiTheme.palette.background.paper : undefined,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          className="border-b border-gray-200"
          textColor="primary"
          indicatorColor="primary"
          sx={{
            "& .MuiTabs-indicator": isDarkMode
              ? { backgroundColor: "#00BCD4" }
              : {},
          }}
        >
          <Tab
            icon={
              <FlightIcon
                style={{ color: isDarkMode ? "#00BCD4" : undefined }}
              />
            }
            label={`Pickup Requests (${requests.length})`}
            className="font-medium"
            sx={{
              color: isDarkMode ? "#fff" : undefined,
              "&.Mui-selected": isDarkMode ? { color: "#00BCD4" } : {},
            }}
          />
          <Tab
            icon={
              <TaxiIcon style={{ color: isDarkMode ? "#00BCD4" : undefined }} />
            }
            label={`Available Drivers (${offers.length})`}
            className="font-medium"
            sx={{
              color: isDarkMode ? "#fff" : undefined,
              "&.Mui-selected": isDarkMode ? { color: "#00BCD4" } : {},
            }}
          />
        </Tabs>
      </Paper>

      {/* Action Button */}
      <Box className="text-center mb-8">
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() =>
            handleOpenCreateDialog(activeTab === 0 ? "request" : "offer")
          }
          sx={{
            backgroundColor:
              activeTab === 0
                ? isDarkMode
                  ? "#00BCD4"
                  : "#0B3866"
                : "#168046",
            color: "#fff",
            "&:hover": {
              backgroundColor:
                activeTab === 0
                  ? isDarkMode
                    ? "rgba(0, 188, 212, 0.9)"
                    : "rgba(11, 56, 102, 0.9)"
                  : "rgba(22, 128, 70, 0.9)",
            },
          }}
          className="px-8 py-3  my-3 text-white"
        >
          {activeTab === 0 ? "Request Pickup" : "Offer Service"}
        </Button>
      </Box>

      {/* Content */}
      <Box className="min-h-96">
        {activeTab === 0 && (
          <Box>
            {isLoading && !requests.length ? (
              <Box className="flex justify-center items-center py-12">
                <CircularProgress size={40} />
              </Box>
            ) : requests.length === 0 ? (
              <Paper
                className="text-center py-12 bg-gray-50 dark:bg-gray-800"
                style={{
                  background: isDarkMode
                    ? muiTheme.palette.background.paper
                    : undefined,
                }}
              >
                <FlightIcon
                  sx={{
                    fontSize: 64,
                    color: isDarkMode ? "#00BCD4" : undefined,
                  }}
                  className="text-gray-400 mb-4"
                />
                <Typography
                  variant="h6"
                  className="text-gray-600 dark:text-gray-300"
                >
                  No pickup requests yet
                </Typography>
                <Typography
                  variant="body2"
                  className="text-gray-500 dark:text-gray-400 mt-2"
                >
                  Be the first to request a pickup!
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {requests.map((request) => (
                  <Grid
                    item
                    xs={12}
                    sm={12}
                    md={6}
                    lg={4}
                    xl={3}
                    key={request.id}
                    className="flex flex-col"
                  >
                    {renderRequestCard(request)}
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            {isLoading && !offers.length ? (
              <Box className="flex justify-center items-center py-12">
                <CircularProgress size={40} />
              </Box>
            ) : offers.length === 0 ? (
              <Paper
                className="text-center py-12 bg-gray-50 dark:bg-gray-800"
                style={{
                  background: isDarkMode
                    ? muiTheme.palette.background.paper
                    : undefined,
                }}
              >
                <TaxiIcon
                  sx={{
                    fontSize: 64,
                    color: isDarkMode ? "#00BCD4" : undefined,
                  }}
                  className="text-gray-400 mb-4"
                />
                <Typography
                  variant="h6"
                  className="text-gray-600 dark:text-gray-300"
                >
                  No drivers available yet
                </Typography>
                <Typography
                  variant="body2"
                  className="text-gray-500 dark:text-gray-400 mt-2"
                >
                  Be the first to offer pickup services!
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {offers.map((offer) => (
                  <Grid
                    item
                    xs={12}
                    sm={12}
                    md={6}
                    lg={4}
                    xl={3}
                    key={offer.id}
                    className="flex flex-col"
                  >
                    {renderOfferCard(offer)}
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Box>

      {/* Create Request/Offer Dialog */}
      <Dialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          style={{
            background: isDarkMode ? muiTheme.palette.background.paper : undefined,
          }}
        >
          {formType === "request"
            ? "Request Airport Pickup"
            : "Offer Pickup Service"}
        </DialogTitle>

        <DialogContent
          className="p-6"
          style={{
            background: isDarkMode
              ? muiTheme.palette.background.default
              : undefined,
          }}
        >
          {formType === "request" ? (
            <PickupRequestForm
              onSubmit={handleRequestSubmit}
              onCancel={() => setShowCreateDialog(false)}
              loading={createRequestLoading}
            />
          ) : (
            <PickupOfferForm
              onSubmit={handleOfferSubmit}
              onCancel={() => setShowCreateDialog(false)}
              loading={false}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={2000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Pickup;
