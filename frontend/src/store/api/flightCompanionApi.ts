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
    createFlightCompanionOffer: builder.mutation<FlightCompanionOffer, Partial<FlightCompanionOffer>>({
      query: (data) => ({
        url: '/flightcompanion/offers',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['FlightCompanionOffer'],
    }),
    getFlightCompanionRequest: builder.query<FlightCompanionRequest, number>({
      query: (id) => `/flightcompanion/requests/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'FlightCompanionRequest', id }],
    }),
    updateFlightCompanionRequest: builder.mutation<FlightCompanionRequest, { id: number; data: CreateFlightCompanionRequestData }>({
      query: ({ id, data }) => ({
        url: `/flightcompanion/requests/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['FlightCompanionRequest'],
    }),
    deleteFlightCompanionRequest: builder.mutation<void, number>({
      query: (id) => ({
        url: `/flightcompanion/requests/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FlightCompanionRequest'],
    }),
    updateFlightCompanionOffer: builder.mutation<FlightCompanionOffer, { id: number; data: Partial<FlightCompanionOffer> }>({
      query: ({ id, data }) => ({
        url: `/flightcompanion/offers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['FlightCompanionOffer'],
    }),
    deleteFlightCompanionOffer: builder.mutation<void, number>({
      query: (id) => ({
        url: `/flightcompanion/offers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FlightCompanionOffer'],
    }),
    updatePickupRequest: builder.mutation<any, { id: number; data: Partial<any> }>({
      query: ({ id, data }) => ({
        url: `/pickup/requests/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['PickupRequest'],
    }),
    deletePickupRequest: builder.mutation<void, number>({
      query: (id) => ({
        url: `/pickup/requests/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PickupRequest'],
    }),
    updatePickupOffer: builder.mutation<any, { id: number; data: Partial<any> }>({
      query: ({ id, data }) => ({
        url: `/pickup/offers/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['PickupOffer'],
    }),
    deletePickupOffer: builder.mutation<void, number>({
      query: (id) => ({
        url: `/pickup/offers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PickupOffer'],
    }),
  }),
});

export const {
  useGetFlightCompanionRequestsQuery,
  useGetFlightCompanionOffersQuery,
  useCreateFlightCompanionRequestMutation,
  useCreateFlightCompanionOfferMutation,
  useGetFlightCompanionRequestQuery,
  useDeleteFlightCompanionRequestMutation,
  useUpdateFlightCompanionRequestMutation,
  useUpdateFlightCompanionOfferMutation,
  useDeleteFlightCompanionOfferMutation,
  useUpdatePickupRequestMutation,
  useDeletePickupRequestMutation,
  useUpdatePickupOfferMutation,
  useDeletePickupOfferMutation,
} = flightCompanionApi;