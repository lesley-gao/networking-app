import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Link,
  IconButton,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Instagram as InstagramIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface FooterProps {
  companyName?: string;
}

export const Footer: React.FC<FooterProps> = ({
  companyName = "WingCompanion"
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      titleKey: 'services',
      links: [
        { textKey: 'flightCompanion', path: '/flight-companion' },
        { textKey: 'pickupService', path: '/pickup' },
      ]
    },
    {
      titleKey: 'support',
      links: [
        { textKey: 'helpCenter', path: '/help' },
        { textKey: 'contactUs', path: '/contact' },
        { textKey: 'faq', path: '/faq' }
      ]
    },
    {
      titleKey: 'legal',
      links: [
        { textKey: 'termsOfService', path: '/terms-of-service' },
        { textKey: 'privacyPolicy', path: '/privacy-policy' },
        { textKey: 'communityGuidelines', path: '/community-guidelines' },
        { textKey: 'cookiePolicy', path: '/cookie-policy' },
      ]
    }
  ];

  const socialLinks = [
    { icon: <FacebookIcon />, url: 'https://facebook.com', label: 'Facebook' },
    { icon: <TwitterIcon />, url: 'https://twitter.com', label: 'Twitter' },
    { icon: <InstagramIcon />, url: 'https://instagram.com', label: 'Instagram' },
    { icon: <LinkedInIcon />, url: 'https://linkedin.com', label: 'LinkedIn' },
  ];

  return (
    <Box 
      component="footer"
      className="border-t border-gray-200 mt-auto bg-[#CBDDDF]"
      sx={{ mt: 'auto', color: 'var(--color-primary)' }}
    >
      <Container maxWidth="lg">
        {/* Main Footer Content */}
        <Box sx={{ py: 6 }}>
          <Grid container spacing={4}>
            {/* Company Info */}
            <Grid item xs={12} md={3}>
              <Typography 
                variant="h6" 
                className="font-bold mb-4"
                sx={{ color: 'var(--color-primary)' }}
              >
                <Link
                  component={RouterLink}
                  to="/"
                  className="flex items-center no-underline"
                  style={{ color: 'var(--color-primary)' }}
                  sx={{ '&:hover': { color: '#061e4a' } }}
                >
                  <img
                    src="/images/logo.png"
                    alt="WingCompanion Logo"
                    style={{ height: 40, marginRight: 12, display: 'inline-block', verticalAlign: 'middle' }}
                  />
                  {companyName}
                </Link>
              </Typography>
              <Typography 
                variant="body2" 
                className="mb-4"
                sx={{ color: 'var(--color-primary)' }}
              >
                {t('footerDescription')}
              </Typography>
              
              {/* Contact Info */}
              <Box className="space-y-2">
                <Box className="flex items-center space-x-2">
                  <EmailIcon className="w-4 h-4" sx={{ color: 'var(--color-primary)' }} />
                  <Typography variant="body2" sx={{ color: 'var(--color-primary)' }}>
                    support@wingcompanion.com
                  </Typography>
                </Box>
                <Box className="flex items-center space-x-2">
                  <PhoneIcon className="w-4 h-4" sx={{ color: 'var(--color-primary)' }} />
                  <Typography variant="body2" sx={{ color: 'var(--color-primary)' }}>
                    +64 21 123 4567
                  </Typography>
                </Box>
                <Box className="flex items-center space-x-2">
                  <LocationIcon className="w-4 h-4" sx={{ color: 'var(--color-primary)' }} />
                  <Typography variant="body2" sx={{ color: 'var(--color-primary)' }}>
                    {t('locationNZ')}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            {/* Footer Links */}
            {footerLinks.map((section) => (
              <Grid item xs={12} md={3} key={section.titleKey}>
                <Typography variant="subtitle1" className="font-semibold mb-3" sx={{ color: 'var(--color-primary)' }}>
                  {t(section.titleKey)}
                </Typography>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.textKey}>
                      <Link
                        component={RouterLink}
                        to={link.path}
                        className="transition-colors"
                        style={{ color: 'var(--color-primary)' }}
                        sx={{ '&:hover': { color: '#061e4a' } }}
                      >
                        {t(link.textKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Grid>
            ))}
          </Grid>
        </Box>
        <Divider sx={{ borderColor: 'rgba(8,43,109,0.15)', mb: 2 }} />
        {/* Bottom Footer */}
        <Box className="flex flex-col sm:flex-row items-center justify-between py-4">
          <Typography variant="body2" className="mb-2 sm:mb-0" sx={{ color: 'var(--color-primary)' }}>
            © {currentYear} {companyName}. {t('allRightsReserved')}
          </Typography>
          <Box className="flex space-x-2">
            {socialLinks.map((social) => (
              <IconButton
                key={social.label}
                component="a"
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className=""
                sx={{ color: 'var(--color-primary)' }}
                aria-label={social.label}
              >
                {social.icon}
              </IconButton>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 