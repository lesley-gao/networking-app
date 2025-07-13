import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Box,
  Button,
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';
import { Menu as MenuIcon } from '@mui/icons-material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { clearAuth } from '../store/slices/authSlice';
import { ThemeToggle } from './ThemeToggle';

export const NavMenu: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useMuiTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Use Redux selector for authentication and user
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const user = useAppSelector((state) => state.auth.user);

  const authenticatedItems = [
    { text: 'Home', path: '/' },
    { text: 'Flight Companion', path: '/flight-companion' },
    { text: 'Airport Pickup', path: '/pickup' },
    { text: 'Profile', path: '/profile' },
    { text: 'Fetch Data', path: '/fetch-data' },
  ];

  const unauthenticatedItems = [
    { text: 'Home', path: '/' },
    { text: 'Flight Companion', path: '/flight-companion' },
    { text: 'Airport Pickup', path: '/pickup' },
  ];

  const navigationItems = isAuthenticated ? authenticatedItems : unauthenticatedItems;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    dispatch(clearAuth());
    navigate('/');
  };

  const drawer = (
    <Box sx={{ width: 250 }} onClick={handleDrawerToggle}>
      <List>
        {navigationItems.map((item) => (
          <ListItem
            key={item.text}
            component={Link}
            to={item.path}
            sx={{
              color: 'inherit',
              textDecoration: 'none',
              backgroundColor: location.pathname === item.path ? 'action.selected' : 'transparent',
            }}
          >
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
        {!isAuthenticated && (
          <>
            <ListItem component={Link} to="/login" sx={{ color: 'inherit', textDecoration: 'none' }}>
              <ListItemText primary="Login" />
            </ListItem>
            <ListItem component={Link} to="/register" sx={{ color: 'inherit', textDecoration: 'none' }}>
              <ListItemText primary="Register" />
            </ListItem>
          </>
        )}
        {isAuthenticated && (
          <ListItem button onClick={handleLogout}>
            <ListItemText primary="Logout" />
          </ListItem>
        )}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="static" className="mb-4 dark:bg-gray-800">
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: 'inherit',
              fontWeight: 'bold',
            }}
          >
            NetworkingApp
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {navigationItems.map((item) => (
                <Typography
                  key={item.text}
                  component={Link}
                  to={item.path}
                  sx={{
                    color: 'inherit',
                    textDecoration: 'none',
                    padding: '8px 16px',
                    borderRadius: 1,
                    backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  {item.text}
                </Typography>
              ))}
              
              {!isAuthenticated ? (
                <>
                  <Button
                    component={Link}
                    to="/login"
                    color="inherit"
                    sx={{ ml: 1 }}
                  >
                    Login
                  </Button>
                  <Button
                    component={Link}
                    to="/register"
                    color="inherit"
                    variant="outlined"
                    sx={{ ml: 1 }}
                  >
                    Register
                  </Button>
                </>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'inherit' }}>
                    Welcome, {user?.firstName || 'User'}
                  </Typography>
                  <Button
                    color="inherit"
                    onClick={handleLogout}
                    sx={{ ml: 1 }}
                  >
                    Logout
                  </Button>
                </Box>
              )}
            </Box>
          )}

          <ThemeToggle />
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};