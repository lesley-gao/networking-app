// ClientApp/src/store/api/pickupApi.ts
import { baseApi } from './baseApi';

export interface PickupRequest {
  id: number;
  userId: number;
  flightNumber: string;
  arrivalDate: string;
  arrivalTime: string;
  airport: string;
  destinationAddress: string;
  passengerName?: string;
  passengerPhone?: string;
  passengerCount: number;
  hasLuggage: boolean;
  offeredAmount: number;
  specialRequests?: string;
  isActive: boolean;
  isMatched: boolean;
  createdAt: string;
}

export interface PickupOffer {
  id: number;
  userId: number;
  airport: string;
  vehicleType: string;
  maxPassengers: number;
  canHandleLuggage: boolean;
  serviceArea: string;
  baseRate: number;
  languages?: string;
  additionalServices?: string;
  isAvailable: boolean;
  rating: number;
  totalTrips: number;
  createdAt: string;
}

export interface CreatePickupRequestData {
  flightNumber: string;
  arrivalDate: string;
  arrivalTime: string;
  airport: string;
  destinationAddress: string;
  passengerName?: string;
  passengerPhone?: string;
  passengerCount: number;
  hasLuggage: boolean;
  offeredAmount: number;
  specialRequests?: string;
}

export const pickupApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPickupRequests: builder.query<PickupRequest[], void>({
      query: () => '/pickup/requests',
      providesTags: ['PickupRequest'],
    }),
    getPickupOffers: builder.query<PickupOffer[], void>({
      query: () => '/pickup/offers',
      providesTags: ['PickupOffer'],
    }),
    createPickupRequest: builder.mutation<PickupRequest, CreatePickupRequestData>({
      query: (data) => ({
        url: '/pickup/requests',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PickupRequest'],
    }),
    getPickupRequest: builder.query<PickupRequest, number>({
      query: (id) => `/pickup/requests/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'PickupRequest', id }],
    }),
    deletePickupRequest: builder.mutation<void, number>({
      query: (id) => ({
        url: `/pickup/requests/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PickupRequest'],
    }),
    createPickupOffer: builder.mutation<PickupOffer, Partial<PickupOffer>>({
      query: (data) => ({
        url: '/pickup/offers',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PickupOffer'],
    }),
  }),
});

export const {
  useGetPickupRequestsQuery,
  useGetPickupOffersQuery,
  useCreatePickupRequestMutation,
  useGetPickupRequestQuery,
  useDeletePickupRequestMutation,
  useCreatePickupOfferMutation,
} = pickupApi;