import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Emergency {
  id: number;
  userId: number;
  userName: string;
  type: string;
  description: string;
  location?: string;
  createdAt: string;
  status: string;
  resolvedAt?: string;
  resolution?: string;
  emergencyContactNotified: boolean;
  adminNotified: boolean;
}

export interface CreateEmergencyData {
  type: string;
  description: string;
  location?: string;
  flightCompanionRequestId?: number;
  pickupRequestId?: number;
}

export interface SOSData {
  description?: string;
  location?: string;
}

export interface ResolveEmergencyData {
  emergencyId: number;
  resolution: string;
}

interface EmergencyState {
  emergencies: Emergency[];
  activeEmergency: Emergency | null;
  loading: boolean;
  error: string | null;
}

const initialState: EmergencyState = {
  emergencies: [],
  activeEmergency: null,
  loading: false,
  error: null,
};

// Async thunks
export const triggerEmergency = createAsyncThunk(
  'emergency/trigger',
  async (emergencyData: CreateEmergencyData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/emergency/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(emergencyData),
      });

      if (!response.ok) {
        const error = await response.text();
        return rejectWithValue(error);
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue('Failed to trigger emergency');
    }
  }
);

export const triggerSOS = createAsyncThunk(
  'emergency/triggerSOS',
  async (sosData: SOSData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/emergency/sos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(sosData),
      });

      if (!response.ok) {
        const error = await response.text();
        return rejectWithValue(error);
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue('Failed to trigger SOS');
    }
  }
);

export const cancelEmergency = createAsyncThunk(
  'emergency/cancel',
  async (emergencyId: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/emergency/${emergencyId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        return rejectWithValue(error);
      }

      return emergencyId;
    } catch (error) {
      return rejectWithValue('Failed to cancel emergency');
    }
  }
);

export const resolveEmergency = createAsyncThunk(
  'emergency/resolve',
  async (data: ResolveEmergencyData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/emergency/${data.emergencyId}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ resolution: data.resolution }),
      });

      if (!response.ok) {
        const error = await response.text();
        return rejectWithValue(error);
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue('Failed to resolve emergency');
    }
  }
);

export const fetchMyEmergencies = createAsyncThunk(
  'emergency/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/emergency/my-emergencies', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        return rejectWithValue(error);
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue('Failed to fetch emergencies');
    }
  }
);

export const fetchActiveEmergencies = createAsyncThunk(
  'emergency/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/emergency/active', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        return rejectWithValue(error);
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue('Failed to fetch active emergencies');
    }
  }
);

const emergencySlice = createSlice({
  name: 'emergency',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearActiveEmergency: (state) => {
      state.activeEmergency = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Trigger Emergency
      .addCase(triggerEmergency.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(triggerEmergency.fulfilled, (state, action: PayloadAction<Emergency>) => {
        state.loading = false;
        state.activeEmergency = action.payload;
        state.emergencies.unshift(action.payload);
      })
      .addCase(triggerEmergency.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Trigger SOS
      .addCase(triggerSOS.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(triggerSOS.fulfilled, (state, action: PayloadAction<Emergency>) => {
        state.loading = false;
        state.activeEmergency = action.payload;
        state.emergencies.unshift(action.payload);
      })
      .addCase(triggerSOS.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Cancel Emergency
      .addCase(cancelEmergency.fulfilled, (state, action: PayloadAction<number>) => {
        state.activeEmergency = null;
        const emergency = state.emergencies.find(e => e.id === action.payload);
        if (emergency) {
          emergency.status = 'Cancelled';
        }
      })
      
      // Resolve Emergency
      .addCase(resolveEmergency.fulfilled, (state, action: PayloadAction<Emergency>) => {
        const index = state.emergencies.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.emergencies[index] = action.payload;
        }
        if (state.activeEmergency?.id === action.payload.id) {
          state.activeEmergency = null;
        }
      })
      
      // Fetch My Emergencies
      .addCase(fetchMyEmergencies.fulfilled, (state, action: PayloadAction<Emergency[]>) => {
        state.emergencies = action.payload;
        state.activeEmergency = action.payload.find(e => e.status === 'Active') || null;
      })
      
      // Fetch Active Emergencies
      .addCase(fetchActiveEmergencies.fulfilled, (state, action: PayloadAction<Emergency[]>) => {
        state.emergencies = action.payload;
      });
  },
});

export const { clearError, clearActiveEmergency } = emergencySlice.actions;
export default emergencySlice.reducer;
