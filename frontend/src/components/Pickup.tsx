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
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
  CircularProgress,
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
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addNotification } from '../store/slices/uiSlice';
import { selectIsAuthenticated } from '../store/slices/authSelectors';
import {
  useGetPickupRequestsQuery,
  useGetPickupOffersQuery,
  useCreatePickupRequestMutation,
  type PickupRequest,
  type PickupOffer,
  type CreatePickupRequestData
} from '../store/api/pickupApi';
import PickupRequestForm from './forms/PickupRequestForm';
import PickupOfferForm from './forms/PickupOfferForm';  

// TypeScript Interfaces  
interface PickupProps {}

// Main Component
const Pickup: React.FC<PickupProps> = () => {
  // Redux State
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

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

  // Helper Functions
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info'): void => {
    setSnackbar({ open: true, message, severity });
  };

  const closeSnackbar = (): void => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // Event Handlers
  const handleTabChange = (event: React.SyntheticEvent, newValue: number): void => {
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
      
      dispatch(addNotification({
        message: 'Pickup request created successfully!',
        type: 'success',
      }));
      
      setShowCreateDialog(false);
      
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

  const handleOfferSubmit = async (data: any): Promise<void> => {
    try {
      // TODO: Implement offer creation using RTK Query when pickupApi is extended with offer creation
      console.log('Offer data:', data);
      
      dispatch(addNotification({
        message: 'Pickup offer created successfully!',
        type: 'success',
      }));
      
      setShowCreateDialog(false);
      showSnackbar('Offer created successfully! (Mock implementation)', 'success');
      
    } catch (error) {
      console.error('Error creating offer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error creating offer';
      showSnackbar(errorMessage, 'error');
      
      dispatch(addNotification({
        message: 'Failed to create pickup offer',
        type: 'error',
      }));
    }
  };

  const handleContactDriver = (offer: PickupOffer): void => {
    showSnackbar(`Contacting driver for ${offer.vehicleType}`, 'info');
  };

  const handleContactPassenger = (request: PickupRequest): void => {
    showSnackbar(`Contacting passenger for ${request.flightNumber}`, 'info');
  };

  const handleOpenCreateDialog = (type: 'request' | 'offer'): void => {
    if (!isAuthenticated) {
      setSnackbar({
        open: true,
        message: 'Please log in to use this feature.',
        severity: 'warning',
      });
      return;
    }
    setFormType(type);
    setShowCreateDialog(true);
  };

  // Render Functions
  const renderRequestCard = (request: PickupRequest): JSX.Element => (
    <Card key={request.id} className="mb-4 hover:shadow-lg transition-shadow duration-200">
      <CardContent>
        <Box className="flex justify-between items-start mb-4">
          <Box className="flex items-center space-x-3">
            <FlightIcon className="text-[#0B3866]" />
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
          className="text-[#0B3866] border-[#0B3866] hover:bg-[#0B3866]/10"
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
            <TaxiIcon className="text-[#168046]" />
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

      <CardActions className="justify-between bg-gray-50 mt-auto">
        <Chip 
          label="Available"
          color="success"
          variant="outlined"
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={<ContactIcon />}
          onClick={() => handleContactDriver(offer)}
          className="text-[#168046] border-[#168046]  hover:bg-[#168046]/10"
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
          onClick={() => handleOpenCreateDialog(activeTab === 0 ? 'request' : 'offer')}
          className={`px-8 py-3  my-3 text-white ${
            activeTab === 0 
              ? 'bg-[#0B3866] hover:bg-[#0B3866]/90' 
              : 'bg-[#168046] hover:bg-[#168046]/90'
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
        <DialogTitle>
            {formType === 'request' ? 'Request Airport Pickup' : 'Offer Pickup Service'}
        </DialogTitle>

        <DialogContent className="p-6">
          {formType === 'request' ? (
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