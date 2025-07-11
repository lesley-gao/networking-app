// ClientApp/src/utils/filterUtils.ts
import type { FlightCompanionRequest, FlightCompanionOffer } from '../store/api/flightCompanionApi';
import type { PickupRequest, PickupOffer } from '../store/api/pickupApi';
import type { FlightCompanionFilters, PickupFilters } from '../components/filters/AdvancedSearchFilters';

export const filterFlightCompanionRequests = (
  requests: FlightCompanionRequest[],
  filters: FlightCompanionFilters
): FlightCompanionRequest[] => {
  return requests.filter((request) => {
    // Search text filter
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      const matchesSearch = 
        request.flightNumber.toLowerCase().includes(searchLower) ||
        request.airline.toLowerCase().includes(searchLower) ||
        (request.additionalNotes && request.additionalNotes.toLowerCase().includes(searchLower)) ||
        (request.specialNeeds && request.specialNeeds.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }

    // Airport filters
    if (filters.departureAirport && request.departureAirport !== filters.departureAirport) {
      return false;
    }
    if (filters.arrivalAirport && request.arrivalAirport !== filters.arrivalAirport) {
      return false;
    }

    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      const requestDate = new Date(request.flightDate);
      
      if (filters.dateRange.start) {
        const startDate = new Date(filters.dateRange.start);
        if (requestDate < startDate) return false;
      }
      
      if (filters.dateRange.end) {
        const endDate = new Date(filters.dateRange.end);
        if (requestDate > endDate) return false;
      }
    }

    // Price range filter
    if (request.offeredAmount < filters.priceRange.min || 
        request.offeredAmount > filters.priceRange.max) {
      return false;
    }

    // Traveler age filter
    if (filters.travelerAge && request.travelerAge !== filters.travelerAge) {
      return false;
    }

    return true;
  });
};

export const filterFlightCompanionOffers = (
  offers: FlightCompanionOffer[],
  filters: FlightCompanionFilters
): FlightCompanionOffer[] => {
  return offers.filter((offer) => {
    // Search text filter
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      const matchesSearch = 
        offer.flightNumber.toLowerCase().includes(searchLower) ||
        offer.airline.toLowerCase().includes(searchLower) ||
        (offer.availableServices && offer.availableServices.toLowerCase().includes(searchLower)) ||
        (offer.languages && offer.languages.toLowerCase().includes(searchLower)) ||
        (offer.additionalInfo && offer.additionalInfo.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }

    // Airport filters
    if (filters.departureAirport && offer.departureAirport !== filters.departureAirport) {
      return false;
    }
    if (filters.arrivalAirport && offer.arrivalAirport !== filters.arrivalAirport) {
      return false;
    }

    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      const offerDate = new Date(offer.flightDate);
      
      if (filters.dateRange.start) {
        const startDate = new Date(filters.dateRange.start);
        if (offerDate < startDate) return false;
      }
      
      if (filters.dateRange.end) {
        const endDate = new Date(filters.dateRange.end);
        if (offerDate > endDate) return false;
      }
    }

    // Price range filter
    if (offer.requestedAmount < filters.priceRange.min || 
        offer.requestedAmount > filters.priceRange.max) {
      return false;
    }

    // Services filter
    if (filters.services && filters.services.length > 0) {
      const offerServices = offer.availableServices?.toLowerCase() || '';
      const hasRequiredService = filters.services.some(service => 
        offerServices.includes(service.toLowerCase())
      );
      if (!hasRequiredService) return false;
    }

    // Languages filter
    if (filters.languages && filters.languages.length > 0) {
      const offerLanguages = offer.languages?.toLowerCase() || '';
      const hasRequiredLanguage = filters.languages.some(language => 
        offerLanguages.includes(language.toLowerCase())
      );
      if (!hasRequiredLanguage) return false;
    }

    return true;
  });
};

export const filterPickupRequests = (
  requests: PickupRequest[],
  filters: PickupFilters
): PickupRequest[] => {
  return requests.filter((request) => {
    // Search text filter
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      const matchesSearch = 
        request.flightNumber.toLowerCase().includes(searchLower) ||
        request.destinationAddress.toLowerCase().includes(searchLower) ||
        (request.specialRequests && request.specialRequests.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }

    // Airport filter
    if (filters.airport && request.airport !== filters.airport) {
      return false;
    }

    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      const requestDate = new Date(request.arrivalDate);
      
      if (filters.dateRange.start) {
        const startDate = new Date(filters.dateRange.start);
        if (requestDate < startDate) return false;
      }
      
      if (filters.dateRange.end) {
        const endDate = new Date(filters.dateRange.end);
        if (requestDate > endDate) return false;
      }
    }

    // Price range filter
    if (request.offeredAmount < filters.priceRange.min || 
        request.offeredAmount > filters.priceRange.max) {
      return false;
    }

    // Passenger count filter
    if (filters.passengerCount && request.passengerCount !== filters.passengerCount) {
      return false;
    }

    // Luggage filter
    if (filters.hasLuggage !== undefined && request.hasLuggage !== filters.hasLuggage) {
      return false;
    }

    return true;
  });
};

export const filterPickupOffers = (
  offers: PickupOffer[],
  filters: PickupFilters
): PickupOffer[] => {
  return offers.filter((offer) => {
    // Search text filter
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      const matchesSearch = 
        offer.vehicleType.toLowerCase().includes(searchLower) ||
        offer.serviceArea.toLowerCase().includes(searchLower) ||
        (offer.additionalServices && offer.additionalServices.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) return false;
    }

    // Airport filter
    if (filters.airport && offer.airport !== filters.airport) {
      return false;
    }

    // Price range filter
    if (offer.baseRate < filters.priceRange.min || 
        offer.baseRate > filters.priceRange.max) {
      return false;
    }

    // Vehicle type filter
    if (filters.vehicleType && offer.vehicleType !== filters.vehicleType) {
      return false;
    }

    // Passenger count filter
    if (filters.passengerCount && offer.maxPassengers < filters.passengerCount) {
      return false;
    }

    // Service area filter
    if (filters.serviceArea) {
      const serviceAreaLower = filters.serviceArea.toLowerCase();
      const offerServiceArea = offer.serviceArea.toLowerCase();
      if (!offerServiceArea.includes(serviceAreaLower)) {
        return false;
      }
    }

    // Luggage filter
    if (filters.hasLuggage !== undefined && !offer.canHandleLuggage && filters.hasLuggage) {
      return false;
    }

    return true;
  });
};