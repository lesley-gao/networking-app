import React, { useState } from 'react';
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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress,
  SelectChangeEvent,
} from '@mui/material';
import {
  Flight as FlightIcon,
  Add as AddIcon,
  ContactMail as ContactIcon,
  Help as HelpIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAppDispatch} from '../store/hooks';
import { addNotification } from '../store/slices/uiSlice';
import { 
  useGetFlightCompanionRequestsQuery,
  useGetFlightCompanionOffersQuery,
  useCreateFlightCompanionRequestMutation,
  type FlightCompanionRequest,
  type FlightCompanionOffer,
  type CreateFlightCompanionRequestData
} from '../store/api/flightCompanionApi';

// TypeScript Interfaces
interface RequestFormData {
  flightNumber: string;
  airline: string;
  flightDate: string;
  departureAirport: string;
  arrivalAirport: string;
  travelerName: string;
  travelerAge: string;
  specialNeeds: string;
  offeredAmount: number;
  additionalNotes: string;
}

interface FlightCompanionProps {}

// Main Component
const FlightCompanion: React.FC<FlightCompanionProps> = () => {
  // State Management
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Redux Integration
  const dispatch = useAppDispatch();
  //const { user } = useAppSelector((state) => state.auth);
  
  // RTK Query hooks replace manual fetch calls and Redux slice integration
  const {
    data: requests = [],
    isLoading: requestsLoading,
    error: requestsError,
    refetch: refetchRequests
  } = useGetFlightCompanionRequestsQuery();
  
  const {
    data: offers = [],
    isLoading: offersLoading,
    error: offersError,
    refetch: refetchOffers
  } = useGetFlightCompanionOffersQuery();
  
  const [createRequest, { isLoading: createRequestLoading }] = useCreateFlightCompanionRequestMutation();

  // Loading and error states
  const isLoading = requestsLoading || offersLoading;
  const error = requestsError || offersError;

  // Form Data
  const [formData, setFormData] = useState<RequestFormData>({
    flightNumber: '',
    airline: '',
    flightDate: '',
    departureAirport: '',
    arrivalAirport: '',
    travelerName: '',
    travelerAge: 'Adult',
    specialNeeds: '',
    offeredAmount: 0,
    additionalNotes: '',
  });

  // Airport Options
  const airportOptions = [
    { value: 'AKL', label: 'Auckland (AKL)' },
    { value: 'PVG', label: 'Shanghai (PVG)' },
    { value: 'PEK', label: 'Beijing (PEK)' },
    { value: 'CAN', label: 'Guangzhou (CAN)' },
  ];

  const travelerAgeOptions = [
    { value: 'Elderly', label: 'Elderly' },
    { value: 'Adult', label: 'Adult' },
    { value: 'Young Adult', label: 'Young Adult' },
  ];

  // Event Handlers
  const handleTabChange = (event: React.SyntheticEvent, newValue: number): void => {
    setActiveTab(newValue);
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (event: SelectChangeEvent<string>): void => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    
    try {
      const requestData: CreateFlightCompanionRequestData = {
        flightNumber: formData.flightNumber,
        airline: formData.airline,
        flightDate: formData.flightDate,
        departureAirport: formData.departureAirport,
        arrivalAirport: formData.arrivalAirport,
        travelerName: formData.travelerName,
        travelerAge: formData.travelerAge,
        specialNeeds: formData.specialNeeds,
        offeredAmount: Number(formData.offeredAmount),
        additionalNotes: formData.additionalNotes,
      };

      // Use RTK Query mutation instead of manual fetch
      await createRequest(requestData).unwrap();
      
      dispatch(addNotification({
        message: 'Flight companion request created successfully!',
        type: 'success',
      }));
      
      setShowCreateForm(false);
      resetForm();
      
    } catch (error) {
      console.error('Error creating request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error creating request';
      showSnackbar(errorMessage, 'error');
      
      dispatch(addNotification({
        message: 'Failed to create flight companion request',
        type: 'error',
      }));
    }
  };

  const resetForm = (): void => {
    setFormData({
      flightNumber: '',
      airline: '',
      flightDate: '',
      departureAirport: '',
      arrivalAirport: '',
      travelerName: '',
      travelerAge: 'Adult',
      specialNeeds: '',
      offeredAmount: 0,
      additionalNotes: '',
    });
  };

  const handleContactTraveler = (request: FlightCompanionRequest): void => {
    // Implementation for contacting traveler
    console.log('Contacting traveler:', request);
    showSnackbar('Contact feature coming soon!', 'info');
  };

  const handleContactHelper = (offer: FlightCompanionOffer): void => {
    // Implementation for contacting helper
    console.log('Contacting helper:', offer);
    showSnackbar('Contact feature coming soon!', 'info');
  };

  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'info' | 'warning'
  ): void => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = (): void => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Render Functions
  const renderRequestCard = (request: FlightCompanionRequest): JSX.Element => (
    <Card key={request.id} className="h-full hover:shadow-lg transition-shadow duration-200">
      <CardContent>
        <Box className="flex justify-between items-start mb-3">
          <Box className="flex items-center space-x-2">
            <FlightIcon className="text-blue-600" />
            <Typography variant="h6" className="font-semibold text-gray-900 dark:text-gray-100">
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
          <Typography variant="body2" className="text-gray-600 dark:text-gray-300">
            <strong>Date:</strong> {new Date(request.flightDate).toLocaleDateString()}
          </Typography>

          {request.travelerName && (
            <Typography variant="body2" className="text-gray-600 dark:text-gray-300">
              <PersonIcon className="inline w-4 h-4 mr-1" />
              <strong>Traveler:</strong> {request.travelerName}
            </Typography>
          )}

          {request.specialNeeds && (
            <Box className="mb-2">
              <Typography variant="body2" className="text-gray-600 dark:text-gray-300">
                <HelpIcon className="inline w-4 h-4 mr-1" />
                <strong>Help Needed:</strong>
              </Typography>
              <Typography variant="body2" className="ml-5 text-gray-700 dark:text-gray-200">
                {request.specialNeeds}
              </Typography>
            </Box>
          )}

          {request.additionalNotes && (
            <Typography variant="body2" className="mb-2 text-gray-600 dark:text-gray-300">
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
        </Box>
      </CardContent>

      <CardActions className="justify-between bg-gray-50 dark:bg-gray-800">
        <Chip
          label={request.isMatched ? 'Matched' : 'Looking for Helper'}
          color={request.isMatched ? 'warning' : 'success'}
          variant="outlined"
          size="small"
        />
        <Button
          variant="contained"
          size="small"
          startIcon={<ContactIcon />}
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => handleContactTraveler(request)}
        >
          Contact
        </Button>
      </CardActions>
    </Card>
  );

  const renderOfferCard = (offer: FlightCompanionOffer): JSX.Element => (
    <Card key={offer.id} className="h-full hover:shadow-lg transition-shadow duration-200">
      <CardContent>
        <Box className="flex justify-between items-start mb-3">
          <Box className="flex items-center space-x-2">
            <FlightIcon className="text-green-600" />
            <Typography variant="h6" className="font-semibold text-gray-900 dark:text-gray-100">
              {offer.flightNumber} - {offer.airline}
            </Typography>
          </Box>
          <Chip
            label={`${offer.departureAirport} → ${offer.arrivalAirport}`}
            size="small"
            className="bg-green-100 text-green-800"
          />
        </Box>

        <Typography variant="body2" className="mb-2 text-gray-600 dark:text-gray-300">
          <strong>Date:</strong> {new Date(offer.flightDate).toLocaleDateString()}
        </Typography>

        <Typography variant="body2" className="mb-2 text-gray-600 dark:text-gray-300">
          <strong>Services:</strong> {offer.availableServices || 'General assistance'}
        </Typography>

        <Typography variant="body2" className="mb-2 text-gray-600 dark:text-gray-300">
          <strong>Languages:</strong> {offer.languages || 'Not specified'}
        </Typography>

        <Typography variant="body2" className="mb-2 text-gray-600 dark:text-gray-300">
          <strong>Experience:</strong> Helped {offer.helpedCount} travelers
        </Typography>
      </CardContent>

      <CardActions className="justify-between bg-gray-50 dark:bg-gray-800">
        <Chip
          label="Available"
          color="success"
          variant="outlined"
          size="small"
        />
        <Button
          variant="contained"
          size="small"
          startIcon={<ContactIcon />}
          className="bg-green-600 hover:bg-green-700"
          onClick={() => handleContactHelper(offer)}
        >
          Contact
        </Button>
      </CardActions>
    </Card>
  );

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
    <Container maxWidth="lg" className="py-8">
      {/* Header */}
      <Paper elevation={0} className="mb-8 p-6 ">
        <Box className="text-center">
          <Typography variant="h3" component="h1" className="font-bold text-gray-900 dark:text-gray-100 mb-2">
            Flight Companion Service
          </Typography>
          <Typography variant="body1" className="text-gray-600 dark:text-gray-300">
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
        >
          <Tab
            icon={<HelpIcon />}
            label={`Help Requests (${requests.length})`}
            className="font-medium"
          />
          <Tab
            label={`Available Helpers (${offers.length})`}
            className="font-medium"
          />
        </Tabs>
      </Paper>

      {/* Action Button */}
      <Box className="text-center mb-6">
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
        >
          {activeTab === 0 ? 'Request Help' : 'Offer to Help'}
        </Button>
      </Box>

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
                {requests.length === 0 ? (
                  <Paper className="text-center py-12 bg-gray-50 dark:bg-gray-800">
                    <HelpIcon
                      sx={{ fontSize: 64 }}
                      className="text-gray-400 mb-4"
                    />
                    <Typography
                      variant="h6"
                      className="text-gray-600 dark:text-gray-300"
                    >
                      No help requests yet
                    </Typography>
                    <Typography
                      variant="body2"
                      className="text-gray-500 dark:text-gray-400 mt-2"
                    >
                      Be the first to request help!
                    </Typography>
                  </Paper>
                ) : (
                  <Grid container spacing={2} className="grid-cards">
                    {requests.map((request) => (
                      <Grid 
                        item 
                        xs={12} 
                        sm={6} 
                        md={6} 
                        lg={4} 
                        xl={3}
                        key={request.id}
                        className="flex"
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
                {offers.length === 0 ? (
                  <Paper className="text-center py-12 bg-gray-50 dark:bg-gray-800">
                    <FlightIcon
                      sx={{ fontSize: 64 }}
                      className="text-gray-400 mb-4"
                    />
                    <Typography
                      variant="h6"
                      className="text-gray-600 dark:text-gray-300"
                    >
                      No helpers available yet
                    </Typography>
                    <Typography
                      variant="body2"
                      className="text-gray-500 dark:text-gray-400 mt-2"
                    >
                      Be the first to offer help!
                    </Typography>
                  </Paper>
                ) : (
                  <Grid container spacing={2}>
                    {offers.map((offer) => (
                      <Grid item xs={12} md={6} lg={4} key={offer.id}>
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

      {/* Create Request Dialog */}
      <Dialog
        open={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle className="bg-gray-50 dark:bg-gray-800 border-b">
          <Typography variant="h6" className="font-semibold">
            Request Flight Companion Help
          </Typography>
        </DialogTitle>

        <DialogContent className="p-6">
          <form onSubmit={handleFormSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="flightNumber"
                  label="Flight Number"
                  value={formData.flightNumber}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  placeholder="e.g., NZ289"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="airline"
                  label="Airline"
                  value={formData.airline}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="flightDate"
                  label="Flight Date"
                  type="datetime-local"
                  value={formData.flightDate}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>From Airport</InputLabel>
                  <Select
                    name="departureAirport"
                    value={formData.departureAirport}
                    onChange={handleSelectChange}
                    label="From Airport"
                  >
                    {airportOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>To Airport</InputLabel>
                  <Select
                    name="arrivalAirport"
                    value={formData.arrivalAirport}
                    onChange={handleSelectChange}
                    label="To Airport"
                  >
                    {airportOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="travelerName"
                  label="Traveler Name (Optional)"
                  value={formData.travelerName}
                  onChange={handleInputChange}
                  fullWidth
                  placeholder="e.g., My elderly mother"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Traveler Age Group</InputLabel>
                  <Select
                    name="travelerAge"
                    value={formData.travelerAge}
                    onChange={handleSelectChange}
                    label="Traveler Age Group"
                  >
                    {travelerAgeOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="specialNeeds"
                  label="Special Assistance Needed"
                  value={formData.specialNeeds}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="e.g., Language translation, wheelchair assistance, medication reminders..."
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="offeredAmount"
                  label="Offered Amount (NZD)"
                  type="number"
                  value={formData.offeredAmount}
                  onChange={handleInputChange}
                  fullWidth
                  inputProps={{ min: 0, max: 500 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="additionalNotes"
                  label="Additional Notes"
                  value={formData.additionalNotes}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Any other important information..."
                />
              </Grid>
            </Grid>
          </form>
        </DialogContent>

        <DialogActions className="p-6 pt-0">
          <Button 
            onClick={() => setShowCreateForm(false)}
            className="text-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={(event: any) => handleFormSubmit(event)}
            variant="contained"
            disabled={createRequestLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {createRequestLoading && <CircularProgress size={20} className="mr-2" />}
            Create Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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