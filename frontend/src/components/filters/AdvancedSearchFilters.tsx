// ClientApp/src/components/filters/AdvancedSearchFilters.tsx
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  FormControlLabel,
  Checkbox,
  Button,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

// TypeScript Interfaces
export interface FlightCompanionFilters {
  departureAirport: string;
  arrivalAirport: string;
  dateRange: {
    start: string;
    end: string;
  };
  priceRange: {
    min: number;
    max: number;
  };
  travelerAge?: string;
  services?: string[];
  languages?: string[];
  searchText?: string;
}

export interface PickupFilters {
  airport: string;
  dateRange: {
    start: string;
    end: string;
  };
  priceRange: {
    min: number;
    max: number;
  };
  passengerCount?: number;
  vehicleType?: string;
  hasLuggage?: boolean;
  serviceArea?: string;
  searchText?: string;
}

interface FlightCompanionFilterProps {
  filters: FlightCompanionFilters;
  onFiltersChange: (filters: Partial<FlightCompanionFilters>) => void;
  onClearFilters: () => void;
}

interface PickupFilterProps {
  filters: PickupFilters;
  onFiltersChange: (filters: Partial<PickupFilters>) => void;
  onClearFilters: () => void;
}

// Constants
const airportOptions = [
  { value: '', label: 'All Airports' },
  { value: 'AKL', label: 'Auckland (AKL)' },
  { value: 'WLG', label: 'Wellington (WLG)' },
  { value: 'CHC', label: 'Christchurch (CHC)' },
  { value: 'ZQN', label: 'Queenstown (ZQN)' },
  { value: 'PVG', label: 'Shanghai (PVG)' },
  { value: 'PEK', label: 'Beijing (PEK)' },
  { value: 'CAN', label: 'Guangzhou (CAN)' },
  { value: 'CTU', label: 'Chengdu (CTU)' },
];

const travelerAgeOptions = [
  { value: '', label: 'All Ages' },
  { value: 'Young Adult', label: 'Young Adult (18-30)' },
  { value: 'Adult', label: 'Adult (31-60)' },
  { value: 'Elderly', label: 'Elderly (60+)' },
];

const serviceOptions = [
  'Language Translation',
  'Wheelchair Assistance',
  'Medication Reminders',
  'Navigation Help',
  'Cultural Guidance',
  'Emergency Support',
];

const languageOptions = [
  'English',
  'Chinese (Mandarin)',
  'Chinese (Cantonese)',
  'Spanish',
  'French',
  'German',
  'Japanese',
  'Korean',
];

const vehicleTypeOptions = [
  { value: '', label: 'All Vehicle Types' },
  { value: 'Sedan', label: 'Sedan' },
  { value: 'SUV', label: 'SUV' },
  { value: 'Van', label: 'Van' },
  { value: 'Minibus', label: 'Minibus' },
  { value: 'Luxury', label: 'Luxury Vehicle' },
];

export const FlightCompanionAdvancedFilters: React.FC<FlightCompanionFilterProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const handleInputChange = (field: keyof FlightCompanionFilters, value: any) => {
    onFiltersChange({ [field]: value });
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    onFiltersChange({
      dateRange: { ...filters.dateRange, [field]: value }
    });
  };

  const handlePriceRangeChange = (event: Event, newValue: number | number[]) => {
    const [min, max] = newValue as number[];
    onFiltersChange({
      priceRange: { min, max }
    });
  };

  const handleServiceToggle = (service: string) => {
    const currentServices = filters.services || [];
    const updatedServices = currentServices.includes(service)
      ? currentServices.filter(s => s !== service)
      : [...currentServices, service];
    onFiltersChange({ services: updatedServices });
  };

  const handleLanguageToggle = (language: string) => {
    const currentLanguages = filters.languages || [];
    const updatedLanguages = currentLanguages.includes(language)
      ? currentLanguages.filter(l => l !== language)
      : [...currentLanguages, language];
    onFiltersChange({ languages: updatedLanguages });
  };

  return (
    <Paper className="p-4 mb-6" elevation={2}>
      <Box className="flex items-center justify-between mb-4">
        <Box className="flex items-center space-x-2">
          <FilterIcon className="text-blue-600" />
          <Typography variant="h6" className="font-semibold text-gray-900">
            Advanced Search & Filters
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ClearIcon />}
          onClick={onClearFilters}
          size="small"
          className="text-gray-600 border-gray-300"
        >
          Clear All
        </Button>
      </Box>

      {/* Search Text */}
      <Box className="mb-4">
        <TextField
          fullWidth
          placeholder="Search by flight number, airline, or notes..."
          value={filters.searchText || ''}
          onChange={(e) => handleInputChange('searchText', e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon className="text-gray-400 mr-2" />,
          }}
          className="bg-white"
        />
      </Box>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" className="font-medium">
            Flight & Location Filters
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Departure Airport</InputLabel>
                <Select
                  value={filters.departureAirport}
                  onChange={(e) => handleInputChange('departureAirport', e.target.value)}
                  label="Departure Airport"
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
              <FormControl fullWidth>
                <InputLabel>Arrival Airport</InputLabel>
                <Select
                  value={filters.arrivalAirport}
                  onChange={(e) => handleInputChange('arrivalAirport', e.target.value)}
                  label="Arrival Airport"
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
                fullWidth
                label="From Date"
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="To Date"
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" className="font-medium">
            Traveler & Service Filters
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Traveler Age Group</InputLabel>
                <Select
                  value={filters.travelerAge || ''}
                  onChange={(e) => handleInputChange('travelerAge', e.target.value)}
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
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="subtitle2" className="mb-2">
                  Price Range: ${filters.priceRange.min} - ${filters.priceRange.max}
                </Typography>
                <Slider
                  value={[filters.priceRange.min, filters.priceRange.max]}
                  onChange={handlePriceRangeChange}
                  valueLabelDisplay="auto"
                  min={0}
                  max={500}
                  step={10}
                  marks={[
                    { value: 0, label: '$0' },
                    { value: 250, label: '$250' },
                    { value: 500, label: '$500' },
                  ]}
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" className="mb-2">
                Required Services
              </Typography>
              <Box className="flex flex-wrap gap-2">
                {serviceOptions.map((service) => (
                  <Chip
                    key={service}
                    label={service}
                    onClick={() => handleServiceToggle(service)}
                    color={filters.services?.includes(service) ? 'primary' : 'default'}
                    variant={filters.services?.includes(service) ? 'filled' : 'outlined'}
                    className="cursor-pointer"
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" className="mb-2">
                Languages Spoken
              </Typography>
              <Box className="flex flex-wrap gap-2">
                {languageOptions.map((language) => (
                  <Chip
                    key={language}
                    label={language}
                    onClick={() => handleLanguageToggle(language)}
                    color={filters.languages?.includes(language) ? 'secondary' : 'default'}
                    variant={filters.languages?.includes(language) ? 'filled' : 'outlined'}
                    className="cursor-pointer"
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

export const PickupAdvancedFilters: React.FC<PickupFilterProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const handleInputChange = (field: keyof PickupFilters, value: any) => {
    onFiltersChange({ [field]: value });
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    onFiltersChange({
      dateRange: { ...filters.dateRange, [field]: value }
    });
  };

  const handlePriceRangeChange = (event: Event, newValue: number | number[]) => {
    const [min, max] = newValue as number[];
    onFiltersChange({
      priceRange: { min, max }
    });
  };

  return (
    <Paper className="p-4 mb-6" elevation={2}>
      <Box className="flex items-center justify-between mb-4">
        <Box className="flex items-center space-x-2">
          <FilterIcon className="text-green-600" />
          <Typography variant="h6" className="font-semibold text-gray-900">
            Advanced Search & Filters
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ClearIcon />}
          onClick={onClearFilters}
          size="small"
          className="text-gray-600 border-gray-300"
        >
          Clear All
        </Button>
      </Box>

      {/* Search Text */}
      <Box className="mb-4">
        <TextField
          fullWidth
          placeholder="Search by flight number, destination, or service area..."
          value={filters.searchText || ''}
          onChange={(e) => handleInputChange('searchText', e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon className="text-gray-400 mr-2" />,
          }}
          className="bg-white"
        />
      </Box>

      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" className="font-medium">
            Trip & Location Filters
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Airport</InputLabel>
                <Select
                  value={filters.airport}
                  onChange={(e) => handleInputChange('airport', e.target.value)}
                  label="Airport"
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
                fullWidth
                placeholder="e.g., Auckland CBD, North Shore, Manukau"
                label="Service Area"
                value={filters.serviceArea || ''}
                onChange={(e) => handleInputChange('serviceArea', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="From Date"
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="To Date"
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1" className="font-medium">
            Vehicle & Service Filters
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Vehicle Type</InputLabel>
                <Select
                  value={filters.vehicleType || ''}
                  onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                  label="Vehicle Type"
                >
                  {vehicleTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Passenger Count</InputLabel>
                <Select
                  value={filters.passengerCount || ''}
                  onChange={(e) => handleInputChange('passengerCount', e.target.value)}
                  label="Passenger Count"
                >
                  <MenuItem value="">Any</MenuItem>
                  <MenuItem value={1}>1 person</MenuItem>
                  <MenuItem value={2}>2 people</MenuItem>
                  <MenuItem value={3}>3 people</MenuItem>
                  <MenuItem value={4}>4+ people</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="subtitle2" className="mb-2">
                  Price Range: ${filters.priceRange.min} - ${filters.priceRange.max}
                </Typography>
                <Slider
                  value={[filters.priceRange.min, filters.priceRange.max]}
                  onChange={handlePriceRangeChange}
                  valueLabelDisplay="auto"
                  min={0}
                  max={200}
                  step={5}
                  marks={[
                    { value: 0, label: '$0' },
                    { value: 100, label: '$100' },
                    { value: 200, label: '$200' },
                  ]}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.hasLuggage || false}
                    onChange={(e) => handleInputChange('hasLuggage', e.target.checked)}
                  />
                }
                label="Luggage Handling Required"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};