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
  companyName = "NetworkingApp"
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
        { textKey: 'faq', path: '/faq' },
        { textKey: 'safetyTips', path: '/safety' },
      ]
    },
    {
      titleKey: 'legal',
      links: [
        { textKey: 'termsOfService', path: '/terms-of-service' },
        { textKey: 'privacyPolicy', path: '/privacy-policy' },
        { textKey: 'communityGuidelines', path: '/community-guidelines' },
        { textKey: 'cookiePolicy', path: '/cookies' },
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
      className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-auto"
      sx={{ mt: 'auto' }}
    >
      <Container maxWidth="lg">
        {/* Main Footer Content */}
        <Box sx={{ py: 6 }}>
          <Grid container spacing={4}>
            {/* Company Info */}
            <Grid item xs={12} md={3}>
              <Typography 
                variant="h6" 
                className="font-bold text-gray-800 dark:text-white mb-4"
              >
                {companyName}
              </Typography>
              <Typography 
                variant="body2" 
                className="text-gray-600 dark:text-gray-300 mb-4"
              >
                {t('footerDescription')}
              </Typography>
              
              {/* Contact Info */}
              <Box className="space-y-2">
                <Box className="flex items-center space-x-2">
                  <EmailIcon className="text-gray-500 dark:text-gray-400 w-4 h-4" />
                  <Typography variant="body2" className="text-gray-600 dark:text-gray-300">
                    support@networkingapp.com
                  </Typography>
                </Box>
                <Box className="flex items-center space-x-2">
                  <PhoneIcon className="text-gray-500 dark:text-gray-400 w-4 h-4" />
                  <Typography variant="body2" className="text-gray-600 dark:text-gray-300">
                    +64 21 123 4567
                  </Typography>
                </Box>
                <Box className="flex items-center space-x-2">
                  <LocationIcon className="text-gray-500 dark:text-gray-400 w-4 h-4" />
                  <Typography variant="body2" className="text-gray-600 dark:text-gray-300">
                    {t('locationNZ')}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Footer Links */}
            {footerLinks.map((section) => (
              <Grid item xs={12} sm={4} md={3} key={section.titleKey}>
                <Typography 
                  variant="h6" 
                  className="font-semibold text-gray-800 dark:text-white mb-4"
                >
                  {t(section.titleKey)}
                </Typography>
                <Box className="space-y-2">
                  {section.links.map((link) => (
                    <Link
                      key={link.textKey}
                      component={RouterLink}
                      to={link.path}
                      className="block text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 no-underline"
                      variant="body2"
                    >
                      {t(link.textKey)}
                    </Link>
                  ))}
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider className="border-gray-200 dark:border-gray-700" />

        {/* Bottom Footer */}
        <Box 
          className="py-4 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0"
        >
          {/* Copyright */}
          <Typography 
            variant="body2" 
            className="text-gray-500 dark:text-gray-400 text-center sm:text-left"
          >
            © {currentYear} {companyName}. {t('allRightsReserved')}
          </Typography>

          {/* Social Media Links */}
          <Box className="flex space-x-2">
            {socialLinks.map((social) => (
              <IconButton
                key={social.label}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                size="small"
                aria-label={`Follow us on ${social.label}`}
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