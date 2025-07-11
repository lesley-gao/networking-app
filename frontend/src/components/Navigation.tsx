// ClientApp/src/components/Navigation.tsx
import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  useMediaQuery,
  useTheme as useMuiTheme,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Flight as FlightIcon,
  LocalTaxi as PickupIcon,
  Person as ProfileIcon,
  Gavel as LegalIcon,
  Description as GuidelinesIcon,
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';

interface NavigationItem {
  textKey: string; // Changed from text to textKey for translation
  path: string;
  icon: React.ReactElement;
}

interface NavigationProps {
  title?: string;
  items?: NavigationItem[];
  onMenuToggle?: (open: boolean) => void;
  mobileOpen?: boolean;
}

const getDefaultItems = (): NavigationItem[] => [
  { textKey: 'flightCompanion', path: '/flight-companion', icon: <FlightIcon /> },
  { textKey: 'pickupService', path: '/pickup', icon: <PickupIcon /> },
  { textKey: 'profile', path: '/profile', icon: <ProfileIcon /> },
  { textKey: 'communityGuidelines', path: '/community-guidelines', icon: <GuidelinesIcon /> },
  { textKey: 'termsOfService', path: '/terms-of-service', icon: <LegalIcon /> },
];

export const Navigation: React.FC<NavigationProps> = ({
  title = "NetworkingApp",
  items,
  onMenuToggle,
  mobileOpen = false,
}) => {
  const { t } = useTranslation();
  const theme = useMuiTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  
  // Use default items if none provided
  const navigationItems = items || getDefaultItems();

  const handleDrawerToggle = () => {
    onMenuToggle?.(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ width: 250 }} onClick={handleDrawerToggle}>
      <List>
        {navigationItems.map((item: NavigationItem) => (
          <ListItem
            key={item.textKey}
            component={Link}
            to={item.path}
            className={`transition-colors duration-200 ${
              location.pathname === item.path 
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            sx={{
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <ListItemIcon
              className={
                location.pathname === item.path 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-300'
              }
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={t(item.textKey)}
              className="font-medium"
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar 
        position="static" 
        className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700"
        elevation={0}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              className="mr-2 text-gray-800 dark:text-white"
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography
            variant="h6"
            component={Link}
            to="/"
            className="flex-grow font-bold text-gray-800 dark:text-white no-underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {title}
          </Typography>

          {!isMobile && (
            <Box className="flex items-center space-x-1">
              {navigationItems.map((item: NavigationItem) => (
                <Box
                  key={item.textKey}
                  component={Link}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 no-underline ${
                    location.pathname === item.path
                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {item.icon}
                  <span>{t(item.textKey)}</span>
                </Box>
              ))}
            </Box>
          )}

          <ThemeToggle />
          <LanguageSwitcher />
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        className="md:hidden"
        sx={{
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: 250,
            backgroundColor: 'background.default',
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navigation;