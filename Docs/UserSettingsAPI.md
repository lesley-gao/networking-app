# User Settings API Documentation

## Overview

The User Settings API provides comprehensive endpoints for managing user preferences and settings in WingCompanion. This includes theme preferences, notification settings, privacy controls, and custom user preferences.

## API Endpoints

### 1. Get User Settings

**GET** `/api/usersettings/{userId}`

Retrieves the user settings for a specific user. If no settings exist, default settings are automatically created.

**Parameters:**
- `userId` (int): The unique identifier of the user

**Response:**
```json
{
  "id": 1,
  "userId": 123,
  "theme": "dark",
  "language": "en",
  "timeZone": "Pacific/Auckland",
  "currency": "NZD",
  "emailNotifications": true,
  "pushNotifications": false,
  "smsNotifications": true,
  "emailMatches": true,
  "emailMessages": false,
  "emailReminders": true,
  "emailMarketing": false,
  "showOnlineStatus": false,
  "showLastSeen": true,
  "allowDirectMessages": true,
  "defaultSearchRadius": "25km",
  "autoAcceptMatches": false,
  "requirePhoneVerification": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "customPreferences": {
    "darkModeStartTime": "18:00",
    "darkModeEndTime": "06:00"
  }
}
```

### 2. Update User Settings

**PUT** `/api/usersettings/{userId}`

Updates user settings with provided values. Only non-null fields in the request body will be updated.

**Parameters:**
- `userId` (int): The unique identifier of the user

**Request Body:**
```json
{
  "theme": "light",
  "language": "zh",
  "timeZone": "Pacific/Auckland",
  "currency": "NZD",
  "emailNotifications": false,
  "pushNotifications": true,
  "smsNotifications": false,
  "emailMatches": true,
  "emailMessages": true,
  "emailReminders": false,
  "emailMarketing": false,
  "showOnlineStatus": true,
  "showLastSeen": false,
  "allowDirectMessages": true,
  "defaultSearchRadius": "100km",
  "autoAcceptMatches": false,
  "requirePhoneVerification": true,
  "customPreferences": {
    "newSetting": "newValue"
  }
}
```

**Response:** Returns the updated UserSettingsDto

### 3. Update Theme Preference

**PUT** `/api/usersettings/{userId}/theme`

Updates only the theme preference for a user.

**Parameters:**
- `userId` (int): The unique identifier of the user

**Request Body:**
```json
{
  "theme": "system"
}
```

**Supported Themes:**
- `light` - Light theme
- `dark` - Dark theme
- `system` - Follow system preference

**Response:**
```json
{
  "theme": "system"
}
```

### 4. Update Language Preference

**PUT** `/api/usersettings/{userId}/language`

Updates only the language preference for a user.

**Parameters:**
- `userId` (int): The unique identifier of the user

**Request Body:**
```json
{
  "language": "zh"
}
```

**Supported Languages:**
- `en` - English
- `zh` - Chinese

**Response:**
```json
{
  "language": "zh"
}
```

### 5. Update Notification Preferences

**PUT** `/api/usersettings/{userId}/notifications`

Updates notification preferences for a user.

**Parameters:**
- `userId` (int): The unique identifier of the user

**Request Body:**
```json
{
  "emailNotifications": true,
  "pushNotifications": false,
  "smsNotifications": true,
  "emailMatches": true,
  "emailMessages": false,
  "emailReminders": true,
  "emailMarketing": false
}
```

**Notification Types:**
- `emailNotifications` - General email notifications
- `pushNotifications` - Mobile/browser push notifications
- `smsNotifications` - SMS text message notifications
- `emailMatches` - Email notifications for flight/pickup matches
- `emailMessages` - Email notifications for direct messages
- `emailReminders` - Email notifications for service reminders
- `emailMarketing` - Marketing and promotional emails

**Response:**
```json
{
  "message": "Notification preferences updated successfully"
}
```

### 6. Update Privacy Preferences

**PUT** `/api/usersettings/{userId}/privacy`

Updates privacy and visibility preferences for a user.

**Parameters:**
- `userId` (int): The unique identifier of the user

**Request Body:**
```json
{
  "showOnlineStatus": true,
  "showLastSeen": false,
  "allowDirectMessages": true,
  "requirePhoneVerification": false
}
```

**Privacy Settings:**
- `showOnlineStatus` - Display online/offline status to other users
- `showLastSeen` - Display last active time to other users
- `allowDirectMessages` - Allow other users to send direct messages
- `requirePhoneVerification` - Require phone verification for matches

**Response:**
```json
{
  "message": "Privacy preferences updated successfully"
}
```

### 7. Reset User Settings

**POST** `/api/usersettings/{userId}/reset`

Resets user settings to default values.

**Parameters:**
- `userId` (int): The unique identifier of the user

**Default Values:**
- Theme: "light"
- Language: "en"
- TimeZone: "Pacific/Auckland"
- Currency: "NZD"
- Email notifications: enabled
- Push notifications: enabled
- SMS notifications: disabled
- Marketing emails: disabled
- All privacy settings: enabled (except phone verification requirement)
- Search radius: "50km"
- Auto-accept matches: disabled
- Custom preferences: cleared

**Response:** Returns the reset UserSettingsDto

## Data Models

### UserSettingsDto

Complete user settings data transfer object.

```typescript
interface UserSettingsDto {
  id: number;
  userId: number;
  theme: string;
  language: string;
  timeZone: string;
  currency: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  emailMatches: boolean;
  emailMessages: boolean;
  emailReminders: boolean;
  emailMarketing: boolean;
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  allowDirectMessages: boolean;
  defaultSearchRadius: string;
  autoAcceptMatches: boolean;
  requirePhoneVerification: boolean;
  createdAt: string;
  updatedAt: string;
  customPreferences?: { [key: string]: any };
}
```

### UpdateUserSettingsDto

Partial update object where all fields are optional.

```typescript
interface UpdateUserSettingsDto {
  theme?: string;
  language?: string;
  timeZone?: string;
  currency?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  smsNotifications?: boolean;
  emailMatches?: boolean;
  emailMessages?: boolean;
  emailReminders?: boolean;
  emailMarketing?: boolean;
  showOnlineStatus?: boolean;
  showLastSeen?: boolean;
  allowDirectMessages?: boolean;
  defaultSearchRadius?: string;
  autoAcceptMatches?: boolean;
  requirePhoneVerification?: boolean;
  customPreferences?: { [key: string]: any };
}
```

### ThemePreferenceDto

```typescript
interface ThemePreferenceDto {
  theme: string; // "light" | "dark" | "system"
}
```

### LanguagePreferenceDto

```typescript
interface LanguagePreferenceDto {
  language: string; // "en" | "zh"
}
```

### NotificationPreferencesDto

```typescript
interface NotificationPreferencesDto {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  emailMatches: boolean;
  emailMessages: boolean;
  emailReminders: boolean;
  emailMarketing: boolean;
}
```

### PrivacyPreferencesDto

```typescript
interface PrivacyPreferencesDto {
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  allowDirectMessages: boolean;
  requirePhoneVerification: boolean;
}
```

## Error Responses

### 404 Not Found
```json
{
  "message": "User settings not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

## Custom Preferences

The `customPreferences` field allows for extensible user settings that can be added without database schema changes. This field stores a JSON object with key-value pairs for any additional user preferences.

**Example Custom Preferences:**
```json
{
  "darkModeStartTime": "18:00",
  "darkModeEndTime": "06:00",
  "autoRefreshInterval": 30,
  "preferredMapView": "satellite",
  "notificationSound": "default",
  "compactView": true
}
```

## Usage Examples

### Frontend Integration

```typescript
// Get user settings
const getUserSettings = async (userId: number) => {
  const response = await fetch(`/api/usersettings/${userId}`);
  return await response.json();
};

// Update theme
const updateTheme = async (userId: number, theme: string) => {
  const response = await fetch(`/api/usersettings/${userId}/theme`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme })
  });
  return await response.json();
};

// Update notification preferences
const updateNotifications = async (userId: number, preferences: NotificationPreferencesDto) => {
  const response = await fetch(`/api/usersettings/${userId}/notifications`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences)
  });
  return await response.json();
};
```

### API Testing with curl

```bash
# Get user settings
curl -X GET "https://api.example.com/api/usersettings/123"

# Update theme to dark
curl -X PUT "https://api.example.com/api/usersettings/123/theme" \
  -H "Content-Type: application/json" \
  -d '{"theme": "dark"}'

# Update notification preferences
curl -X PUT "https://api.example.com/api/usersettings/123/notifications" \
  -H "Content-Type: application/json" \
  -d '{
    "emailNotifications": true,
    "pushNotifications": false,
    "emailMarketing": false
  }'

# Reset to defaults
curl -X POST "https://api.example.com/api/usersettings/123/reset"
```

## Database Schema

The UserSettings table includes the following columns:

```sql
CREATE TABLE UserSettings (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    UserId INTEGER NOT NULL,
    Theme VARCHAR(20) NOT NULL DEFAULT 'light',
    Language VARCHAR(10) NOT NULL DEFAULT 'en',
    TimeZone VARCHAR(50) NOT NULL DEFAULT 'Pacific/Auckland',
    Currency VARCHAR(10) NOT NULL DEFAULT 'NZD',
    EmailNotifications BOOLEAN NOT NULL DEFAULT 1,
    PushNotifications BOOLEAN NOT NULL DEFAULT 1,
    SmsNotifications BOOLEAN NOT NULL DEFAULT 0,
    EmailMatches BOOLEAN NOT NULL DEFAULT 1,
    EmailMessages BOOLEAN NOT NULL DEFAULT 1,
    EmailReminders BOOLEAN NOT NULL DEFAULT 1,
    EmailMarketing BOOLEAN NOT NULL DEFAULT 0,
    ShowOnlineStatus BOOLEAN NOT NULL DEFAULT 1,
    ShowLastSeen BOOLEAN NOT NULL DEFAULT 1,
    AllowDirectMessages BOOLEAN NOT NULL DEFAULT 1,
    DefaultSearchRadius VARCHAR(20) NOT NULL DEFAULT '50km',
    AutoAcceptMatches BOOLEAN NOT NULL DEFAULT 0,
    RequirePhoneVerification BOOLEAN NOT NULL DEFAULT 1,
    CreatedAt DATETIME NOT NULL DEFAULT (datetime('now')),
    UpdatedAt DATETIME NOT NULL DEFAULT (datetime('now')),
    CustomPreferences VARCHAR(1000) NULL,
    FOREIGN KEY (UserId) REFERENCES Users(Id),
    UNIQUE INDEX IX_UserSettings_UserId (UserId)
);
```

## Security Considerations

1. **User Authorization**: Ensure users can only access and modify their own settings
2. **Input Validation**: All inputs are validated according to their data annotations
3. **Rate Limiting**: Consider implementing rate limiting for frequent updates
4. **Audit Logging**: Track changes to user settings for security and compliance
5. **Data Encryption**: Sensitive custom preferences should be encrypted if needed

## Performance Considerations

1. **Caching**: Consider caching frequently accessed user settings
2. **Database Indexing**: User ID index ensures fast lookups
3. **Partial Updates**: Only modified fields are updated to minimize database operations
4. **Connection Pooling**: Use Entity Framework connection pooling for optimal performance

## Future Enhancements

1. **Settings History**: Track changes to user settings over time
2. **Settings Import/Export**: Allow users to backup and restore settings
3. **Team/Organization Settings**: Shared settings for organizational accounts
4. **Settings Validation Rules**: Business rules for certain setting combinations
5. **Real-time Updates**: WebSocket notifications for settings changes across devices
