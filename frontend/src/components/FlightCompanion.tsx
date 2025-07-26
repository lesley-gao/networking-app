import React, { useState, useEffect } from "react";
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
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  TextField,
} from "@mui/material";
import {
  Flight as FlightIcon,
  Add as AddIcon,
  ContactMail as ContactIcon,
  Help as HelpIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { addNotification } from "../store/slices/uiSlice";
import { selectIsAuthenticated } from "../store/slices/authSelectors";
import {
  useGetFlightCompanionRequestsQuery,
  useGetFlightCompanionOffersQuery,
  useCreateFlightCompanionRequestMutation,
  useCreateFlightCompanionOfferMutation,
  useSearchFlightCompanionRequestsQuery,
  type FlightCompanionRequest,
  type FlightCompanionOffer,
  type CreateFlightCompanionRequestData,
} from "../store/api/flightCompanionApi";
import FlightCompanionRequestForm from "./forms/FlightCompanionRequestForm";
import FlightCompanionOfferForm from "./forms/FlightCompanionOfferForm";
import { useTheme } from "../themes/ThemeProvider";
import useIsDarkMode from "../themes/useIsDarkMode";

// TypeScript Interfaces
interface FlightCompanionProps {}

// Main Component
const FlightCompanion: React.FC<FlightCompanionProps> = () => {
  // State Management
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [formType, setFormType] = useState<"request" | "offer">("request");
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [searchFilters, setSearchFilters] = useState<{
    flightNumber: string;
    flightDate: string;
  }>({
    flightNumber: "",
    flightDate: "",
  });
  const [showHelpDialog, setShowHelpDialog] = useState<boolean>(false);
  const [selectedRequestForHelp, setSelectedRequestForHelp] = useState<FlightCompanionRequest | null>(null);
  const [helpMessage, setHelpMessage] = useState<string>("");
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
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  // RTK Query hooks replace manual fetch calls and Redux slice integration
  const {
    data: requests = [],
    isLoading: requestsLoading,
    error: requestsError,
    refetch: refetchRequests,
  } = useGetFlightCompanionRequestsQuery();

  const {
    data: offers = [],
    isLoading: offersLoading,
    error: offersError,
    refetch: refetchOffers,
  } = useGetFlightCompanionOffersQuery();

  const [createRequest, { isLoading: createRequestLoading }] =
    useCreateFlightCompanionRequestMutation();
  const [createOffer, { isLoading: createOfferLoading }] = useCreateFlightCompanionOfferMutation();

  // Loading and error states
  const isLoading = requestsLoading || offersLoading;
  const error = requestsError || offersError;

  // Event Handlers
  const handleTabChange = (
    event: React.SyntheticEvent,
    newValue: number
  ): void => {
    setActiveTab(newValue);
  };

  const handleRequestSubmit = async (data: any): Promise<void> => {
    try {
      const requestData: CreateFlightCompanionRequestData = {
        flightNumber: data.flightNumber,
        airline: data.airline,
        flightDate: data.flightDate,
        departureAirport: data.departureAirport,
        arrivalAirport: data.arrivalAirport,
        travelerName: data.travelerName,
        travelerAge: data.travelerAge,
        specialNeeds: data.specialNeeds,
        offeredAmount: Number(data.offeredAmount),
        additionalNotes: data.additionalNotes,
      };

      // Use RTK Query mutation instead of manual fetch
      await createRequest(requestData).unwrap();

      showSnackbar("Flight companion request created successfully!", "success");
      setShowCreateForm(false);
    } catch (error) {
      console.error("Error creating request:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error creating request";
      showSnackbar(errorMessage, "error");
    }
  };

  const handleOfferSubmit = async (data: any): Promise<void> => {
    console.log("Offer form submitted with data:", data);
    try {
      // Add userId for backend validation (temporary, for testing)
      const offerData = { ...data, userId: 1 };
      await createOffer(offerData).unwrap();

      setShowCreateForm(false);
      showSnackbar("Offer created successfully!", "success");
      refetchOffers(); // Optionally refresh offers
    } catch (error) {
      console.error("Error creating offer:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error creating offer";
      showSnackbar(errorMessage, "error");
    }
  };

  const handleContactTraveler = (request: FlightCompanionRequest): void => {
    // Implementation for contacting traveler
    console.log("Contacting traveler:", request);
    showSnackbar("Contact feature coming soon!", "info");
  };

  const handleContactHelper = (offer: FlightCompanionOffer): void => {
    // Implementation for contacting helper
    console.log("Contacting helper:", offer);
    showSnackbar("Contact feature coming soon!", "info");
  };

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info" | "warning"
  ): void => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = (): void => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleOpenForm = () => {
    if (!isAuthenticated) {
      setSnackbar({
        open: true,
        message: "Please log in to use this feature.",
        severity: "warning",
      });
      return;
    }
    setFormType(activeTab === 0 ? "request" : "offer");
    setShowCreateForm(true);
  };

  const { muiTheme } = useTheme();
  const isDarkMode = useIsDarkMode();

  // Render Functions
  const renderRequestCard = (request: FlightCompanionRequest): JSX.Element => (
    <Card
      key={request.id}
      className="h-full hover:shadow-lg transition-shadow duration-200 flex flex-col"
      style={{
        minHeight: "320px",
        background: isDarkMode ? muiTheme.palette.background.paper : undefined,
      }}
    >
      <CardContent className="flex-grow">
        <Box className="flex justify-between items-start mb-3">
          <Box className="flex items-center space-x-2">
            <FlightIcon
              sx={{
                color: isDarkMode ? "#00BCD4" : "#0B3866",
              }}
            />
            <Typography
              variant="h6"
              className="font-semibold text-gray-900 dark:text-gray-100"
            >
              {request.flightNumber} - {request.airline}
            </Typography>
          </Box>
          <Chip
            label={`${request.departureAirport} → ${request.arrivalAirport}`}
            size="small"
            className="bg-blue-100 text-blue-800"
          />
        </Box>

        <Box className="space-y-2 mb-3">
          <Typography
            variant="body2"
            className="text-gray-600 dark:text-gray-300"
          >
            <strong>Date:</strong>{" "}
            {new Date(request.flightDate).toLocaleDateString()}
          </Typography>

          {request.travelerName && (
            <Typography
              variant="body2"
              className="text-gray-600 dark:text-gray-300"
            >
              <PersonIcon className="inline w-4 h-4 mr-1" />
              <strong>Traveler:</strong> {request.travelerName}
            </Typography>
          )}

          {request.specialNeeds && (
            <Box className="mb-2">
              <Typography
                variant="body2"
                className="text-gray-600 dark:text-gray-300"
              >
                <HelpIcon className="inline w-4 h-4 mr-1" />
                <strong>Help Needed:</strong>
              </Typography>
              <Typography
                variant="body2"
                className="ml-5 text-gray-700 dark:text-gray-200"
              >
                {request.specialNeeds}
              </Typography>
            </Box>
          )}

          {request.additionalNotes && (
            <Typography
              variant="body2"
              className="mb-2 text-gray-600 dark:text-gray-300"
            >
              <strong>Notes:</strong> {request.additionalNotes}
            </Typography>
          )}
        </Box>

        <Box className="flex justify-between items-center">
          <Chip
            label={`NZD $${request.offeredAmount}`}
            color="success"
            variant="filled"
            className="font-semibold"
          />
          {request.user && (
            <Typography variant="body2" color="textSecondary">
              by {request.user.firstName} {request.user.lastName}
            </Typography>
          )}
        </Box>
      </CardContent>

      <CardActions className="justify-between bg-gray-50 dark:bg-gray-800">
        <Chip
          label={request.isMatched ? "Matched" : "Looking for Helper"}
          color={request.isMatched ? "warning" : "success"}
          variant="outlined"
        />
        <Box className="flex gap-2">
          <Button
            variant="outlined"
            size="small"
            startIcon={<ContactIcon />}
            sx={{
              color: isDarkMode ? "#00BCD4" : "#0B3866",
              borderColor: isDarkMode ? "#00BCD4" : "#0B3866",
              "&:hover": {
                backgroundColor: isDarkMode
                  ? "rgba(0, 188, 212, 0.1)"
                  : "rgba(11, 56, 102, 0.1)",
              },
            }}
            onClick={() => handleContactTraveler(request)}
          >
            Contact
          </Button>
          {activeTab === 0 && !request.isMatched && (
            <Button
              variant="contained"
              size="small"
              startIcon={<HelpIcon />}
              sx={{
                backgroundColor: isDarkMode ? "#00BCD4" : "#0B3866",
                "&:hover": {
                  backgroundColor: isDarkMode ? "rgba(0, 188, 212, 0.9)" : "rgba(11, 56, 102, 0.9)",
                },
              }}
              onClick={() => handleOfferHelp(request)}
            >
              Offer Help
            </Button>
          )}
          {activeTab === 1 && !request.isMatched && (
            <Button
              variant={selectedRequestId === request.id ? "contained" : "outlined"}
              size="small"
              sx={{
                color: selectedRequestId === request.id 
                  ? "#fff" 
                  : (isDarkMode ? "#00BCD4" : "#0B3866"),
                backgroundColor: selectedRequestId === request.id 
                  ? (isDarkMode ? "#00BCD4" : "#0B3866") 
                  : "transparent",
                borderColor: isDarkMode ? "#00BCD4" : "#0B3866",
                "&:hover": {
                  backgroundColor: selectedRequestId === request.id 
                    ? (isDarkMode ? "rgba(0, 188, 212, 0.9)" : "rgba(11, 56, 102, 0.9)")
                    : (isDarkMode ? "rgba(0, 188, 212, 0.1)" : "rgba(11, 56, 102, 0.1)"),
                },
              }}
              onClick={() => selectedRequestId === request.id 
                ? handleClearSelection() 
                : handleSelectRequest(request.id)
              }
            >
              {selectedRequestId === request.id ? "Selected" : "Select"}
            </Button>
          )}
        </Box>
      </CardActions>
    </Card>
  );

  const renderOfferCard = (offer: FlightCompanionOffer): JSX.Element => (
    <Card
      key={offer.id}
      className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200"
      style={{
        minHeight: 340,
        height: 340,
        width: "100%",
        background: isDarkMode ? muiTheme.palette.background.paper : undefined,
      }}
    >
      <CardContent style={{ flexGrow: 1 }}>
        <Box className="flex justify-between items-start mb-3">
          <Box className="flex items-center space-x-2">
            <FlightIcon className="text-[#168046]" />
            <Typography
              variant="h6"
              className="font-semibold text-gray-900 dark:text-gray-100"
            >
              {offer.flightNumber} - {offer.airline}
            </Typography>
          </Box>
          <Chip
            label={`${offer.departureAirport} → ${offer.arrivalAirport}`}
            size="small"
            className="bg-green-100 text-green-800"
          />
        </Box>

        <Typography
          variant="body2"
          className="mb-2 text-gray-600 dark:text-gray-300"
        >
          <strong>Date:</strong>{" "}
          {new Date(offer.flightDate).toLocaleDateString()}
        </Typography>

        <Typography
          variant="body2"
          className="mb-2 text-gray-600 dark:text-gray-300"
        >
          <strong>Services:</strong>{" "}
          {offer.availableServices || "General assistance"}
        </Typography>

        <Typography
          variant="body2"
          className="mb-2 text-gray-600 dark:text-gray-300"
        >
          <strong>Languages:</strong> {offer.languages || "Not specified"}
        </Typography>

        <Typography
          variant="body2"
          className="mb-2 text-gray-600 dark:text-gray-300"
        >
          <strong>Experience:</strong> Helped {offer.helpedCount} travelers
        </Typography>
      </CardContent>

      <CardActions className="justify-between bg-gray-50 dark:bg-gray-800 mt-auto">
        <Chip label="Available" color="success" variant="outlined" />
        <Button
          variant="outlined"
          size="small"
          startIcon={<ContactIcon />}
          className="text-[#168046] border-[#168046]  hover:bg-[#168046]/10"
          onClick={() => handleContactHelper(offer)}
        >
          Contact
        </Button>
        {selectedRequestId && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleMatch(selectedRequestId, offer.id)}
          >
            Match
          </Button>
        )}
      </CardActions>
    </Card>
  );


  const handleMatch = async (requestId: number, offerId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://localhost:5001/api/flightcompanion/match', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId, offerId }),
      });
  
      if (!response.ok) {
        const error = await response.json();
        showSnackbar(error.message || 'Failed to match', 'error');
        return;
      }
  
      showSnackbar('Match successful!', 'success');
      setSelectedRequestId(null); // Clear selection after successful match
      // Optionally refresh data here
      refetchRequests();
      refetchOffers();
    } catch (error) {
      showSnackbar('Error matching: ' + error, 'error');
    }
  };

  const handleSelectRequest = (requestId: number) => {
    setSelectedRequestId(requestId);
    showSnackbar('Request selected. Now choose an offer to match.', 'info');
  };

  const handleClearSelection = () => {
    setSelectedRequestId(null);
    showSnackbar('Selection cleared.', 'info');
  };

  // Search and Help functionality
  const [searchParams, setSearchParams] = useState<{ flightNumber?: string; flightDate?: string } | null>(null);
  const [helperSearchFilters, setHelperSearchFilters] = useState<{
    flightNumber: string;
    airport: string;
  }>({
    flightNumber: "",
    airport: "",
  });
  const [helperSearchParams, setHelperSearchParams] = useState<{ flightNumber?: string; airport?: string } | null>(null);
  
  const { data: searchResults = [], isLoading: searchLoading } = useSearchFlightCompanionRequestsQuery(
    searchParams || { flightNumber: "", flightDate: "" },
    { skip: !searchParams }
  );

  const handleSearch = () => {
    // If both fields are empty, clear search and show all requests
    if (!searchFilters.flightNumber && !searchFilters.flightDate) {
      setSearchParams(null);
      showSnackbar("Showing all requests", "info");
      return;
    }

    // If at least one field has a value, perform search
    setSearchParams({
      flightNumber: searchFilters.flightNumber || undefined,
      flightDate: searchFilters.flightDate || undefined,
    });
    showSnackbar(`Searching for requests...`, "info");
  };

  const handleOfferHelp = (request: FlightCompanionRequest) => {
    setSelectedRequestForHelp(request);
    setShowHelpDialog(true);
  };

  const handleSendHelpMessage = async () => {
    if (!selectedRequestForHelp || !helpMessage.trim()) return;

    try {
      const response = await fetch("/api/flightcompanion/initiate-help", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          requestId: selectedRequestForHelp.id,
          initialMessage: helpMessage,
        }),
      });

      if (response.ok) {
        showSnackbar("Help message sent successfully!", "success");
        setShowHelpDialog(false);
        setHelpMessage("");
        setSelectedRequestForHelp(null);
      } else {
        const error = await response.json();
        showSnackbar(error.message || "Failed to send message", "error");
      }
    } catch (error) {
      showSnackbar("Error sending help message", "error");
    }
  };

  const handleCloseHelpDialog = () => {
    setShowHelpDialog(false);
    setHelpMessage("");
    setSelectedRequestForHelp(null);
  };

  // Auto-clear search when both fields are empty
  useEffect(() => {
    if (!searchFilters.flightNumber && !searchFilters.flightDate && searchParams) {
      setSearchParams(null);
    }
  }, [searchFilters.flightNumber, searchFilters.flightDate, searchParams]);

  // Helper search functionality
  const handleHelperSearch = () => {
    // If both fields are empty, clear search and show all offers
    if (!helperSearchFilters.flightNumber && !helperSearchFilters.airport) {
      setHelperSearchParams(null);
      showSnackbar("Showing all helpers", "info");
      return;
    }

    // If at least one field has a value, perform search
    setHelperSearchParams({
      flightNumber: helperSearchFilters.flightNumber || undefined,
      airport: helperSearchFilters.airport || undefined,
    });
    showSnackbar(`Searching for helpers...`, "info");
  };

  // Auto-clear helper search when both fields are empty
  useEffect(() => {
    if (!helperSearchFilters.flightNumber && !helperSearchFilters.airport && helperSearchParams) {
      setHelperSearchParams(null);
    }
  }, [helperSearchFilters.flightNumber, helperSearchFilters.airport, helperSearchParams]);

  // Filter offers based on search criteria
  const filteredOffers = helperSearchParams 
    ? offers.filter(offer => {
        const airportMatch = !helperSearchParams.airport || 
          offer.departureAirport.toLowerCase().includes(helperSearchParams.airport.toLowerCase());
        const flightMatch = !helperSearchParams.flightNumber || 
          offer.flightNumber.toLowerCase().includes(helperSearchParams.flightNumber.toLowerCase());
        
        return airportMatch && flightMatch;
      })
    : offers;


  // Early return for error state
  if (error) {
    return (
      <Container maxWidth="lg" className="py-8">
        <Paper className="p-6 text-center">
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
          >
            Retry
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} className="py-20 mb-20 ">
      {/* Header */}
      <Paper elevation={0} className="mb-8 p-6">
        <Box className="text-center">
          <Typography
            variant="h3"
            component="h1"
            className="font-bold text-gray-900 dark:text-gray-100 mb-2"
          >
            Flight Companion Service
          </Typography>
          <Typography
            variant="body1"
            className="text-gray-600 dark:text-gray-300"
          >
            Connect with helpful travelers on your flight route
          </Typography>
        </Box>
      </Paper>

      {/* Navigation Tabs */}
      <Paper elevation={1} className="mb-6">
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
            icon={<FlightIcon />}
            label={`Help Requests (${requests.length})`}
            className="font-medium"
            sx={{
              color: isDarkMode ? "#fff" : undefined,
              "&.Mui-selected": isDarkMode ? { color: "#00BCD4" } : {},
            }}
          />
          <Tab
            icon={<VolunteerActivismIcon />}
            label={`Available Helpers (${offers.length})`}
            className="font-medium"
            sx={{
              color: isDarkMode ? "#fff" : undefined,
              "&.Mui-selected": isDarkMode ? { color: "#00BCD4" } : {},
            }}
          />
        </Tabs>
      </Paper>

      {/* Content */}
      <Box className="min-h-96">
        {isLoading && !requests.length && !offers.length ? (
          <Box className="flex justify-center items-center py-12">
            <CircularProgress size={40} />
          </Box>
        ) : (
          <>
            {/* Requests Tab */}
            {activeTab === 0 && (
              <Box>
                {/* Search Filters */}
                <Paper className="mb-6 p-4">
                  <Typography variant="h6" className="mb-4">
                    Search for Requests to Help
                  </Typography>
                  <Grid container spacing={2} alignItems="end">
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        label="Flight Number"
                        value={searchFilters.flightNumber}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, flightNumber: e.target.value }))}
                        placeholder="e.g., NZ289"
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Flight Date"
                        value={searchFilters.flightDate}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, flightDate: e.target.value }))}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handleSearch}
                        sx={{
                          backgroundColor: isDarkMode ? "#00BCD4" : "#0B3866",
                          "&:hover": {
                            backgroundColor: isDarkMode ? "rgba(0, 188, 212, 0.9)" : "rgba(11, 56, 102, 0.9)",
                          },
                          height: "56px", // Match the default TextField height
                        }}
                      >
                        Search Requests
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => {
                          setSearchFilters({ flightNumber: "", flightDate: "" });
                          setSearchParams(null);
                          showSnackbar("Search cleared", "info");
                        }}
                        sx={{
                          borderColor: isDarkMode ? "#00BCD4" : "#0B3866",
                          color: isDarkMode ? "#00BCD4" : "#0B3866",
                          "&:hover": {
                            borderColor: isDarkMode ? "rgba(0, 188, 212, 0.9)" : "rgba(11, 56, 102, 0.9)",
                            backgroundColor: isDarkMode ? "rgba(0, 188, 212, 0.1)" : "rgba(11, 56, 102, 0.1)",
                          },
                          height: "56px", // Match the default TextField height
                        }}
                      >
                        Clear Search
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Action Button */}
                <Box className="text-center mb-8">
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<AddIcon />}
                    onClick={handleOpenForm}
                    sx={{
                      backgroundColor: isDarkMode ? "#00BCD4" : "#0B3866",
                      "&:hover": {
                        backgroundColor: isDarkMode ? "rgba(0, 188, 212, 0.9)" : "rgba(11, 56, 102, 0.9)",
                      },
                    }}
                    className="px-8 py-3 my-3 text-white"
                  >
                    Request Help
                  </Button>
                </Box>

                {searchLoading && (
                  <Box className="flex justify-center items-center py-12">
                    <CircularProgress size={40} />
                    <Typography variant="body1" className="ml-3">
                      Searching for requests...
                    </Typography>
                  </Box>
                )}

                {!searchLoading && (searchParams ? searchResults : requests).length === 0 ? (
                  <Paper className="text-center py-12 bg-gray-50 dark:bg-gray-800">
                    <HelpIcon
                      sx={{ fontSize: 64 }}
                      className="text-gray-400 mb-4"
                    />
                    <Typography
                      variant="h6"
                      className="text-gray-600 dark:text-gray-300"
                    >
                      {searchParams ? "No matching requests found" : "No help requests yet"}
                    </Typography>
                    <Typography
                      variant="body2"
                      className="text-gray-500 dark:text-gray-400 mt-2"
                    >
                      {searchParams ? "Try different search criteria" : "Be the first to request help!"}
                    </Typography>
                  </Paper>
                ) : (
                  <Grid container spacing={3}>
                    {(searchParams ? searchResults : requests).map((request) => (
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

            {/* Offers Tab */}
            {activeTab === 1 && (
              <Box>
                {/* Search Filters */}
                <Paper className="mb-6 p-4">
                  <Typography variant="h6" className="mb-4">
                    Search for Helper
                  </Typography>
                  <Grid container spacing={2} alignItems="end">
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        label="Flight Number"
                        value={helperSearchFilters.flightNumber}
                        onChange={(e) => setHelperSearchFilters(prev => ({ ...prev, flightNumber: e.target.value }))}
                        placeholder="e.g., NZ289"
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        label="Airport"
                        value={helperSearchFilters.airport}
                        onChange={(e) => setHelperSearchFilters(prev => ({ ...prev, airport: e.target.value }))}
                        placeholder="e.g., AKL"
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handleHelperSearch}
                        sx={{
                          backgroundColor: "#168046",
                          "&:hover": {
                            backgroundColor: "rgba(22, 128, 70, 0.9)",
                          },
                          height: "56px", // Match the default TextField height
                        }}
                      >
                        Search Helpers
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => {
                          setHelperSearchFilters({ flightNumber: "", airport: "" });
                          setHelperSearchParams(null);
                          showSnackbar("Search cleared", "info");
                        }}
                        sx={{
                          borderColor: "#168046",
                          color: "#168046",
                          "&:hover": {
                            borderColor: "rgba(22, 128, 70, 0.9)",
                            backgroundColor: "rgba(22, 128, 70, 0.1)",
                          },
                          height: "56px", // Match the default TextField height
                        }}
                      >
                        Clear Search
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Action Button */}
                <Box className="text-center mb-8">
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<AddIcon />}
                    onClick={handleOpenForm}
                    sx={{
                      backgroundColor: "#168046",
                      "&:hover": {
                        backgroundColor: "rgba(22, 128, 70, 0.9)",
                      },
                    }}
                    className="px-8 py-3 my-3 text-white"
                  >
                    Offer to Help
                  </Button>
                </Box>
                {selectedRequestId && (
                  <Paper className="mb-4 p-3 bg-blue-50 dark:bg-blue-900">
                    <Box className="flex justify-between items-center">
                      <Typography variant="body2" className="text-blue-800 dark:text-blue-200">
                        Request selected. Choose an offer to match.
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={handleClearSelection}
                      >
                        Clear Selection
                      </Button>
                    </Box>
                  </Paper>
                )}
                {filteredOffers.length === 0 ? (
                  <Paper className="text-center py-12 bg-gray-50 dark:bg-gray-800">
                    <FlightIcon
                      sx={{ fontSize: 64 }}
                      className="text-gray-400 mb-4"
                    />
                    <Typography
                      variant="h6"
                      className="text-gray-600 dark:text-gray-300"
                    >
                      {helperSearchParams ? "No matching helpers found" : "No helpers available yet"}
                    </Typography>
                    <Typography
                      variant="body2"
                      className="text-gray-500 dark:text-gray-400 mt-2"
                    >
                      {helperSearchParams ? "Try different search criteria" : "Be the first to offer help!"}
                    </Typography>
                  </Paper>
                ) : (
                  <Grid container spacing={2}>
                    {filteredOffers.map((offer) => (
                      <Grid
                        item
                        xs={12}
                        sm={12}
                        md={6}
                        lg={4}
                        xl={4}
                        key={offer.id}
                      >
                        {renderOfferCard(offer)}
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}
          </>
        )}
      </Box>

      {/* OfferHelp Dialog */}
      <Dialog
        open={showHelpDialog}
        onClose={handleCloseHelpDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Offer Help to {selectedRequestForHelp?.user?.firstName} {selectedRequestForHelp?.user?.lastName}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" style={{ marginBottom: '16px' }}>
            Send a message to offer your help for Flight {selectedRequestForHelp?.flightNumber} 
            from {selectedRequestForHelp?.departureAirport} to {selectedRequestForHelp?.arrivalAirport}.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Your message"
            value={helpMessage}
            onChange={(e) => setHelpMessage(e.target.value)}
            placeholder="Hi! I'd be happy to help you with your flight. I can assist with..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHelpDialog}>Cancel</Button>
          <Button
            onClick={handleSendHelpMessage}
            variant="contained"
            disabled={!helpMessage.trim()}
            sx={{
              backgroundColor: isDarkMode ? "#00BCD4" : "#0B3866",
              "&:hover": {
                backgroundColor: isDarkMode ? "rgba(0, 188, 212, 0.9)" : "rgba(11, 56, 102, 0.9)",
              },
            }}
          >
            Send Message
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Request/Offer Dialog */}
      <Dialog
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {formType === "request"
            ? "Request Flight Companion Help"
            : "Offer to Help as Flight Companion"}
        </DialogTitle>

        <DialogContent>
          {formType === "request" ? (
            <FlightCompanionRequestForm
              onSubmit={handleRequestSubmit}
              onCancel={() => setShowCreateForm(false)}
              loading={createRequestLoading}
            />
          ) : (
            <FlightCompanionOfferForm
              onSubmit={handleOfferSubmit}
              onCancel={() => setShowCreateForm(false)}
              loading={createOfferLoading}
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
        sx={{ zIndex: 1400 }}
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

export default FlightCompanion;
