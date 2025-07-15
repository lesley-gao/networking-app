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
  Snackbar,
  Alert,
  CircularProgress,
  SelectChangeEvent,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
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
} from '@mui/icons-material';
import { useAppDispatch } from '../store/hooks';
import { addNotification } from '../store/slices/uiSlice';
import {
  useGetPickupRequestsQuery,
  useGetPickupOffersQuery,
  useCreatePickupRequestMutation,
  type PickupRequest,
  type PickupOffer,
  type CreatePickupRequestData
} from '../store/api/pickupApi';

// TypeScript Interfaces  
interface RequestFormData {
  flightNumber: string;
  arrivalDate: string;
  arrivalTime: string;
  airport: string;
  destinationAddress: string;
  passengerName: string;
  passengerPhone: string;
  passengerCount: number;
  hasLuggage: boolean;
  offeredAmount: number;
  specialRequests: string;
}

interface OfferFormData {
  airport: string;
  vehicleType: string;
  maxPassengers: number;
  canHandleLuggage: boolean;
  serviceArea: string;
  baseRate: number;
  languages: string;
  additionalServices: string;
}

interface PickupProps {}

// Main Component
const Pickup: React.FC<PickupProps> = () => {
  // Redux State - removed unused 'user' variable
  const dispatch = useAppDispatch();

  // RTK Query hooks replace manual fetch calls
  const {
    data: requests = [],
    isLoading: requestsLoading,
    error: requestsError,
    refetch: refetchRequests
  } = useGetPickupRequestsQuery();
  
  const {
    data: offers = [],
    isLoading: offersLoading,
    error: offersError,
    refetch: refetchOffers
  } = useGetPickupOffersQuery();
  
  const [createRequest, { isLoading: createRequestLoading }] = useCreatePickupRequestMutation();

  // Loading and error states
  const isLoading = requestsLoading || offersLoading;
  const error = requestsError || offersError;

  // Local State
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showCreateDialog, setShowCreateDialog] = useState<boolean>(false);
  const [formType, setFormType] = useState<'request' | 'offer'>('request');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // Form Data State
  const [requestFormData, setRequestFormData] = useState<RequestFormData>({
    flightNumber: '',
    arrivalDate: '',
    arrivalTime: '',
    airport: 'AKL',
    destinationAddress: '',
    passengerName: '',
    passengerPhone: '',
    passengerCount: 1,
    hasLuggage: true,
    offeredAmount: 0,
    specialRequests: '',
  });

  const [offerFormData, setOfferFormData] = useState<OfferFormData>({
    airport: 'AKL',
    vehicleType: '',
    maxPassengers: 4,
    canHandleLuggage: true,
    serviceArea: '',
    baseRate: 0,
    languages: '',
    additionalServices: '',
  });

  // Helper Functions
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info'): void => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = (): void => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const resetRequestForm = (): void => {
    setRequestFormData({
      flightNumber: '',
      arrivalDate: '',
      arrivalTime: '',
      airport: 'AKL',
      destinationAddress: '',
      passengerName: '',
      passengerPhone: '',
      passengerCount: 1,
      hasLuggage: true,
      offeredAmount: 0,
      specialRequests: '',
    });
  };

  const resetOfferForm = (): void => {
    setOfferFormData({
      airport: 'AKL',
      vehicleType: '',
      maxPassengers: 4,
      canHandleLuggage: true,
      serviceArea: '',
      baseRate: 0,
      languages: '',
      additionalServices: '',
    });
  };

  // Event Handlers
  const handleTabChange = (event: React.SyntheticEvent, newValue: number): void => {
    setActiveTab(newValue);
  };

  const handleRequestInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value, type } = event.target;
    const parsedValue = type === 'number' ? Number(value) : value;
    
    setRequestFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  const handleRequestSelectChange = (event: SelectChangeEvent<any>): void => {
    const { name, value } = event.target;
    setRequestFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRequestCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, checked } = event.target;
    setRequestFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleCreateRequest = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    
    try {
      const requestData: CreatePickupRequestData = {
        flightNumber: requestFormData.flightNumber,
        arrivalDate: requestFormData.arrivalDate,
        arrivalTime: requestFormData.arrivalTime,
        airport: requestFormData.airport,
        destinationAddress: requestFormData.destinationAddress,
        passengerName: requestFormData.passengerName,
        passengerPhone: requestFormData.passengerPhone,
        passengerCount: requestFormData.passengerCount,
        hasLuggage: requestFormData.hasLuggage,
        offeredAmount: requestFormData.offeredAmount,
        specialRequests: requestFormData.specialRequests,
      };

      // Use RTK Query mutation instead of manual fetch
      await createRequest(requestData).unwrap();
      
      dispatch(addNotification({
        message: 'Pickup request created successfully!',
        type: 'success',
      }));
      
      setShowCreateDialog(false);
      resetRequestForm();
      
    } catch (error) {
      console.error('Error creating pickup request:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error creating pickup request';
      showSnackbar(errorMessage, 'error');
      
      dispatch(addNotification({
        message: 'Failed to create pickup request',
        type: 'error',
      }));
    }
  };

  const handleCreateOffer = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    
    // TODO: Implement offer creation using RTK Query when pickupApi is extended with offer creation
    // For now, just show a message and reset the form
    showSnackbar('Offer creation will be implemented with RTK Query', 'info');
    
    // Reset the form when this is properly implemented
    resetOfferForm();
    setShowCreateDialog(false);
  };

  const handleContactDriver = (offer: PickupOffer): void => {
    showSnackbar(`Contacting driver for ${offer.vehicleType}`, 'info');
  };

  const handleContactPassenger = (request: PickupRequest): void => {
    showSnackbar(`Contacting passenger for ${request.flightNumber}`, 'info');
  };

  const openCreateDialog = (type: 'request' | 'offer'): void => {
    setFormType(type);
    setShowCreateDialog(true);
  };

  // Render Functions
  const renderRequestCard = (request: PickupRequest): JSX.Element => (
    <Card key={request.id} className="mb-4 hover:shadow-lg transition-shadow duration-200">
      <CardContent>
        <Box className="flex justify-between items-start mb-4">
          <Box className="flex items-center space-x-3">
            <FlightIcon className="text-blue-600" />
            <Box>
              <Typography variant="h6" className="font-semibold text-gray-900">
                {request.flightNumber}
              </Typography>
              <Chip 
                label={request.airport} 
                size="small" 
                className="bg-blue-100 text-blue-800"
              />
            </Box>
          </Box>
          <Chip 
            label={`NZD $${request.offeredAmount}`}
            className="bg-green-100 text-green-800 font-semibold"
          />
        </Box>

        <Box className="space-y-3">
          <Box className="flex items-center justify-between text-sm text-gray-600">
            <Box className="flex items-center space-x-2">
              <ScheduleIcon fontSize="small" />
              <span>{new Date(request.arrivalDate).toLocaleDateString()}</span>
              <span>{request.arrivalTime}</span>
            </Box>
          </Box>

          <Box className="flex items-start space-x-2">
            <LocationIcon fontSize="small" className="text-gray-400 mt-1" />
            <Typography variant="body2" className="text-gray-700">
              <strong>To:</strong> {request.destinationAddress}
            </Typography>
          </Box>

          <Box className="flex items-center space-x-4 text-sm">
            <Box className="flex items-center space-x-1">
              <PersonIcon fontSize="small" className="text-gray-400" />
              <span><strong>Passengers:</strong> {request.passengerCount}</span>
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
            <Typography variant="body2" className="text-gray-600">
              <strong>Contact:</strong> {request.passengerName}
            </Typography>
          )}

          {request.specialRequests && (
            <Typography variant="body2" className="text-gray-600">
              <strong>Special Requests:</strong> {request.specialRequests}
            </Typography>
          )}
        </Box>
      </CardContent>

      <CardActions className="justify-between bg-gray-50">
        <Chip 
          label={request.isMatched ? 'Driver Found' : 'Looking for Driver'}
          color={request.isMatched ? 'success' : 'default'}
          variant={request.isMatched ? 'filled' : 'outlined'}
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={<ContactIcon />}
          onClick={() => handleContactPassenger(request)}
          className="text-blue-600 border-blue-600 hover:bg-blue-50"
        >
          Contact
        </Button>
      </CardActions>
    </Card>
  );

  const renderOfferCard = (offer: PickupOffer): JSX.Element => (
    <Card key={offer.id} className="mb-4 hover:shadow-lg transition-shadow duration-200">
      <CardContent>
        <Box className="flex justify-between items-start mb-4">
          <Box className="flex items-center space-x-3">
            <TaxiIcon className="text-green-600" />
            <Box>
              <Typography variant="h6" className="font-semibold text-gray-900">
                {offer.vehicleType}
              </Typography>
              <Chip 
                label={offer.airport} 
                size="small" 
                className="bg-green-100 text-green-800"
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
          <Typography variant="body2" className="text-gray-600">
            <strong>Capacity:</strong> {offer.maxPassengers} passengers max
          </Typography>
          
          <Typography variant="body2" className="text-gray-600">
            <strong>Service Area:</strong> {offer.serviceArea}
          </Typography>

          {offer.languages && (
            <Typography variant="body2" className="text-gray-600">
              <strong>Languages:</strong> {offer.languages}
            </Typography>
          )}

          <Typography variant="body2" className="text-gray-600">
            <strong>Experience:</strong> {offer.totalTrips} completed rides
          </Typography>

          {offer.additionalServices && (
            <Typography variant="body2" className="text-gray-600">
              <strong>Services:</strong> {offer.additionalServices}
            </Typography>
          )}
        </Box>

        <Box className="flex justify-between items-center">
          <Chip 
            label={`$${offer.baseRate}`}
            className="bg-green-100 text-green-800 font-semibold"
          />
          {offer.canHandleLuggage && (
            <Chip 
              icon={<LuggageIcon />} 
              label="Luggage OK" 
              size="small"
              className="bg-blue-50 text-blue-700"
            />
          )}
        </Box>
      </CardContent>

      <CardActions className="justify-between bg-gray-50">
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
          onClick={() => handleContactDriver(offer)}
          className="bg-green-600 hover:bg-green-700"
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
    <Container maxWidth={false} className="py-20 mb-20">
      {/* Header */}
      <Paper elevation={0} className="mb-8 p-6 ">
        <Box className="text-center">
          <Typography variant="h3" component="h1" className="font-bold text-gray-900 dark:text-gray-100 mb-2">
            Airport Pickup Service
          </Typography>
          <Typography variant="body1" className="text-gray-600 dark:text-gray-300">
            Connect with reliable drivers for airport transfers
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
            icon={<FlightIcon />}
            label={`Pickup Requests (${requests.length})`}
            className="font-medium"
          />
          <Tab
            icon={<TaxiIcon />}
            label={`Available Drivers (${offers.length})`}
            className="font-medium"
          />
        </Tabs>
      </Paper>

      {/* Action Button */}
      <Box className="text-center mb-8">
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={() => openCreateDialog(activeTab === 0 ? 'request' : 'offer')}
          className={`px-8 py-3  my-3 text-white ${
            activeTab === 0 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {activeTab === 0 ? 'Request Pickup' : 'Offer Service'}
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
              <Paper className="text-center py-12 bg-gray-50 dark:bg-gray-800">
                <FlightIcon
                  sx={{ fontSize: 64 }}
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
              <Paper className="text-center py-12 bg-gray-50 dark:bg-gray-800">
                <TaxiIcon
                  sx={{ fontSize: 64 }}
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
        <DialogTitle className="bg-gray-50 border-b">
          <Typography variant="h6" className="font-semibold">
            {formType === 'request' ? 'Request Airport Pickup' : 'Offer Pickup Service'}
          </Typography>
        </DialogTitle>

        <DialogContent className="p-6">
          {formType === 'request' ? (
            <form onSubmit={handleCreateRequest}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="flightNumber"
                    label="Flight Number"
                    value={requestFormData.flightNumber}
                    onChange={handleRequestInputChange}
                    fullWidth
                    required
                    placeholder="e.g., NZ289"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Airport</InputLabel>
                    <Select
                      name="airport"
                      value={requestFormData.airport}
                      onChange={handleRequestSelectChange}
                      label="Airport"
                    >
                      <MenuItem value="AKL">Auckland (AKL)</MenuItem>
                      <MenuItem value="WLG">Wellington (WLG)</MenuItem>
                      <MenuItem value="CHC">Christchurch (CHC)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="arrivalDate"
                    label="Arrival Date"
                    type="date"
                    value={requestFormData.arrivalDate}
                    onChange={handleRequestInputChange}
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="arrivalTime"
                    label="Arrival Time"
                    type="time"
                    value={requestFormData.arrivalTime}
                    onChange={handleRequestInputChange}
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="destinationAddress"
                    label="Destination Address"
                    value={requestFormData.destinationAddress}
                    onChange={handleRequestInputChange}
                    fullWidth
                    required
                    placeholder="Full address including suburb"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="passengerName"
                    label="Passenger Name"
                    value={requestFormData.passengerName}
                    onChange={handleRequestInputChange}
                    fullWidth
                    placeholder="Name of person being picked up"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="passengerPhone"
                    label="Passenger Phone"
                    type="tel"
                    value={requestFormData.passengerPhone}
                    onChange={handleRequestInputChange}
                    fullWidth
                    placeholder="+64 21 123 4567"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Number of Passengers</InputLabel>
                    <Select
                      name="passengerCount"
                      value={requestFormData.passengerCount}
                      onChange={handleRequestSelectChange}
                      label="Number of Passengers"
                    >
                      <MenuItem value={1}>1 person</MenuItem>
                      <MenuItem value={2}>2 people</MenuItem>
                      <MenuItem value={3}>3 people</MenuItem>
                      <MenuItem value={4}>4+ people</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="offeredAmount"
                    label="Offered Amount (NZD)"
                    type="number"
                    value={requestFormData.offeredAmount}
                    onChange={handleRequestInputChange}
                    fullWidth
                    inputProps={{ min: 0, max: 200 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="hasLuggage"
                        checked={requestFormData.hasLuggage}
                        onChange={handleRequestCheckboxChange}
                      />
                    }
                    label="I have luggage"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="specialRequests"
                    label="Special Requests"
                    value={requestFormData.specialRequests}
                    onChange={handleRequestInputChange}
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="e.g., Child seat needed, elderly passenger assistance, large luggage..."
                  />
                </Grid>
              </Grid>

              <Box className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <Button 
                  type="button"
                  onClick={() => setShowCreateDialog(false)}
                  className="text-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={createRequestLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {createRequestLoading && <CircularProgress size={20} className="mr-2" />}
                  Create Request
                </Button>
              </Box>
            </form>
          ) : (
            <form onSubmit={handleCreateOffer}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Airport</InputLabel>
                    <Select
                      name="airport"
                      value={offerFormData.airport}
                      label="Airport"
                    >
                      <MenuItem value="AKL">Auckland (AKL)</MenuItem>
                      <MenuItem value="WLG">Wellington (WLG)</MenuItem>
                      <MenuItem value="CHC">Christchurch (CHC)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    name="vehicleType"
                    label="Vehicle Type"
                    value={offerFormData.vehicleType}
                    fullWidth
                    required
                    placeholder="e.g., Sedan, SUV, Van"
                  />
                </Grid>
              </Grid>

              <Box className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <Button 
                  type="button"
                  onClick={() => setShowCreateDialog(false)}
                  className="text-gray-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  className="bg-green-600 hover:bg-green-700"
                >
                  Create Offer
                </Button>
              </Box>
            </form>
          )}
        </DialogContent>
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

export default Pickup;