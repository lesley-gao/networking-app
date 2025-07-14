// ClientApp/src/components/Navigation.tsx
import React, { useState } from 'react';
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
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Flight as FlightIcon,
  LocalTaxi as PickupIcon,
  Person as ProfileIcon,
  Home as HomeIcon,
  Storage as DataIcon,
} from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { clearAuth } from '../store/slices/authSlice';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';

interface NavigationItem {
  textKey: string;
  path: string;
  icon: React.ReactElement;
  requiresAuth?: boolean;
}

interface NavigationProps {
  title?: string;
  items?: NavigationItem[];
}

const getDefaultItems = (): NavigationItem[] => [
  { textKey: 'home', path: '/', icon: <HomeIcon /> },
  { textKey: 'flightCompanion', path: '/flight-companion', icon: <FlightIcon /> },
  { textKey: 'pickupService', path: '/pickup', icon: <PickupIcon /> },
  { textKey: 'profile', path: '/profile', icon: <ProfileIcon />, requiresAuth: true },
  { textKey: 'fetchData', path: '/fetch-data', icon: <DataIcon />, requiresAuth: true },
];

export const Navigation: React.FC<NavigationProps> = ({
  title = "WingCompanion",
  items,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();
  const theme = useMuiTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Authentication state from Redux
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const user = useAppSelector((state) => state.auth.user);

  // Use default items if none provided, filtered by auth state
  const allNavigationItems = items || getDefaultItems();
  const navigationItems = allNavigationItems.filter(item => 
    !item.requiresAuth || isAuthenticated
  );

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    dispatch(clearAuth());
    navigate('/');
    setMobileOpen(false);
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
        
        {/* Mobile Auth Buttons */}
        {!isAuthenticated ? (
          <>
            <ListItem 
              component={Link} 
              to="/login" 
              sx={{ color: 'inherit', textDecoration: 'none' }}
            >
              <ListItemText primary={t('login')} />
            </ListItem>
            <ListItem 
              component={Link} 
              to="/register" 
              sx={{ color: 'inherit', textDecoration: 'none' }}
            >
              <ListItemText primary={t('register')} />
            </ListItem>
          </>
        ) : (
          <ListItem button onClick={handleLogout}>
            <ListItemText primary={t('logout')} />
          </ListItem>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar 
        position="static" 
        className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 mb-4"
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
              
              {/* Desktop Auth Section */}
              {!isAuthenticated ? (
                <Box className="flex items-center space-x-2 ml-4">
                  <Button
                    component={Link}
                    to="/login"
                    color="inherit"
                    className="text-gray-700 dark:text-gray-300"
                  >
                    {t('login')}
                  </Button>
                  <Button
                    component={Link}
                    to="/register"
                    color="inherit"
                    variant="outlined"
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                  >
                    {t('register')}
                  </Button>
                </Box>
              ) : (
                <Box className="flex items-center space-x-2 ml-4">
                  <Typography variant="body2" className="text-gray-700 dark:text-gray-300">
                    {t('welcome')}, {user?.firstName || t('user')}
                  </Typography>
                  <Button
                    color="inherit"
                    onClick={handleLogout}
                    className="text-gray-700 dark:text-gray-300"
                  >
                    {t('logout')}
                  </Button>
                </Box>
              )}
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