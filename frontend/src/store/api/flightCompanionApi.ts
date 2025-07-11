// ClientApp/src/store/api/flightCompanionApi.ts
import { baseApi } from './baseApi';

export interface FlightCompanionRequest {
  id: number;
  userId: number;
  flightNumber: string;
  airline: string;
  flightDate: string;
  departureAirport: string;
  arrivalAirport: string;
  travelerName?: string;
  travelerAge?: string;
  specialNeeds?: string;
  offeredAmount: number;
  additionalNotes?: string;
  isActive: boolean;
  isMatched: boolean;
  createdAt: string;
}

export interface FlightCompanionOffer {
  id: number;
  userId: number;
  flightNumber: string;
  airline: string;
  flightDate: string;
  departureAirport: string;
  arrivalAirport: string;
  availableServices?: string;
  languages?: string;
  requestedAmount: number;
  additionalInfo?: string;
  isAvailable: boolean;
  helpedCount: number;
  createdAt: string;
}

export interface CreateFlightCompanionRequestData {
  flightNumber: string;
  airline: string;
  flightDate: string;
  departureAirport: string;
  arrivalAirport: string;
  travelerName?: string;
  travelerAge?: string;
  specialNeeds?: string;
  offeredAmount: number;
  additionalNotes?: string;
}

export const flightCompanionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFlightCompanionRequests: builder.query<FlightCompanionRequest[], void>({
      query: () => '/flightcompanion/requests',
      providesTags: ['FlightCompanionRequest'],
    }),
    getFlightCompanionOffers: builder.query<FlightCompanionOffer[], void>({
      query: () => '/flightcompanion/offers',
      providesTags: ['FlightCompanionOffer'],
    }),
    createFlightCompanionRequest: builder.mutation<FlightCompanionRequest, CreateFlightCompanionRequestData>({
      query: (data) => ({
        url: '/flightcompanion/requests',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['FlightCompanionRequest'],
    }),
    getFlightCompanionRequest: builder.query<FlightCompanionRequest, number>({
      query: (id) => `/flightcompanion/requests/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'FlightCompanionRequest', id }],
    }),
    deleteFlightCompanionRequest: builder.mutation<void, number>({
      query: (id) => ({
        url: `/flightcompanion/requests/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FlightCompanionRequest'],
    }),
  }),
});

export const {
  useGetFlightCompanionRequestsQuery,
  useGetFlightCompanionOffersQuery,
  useCreateFlightCompanionRequestMutation,
  useGetFlightCompanionRequestQuery,
  useDeleteFlightCompanionRequestMutation,
} = flightCompanionApi;