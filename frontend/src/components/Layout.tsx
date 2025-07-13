import React from 'react';
import { Container, Box } from '@mui/material';
import { Navigation } from './Navigation';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navigation />
      <Container 
        maxWidth="lg" 
        sx={{ 
          flex: 1, 
          py: 3,
          px: { xs: 2, sm: 3 }
        }}
      >
        {children}
      </Container>
      <Footer />
    </Box>
  );
};