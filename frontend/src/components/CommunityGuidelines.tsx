// frontend/src/components/CommunityGuidelines.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Typography,
  Paper,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  People as PeopleIcon,
  HandshakeOutlined as HandshakeIcon,
  Report as ReportIcon,
  Gavel as GavelIcon,
} from '@mui/icons-material';

export const CommunityGuidelines: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentDate = new Date().toLocaleDateString(i18n.language === 'zh' ? 'zh-CN' : 'en-NZ');

  const sections = [
    {
      id: 'overview',
      icon: <PeopleIcon className="text-blue-600 dark:text-blue-400" />,
      color: 'primary' as const,
    },
    {
      id: 'conduct',
      icon: <HandshakeIcon className="text-green-600 dark:text-green-400" />,
      color: 'success' as const,
    },
    {
      id: 'safety',
      icon: <SecurityIcon className="text-orange-600 dark:text-orange-400" />,
      color: 'warning' as const,
    },
    {
      id: 'services',
      icon: <GavelIcon className="text-purple-600 dark:text-purple-400" />,
      color: 'secondary' as const,
    },
    {
      id: 'reporting',
      icon: <ReportIcon className="text-red-600 dark:text-red-400" />,
      color: 'error' as const,
    },
  ];

  return (
    <Container maxWidth="lg" className="py-8">
      <Paper 
        elevation={2} 
        className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
      >
        {/* Header */}
        <Box className="text-center mb-8">
          <Typography 
            variant="h3" 
            component="h1" 
            className="font-bold text-gray-900 dark:text-white mb-4"
            gutterBottom
          >
            {t('guidelines.title')}
          </Typography>
          <Typography 
            variant="h6" 
            className="text-gray-600 dark:text-gray-300 mb-4 max-w-3xl mx-auto"
          >
            {t('guidelines.subtitle')}
          </Typography>
          <Chip 
            label={t('guidelines.lastUpdated', { date: currentDate })}
            variant="outlined"
            className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
          />
        </Box>

        <Divider className="mb-8" />

        {/* Overview Section */}
        <Box className="mb-8">
          <Box className="flex items-center mb-4">
            <PeopleIcon className="text-blue-600 dark:text-blue-400 mr-3" fontSize="large" />
            <Typography 
              variant="h4" 
              component="h2" 
              className="font-semibold text-gray-900 dark:text-white"
            >
              {t('guidelines.sections.overview.title')}
            </Typography>
          </Box>
          <Paper 
            elevation={1} 
            className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg"
          >
            <Typography 
              variant="body1" 
              className="text-gray-700 dark:text-gray-300 leading-relaxed"
            >
              {t('guidelines.sections.overview.content')}
            </Typography>
          </Paper>
        </Box>

        {/* Accordion Sections */}
        <Box className="space-y-4">
          {sections.slice(1).map((section) => (
            <Accordion
              key={section.id}
              className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm"
              elevation={0}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon className="text-gray-600 dark:text-gray-300" />}
                className="hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <Box className="flex items-center">
                  {section.icon}
                  <Typography 
                    variant="h5" 
                    className="ml-3 font-semibold text-gray-900 dark:text-white"
                  >
                    {t(`guidelines.sections.${section.id}.title`)}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600">
                <Box className="space-y-6">
                  {section.id === 'conduct' && (
                    <>
                      <GuidelineItem
                        title={t('guidelines.sections.conduct.respect.title')}
                        content={t('guidelines.sections.conduct.respect.content')}
                        color="primary"
                      />
                      <GuidelineItem
                        title={t('guidelines.sections.conduct.discrimination.title')}
                        content={t('guidelines.sections.conduct.discrimination.content')}
                        color="error"
                      />
                      <GuidelineItem
                        title={t('guidelines.sections.conduct.harassment.title')}
                        content={t('guidelines.sections.conduct.harassment.content')}
                        color="warning"
                      />
                    </>
                  )}
                  {section.id === 'safety' && (
                    <>
                      <GuidelineItem
                        title={t('guidelines.sections.safety.verification.title')}
                        content={t('guidelines.sections.safety.verification.content')}
                        color="success"
                      />
                      <GuidelineItem
                        title={t('guidelines.sections.safety.meetings.title')}
                        content={t('guidelines.sections.safety.meetings.content')}
                        color="warning"
                      />
                      <GuidelineItem
                        title={t('guidelines.sections.safety.personal.title')}
                        content={t('guidelines.sections.safety.personal.content')}
                        color="error"
                      />
                    </>
                  )}
                  {section.id === 'services' && (
                    <>
                      <GuidelineItem
                        title={t('guidelines.sections.services.reliability.title')}
                        content={t('guidelines.sections.services.reliability.content')}
                        color="primary"
                      />
                      <GuidelineItem
                        title={t('guidelines.sections.services.payment.title')}
                        content={t('guidelines.sections.services.payment.content')}
                        color="success"
                      />
                      <GuidelineItem
                        title={t('guidelines.sections.services.quality.title')}
                        content={t('guidelines.sections.services.quality.content')}
                        color="secondary"
                      />
                    </>
                  )}
                  {section.id === 'reporting' && (
                    <>
                      <GuidelineItem
                        title={t('guidelines.sections.reporting.violations.title')}
                        content={t('guidelines.sections.reporting.violations.content')}
                        color="error"
                      />
                      <GuidelineItem
                        title={t('guidelines.sections.reporting.consequences.title')}
                        content={t('guidelines.sections.reporting.consequences.content')}
                        color="warning"
                      />
                      <GuidelineItem
                        title={t('guidelines.sections.reporting.appeals.title')}
                        content={t('guidelines.sections.reporting.appeals.content')}
                        color="info"
                      />
                    </>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        {/* Footer */}
        <Box className="mt-12 text-center">
          <Paper 
            elevation={1} 
            className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-lg"
          >
            <Typography 
              variant="h6" 
              className="font-semibold text-gray-900 dark:text-white mb-2"
            >
              💙 {i18n.language === 'zh' ? '让我们共同建设一个更好的社区' : 'Let\'s Build a Better Community Together'}
            </Typography>
            <Typography 
              variant="body2" 
              className="text-gray-600 dark:text-gray-300"
            >
              {i18n.language === 'zh' 
                ? '遵守这些指南有助于创造一个所有人都能安全、舒适地连接和互助的环境。'
                : 'Following these guidelines helps create an environment where everyone can connect and help each other safely and comfortably.'
              }
            </Typography>
          </Paper>
        </Box>
      </Paper>
    </Container>
  );
};

// Helper component for individual guideline items
interface GuidelineItemProps {
  title: string;
  content: string;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

const GuidelineItem: React.FC<GuidelineItemProps> = ({ title, content, color }) => {
  const colorClasses = {
    primary: 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10',
    secondary: 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/10',
    success: 'border-l-green-500 bg-green-50 dark:bg-green-900/10',
    error: 'border-l-red-500 bg-red-50 dark:bg-red-900/10',
    warning: 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10',
    info: 'border-l-cyan-500 bg-cyan-50 dark:bg-cyan-900/10',
  };

  return (
    <Box className={`border-l-4 ${colorClasses[color]} p-4 rounded-r-lg`}>
      <Typography 
        variant="h6" 
        className="font-semibold text-gray-900 dark:text-white mb-2"
      >
        {title}
      </Typography>
      <Typography 
        variant="body2" 
        className="text-gray-700 dark:text-gray-300 leading-relaxed"
      >
        {content}
      </Typography>
    </Box>
  );
};

export default CommunityGuidelines;
