import React from "react";
import { Container, Box } from "@mui/material";
import { Navigation } from "./Navigation";
import { Footer } from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navigation />
      <Container
        maxWidth="lg"
      >
        {children}
      </Container>
      <Footer />
    </Box>
  );
};
