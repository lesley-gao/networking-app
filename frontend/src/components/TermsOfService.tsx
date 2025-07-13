// frontend/src/components/TermsOfService.tsx
import React, { useState, useRef } from 'react';
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Article as ArticleIcon,
  Person as PersonIcon,
  Payment as PaymentIcon,
  Security as SecurityIcon,
  Gavel as GavelIcon,
  ContactSupport as ContactIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

export const TermsOfService: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  
  const currentDate = new Date().toLocaleDateString(i18n.language === 'zh' ? 'zh-CN' : 'en-NZ');
  const effectiveDate = new Date('2025-01-01').toLocaleDateString(i18n.language === 'zh' ? 'zh-CN' : 'en-NZ');

  // Create refs for each section to enable scrolling
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  const sections = [
    { id: 'acceptance', icon: <CheckIcon />, color: 'success' as const },
    { id: 'description', icon: <ArticleIcon />, color: 'primary' as const },
    { id: 'eligibility', icon: <PersonIcon />, color: 'info' as const },
    { id: 'accounts', icon: <SecurityIcon />, color: 'warning' as const },
    { id: 'conduct', icon: <WarningIcon />, color: 'error' as const },
    { id: 'payments', icon: <PaymentIcon />, color: 'success' as const },
    { id: 'liability', icon: <GavelIcon />, color: 'secondary' as const },
    { id: 'privacy', icon: <SecurityIcon />, color: 'primary' as const },
    { id: 'termination', icon: <ScheduleIcon />, color: 'warning' as const },
    { id: 'changes', icon: <ArticleIcon />, color: 'info' as const },
    { id: 'governing', icon: <GavelIcon />, color: 'secondary' as const },
    { id: 'contact', icon: <ContactIcon />, color: 'primary' as const },
  ];

  const handleSectionToggle = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const scrollToSection = (sectionId: string) => {
    const element = sectionRefs.current[sectionId];
    if (element) {
      // Calculate the offset to account for header padding
      const headerOffset = 100; // Adjust this value based on your header height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleTableOfContentsClick = (sectionId: string) => {
    const isCurrentlyExpanded = expandedSections.includes(sectionId);
    
    // Expand the section if it's not already expanded
    if (!isCurrentlyExpanded) {
      setExpandedSections(prev => [...prev, sectionId]);
      // Scroll to the section after a brief delay to allow expansion animation
      setTimeout(() => {
        scrollToSection(sectionId);
      }, 150);
    } else {
      // If already expanded, scroll immediately
      scrollToSection(sectionId);
    }
  };

  const expandAllSections = () => {
    setExpandedSections(sections.map(s => s.id));
  };

  const collapseAllSections = () => {
    setExpandedSections([]);
  };

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
            {t('terms.title')}
          </Typography>
          <Typography 
            variant="h6" 
            className="text-gray-600 dark:text-gray-300 mb-4 max-w-3xl mx-auto"
          >
            {t('terms.subtitle')}
          </Typography>
          <Box className="flex flex-wrap justify-center gap-3 mb-4">
            <Chip 
              label={t('terms.lastUpdated', { date: currentDate })}
              variant="outlined"
              className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700"
            />
            <Chip 
              label={t('terms.effectiveDate', { date: effectiveDate })}
              variant="outlined"
              className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700"
            />
          </Box>
        </Box>

        <Divider className="mb-8" />

        {/* Control Buttons */}
        <Box className="flex justify-center gap-4 mb-6">
          <Button
            variant="outlined"
            onClick={expandAllSections}
            className="border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            {i18n.language === 'zh' ? '展开全部' : 'Expand All'}
          </Button>
          <Button
            variant="outlined"
            onClick={collapseAllSections}
            className="border-gray-500 text-gray-600 hover:bg-gray-50"
          >
            {i18n.language === 'zh' ? '收起全部' : 'Collapse All'}
          </Button>
        </Box>

        {/* Table of Contents */}
        <Paper 
          elevation={1} 
          className="p-6 mb-8 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg"
        >
          <Typography 
            variant="h5" 
            className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center"
          >
            <ArticleIcon className="mr-2" />
            {i18n.language === 'zh' ? '目录' : 'Table of Contents'}
          </Typography>
          <List className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sections.map((section, index) => (
              <ListItem
                key={section.id}
                button
                onClick={() => handleTableOfContentsClick(section.id)}
                className={`hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer ${
                  expandedSections.includes(section.id) 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' 
                    : ''
                }`}
              >
                <ListItemIcon className="min-w-0 mr-3">
                  <Box className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                    expandedSections.includes(section.id)
                      ? 'bg-blue-500 text-white'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  }`}>
                    {index + 1}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={t(`terms.sections.${section.id}.title`)}
                  className={`${
                    expandedSections.includes(section.id)
                      ? 'text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Terms Sections */}
        <Box className="space-y-4">
          {sections.map((section, index) => (
            <Accordion
              key={section.id}
              ref={(el) => (sectionRefs.current[section.id] = el)}
              expanded={expandedSections.includes(section.id)}
              onChange={() => handleSectionToggle(section.id)}
              className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm"
              elevation={0}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon className="text-gray-600 dark:text-gray-300" />}
                className="hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <Box className="flex items-center">
                  <Box className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-lg font-bold mr-4">
                    {index + 1}
                  </Box>
                  <Typography 
                    variant="h6" 
                    className="font-semibold text-gray-900 dark:text-white"
                  >
                    {t(`terms.sections.${section.id}.title`)}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails className="border-t border-gray-200 dark:border-gray-600">
                <Box className="p-4">
                  {section.id === 'eligibility' ? (
                    <Box className="space-y-4">
                      <TermsItem
                        content={t('terms.sections.eligibility.age')}
                        icon={<PersonIcon className="text-blue-600 dark:text-blue-400" />}
                      />
                      <TermsItem
                        content={t('terms.sections.eligibility.verification')}
                        icon={<SecurityIcon className="text-green-600 dark:text-green-400" />}
                      />
                      <TermsItem
                        content={t('terms.sections.eligibility.compliance')}
                        icon={<GavelIcon className="text-orange-600 dark:text-orange-400" />}
                      />
                    </Box>
                  ) : section.id === 'accounts' ? (
                    <Box className="space-y-4">
                      <TermsItem
                        content={t('terms.sections.accounts.responsibility')}
                        icon={<SecurityIcon className="text-red-600 dark:text-red-400" />}
                      />
                      <TermsItem
                        content={t('terms.sections.accounts.accuracy')}
                        icon={<CheckIcon className="text-green-600 dark:text-green-400" />}
                      />
                      <TermsItem
                        content={t('terms.sections.accounts.notification')}
                        icon={<WarningIcon className="text-orange-600 dark:text-orange-400" />}
                      />
                    </Box>
                  ) : section.id === 'conduct' ? (
                    <Box className="space-y-4">
                      <TermsItem
                        content={t('terms.sections.conduct.illegal')}
                        icon={<WarningIcon className="text-red-600 dark:text-red-400" />}
                      />
                      <TermsItem
                        content={t('terms.sections.conduct.fraud')}
                        icon={<WarningIcon className="text-red-600 dark:text-red-400" />}
                      />
                      <TermsItem
                        content={t('terms.sections.conduct.interference')}
                        icon={<WarningIcon className="text-red-600 dark:text-red-400" />}
                      />
                      <TermsItem
                        content={t('terms.sections.conduct.violation')}
                        icon={<WarningIcon className="text-red-600 dark:text-red-400" />}
                      />
                    </Box>
                  ) : section.id === 'payments' ? (
                    <Box className="space-y-4">
                      <TermsItem
                        content={t('terms.sections.payments.escrow')}
                        icon={<SecurityIcon className="text-green-600 dark:text-green-400" />}
                      />
                      <TermsItem
                        content={t('terms.sections.payments.fees')}
                        icon={<PaymentIcon className="text-blue-600 dark:text-blue-400" />}
                      />
                      <TermsItem
                        content={t('terms.sections.payments.disputes')}
                        icon={<GavelIcon className="text-orange-600 dark:text-orange-400" />}
                      />
                      <TermsItem
                        content={t('terms.sections.payments.refunds')}
                        icon={<CheckIcon className="text-purple-600 dark:text-purple-400" />}
                      />
                    </Box>
                  ) : section.id === 'liability' ? (
                    <Box className="space-y-4">
                      <TermsItem
                        content={t('terms.sections.liability.disclaimer')}
                        icon={<WarningIcon className="text-red-600 dark:text-red-400" />}
                      />
                      <TermsItem
                        content={t('terms.sections.liability.maximum')}
                        icon={<PaymentIcon className="text-blue-600 dark:text-blue-400" />}
                      />
                      <TermsItem
                        content={t('terms.sections.liability.exclusion')}
                        icon={<GavelIcon className="text-gray-600 dark:text-gray-400" />}
                      />
                    </Box>
                  ) : section.id === 'termination' ? (
                    <Box className="space-y-4">
                      <TermsItem
                        content={t('terms.sections.termination.user')}
                        icon={<PersonIcon className="text-blue-600 dark:text-blue-400" />}
                      />
                      <TermsItem
                        content={t('terms.sections.termination.platform')}
                        icon={<WarningIcon className="text-orange-600 dark:text-orange-400" />}
                      />
                      <TermsItem
                        content={t('terms.sections.termination.effect')}
                        icon={<ScheduleIcon className="text-red-600 dark:text-red-400" />}
                      />
                    </Box>
                  ) : (
                    <Typography 
                      variant="body1" 
                      className="text-gray-700 dark:text-gray-300 leading-relaxed"
                    >
                      {t(`terms.sections.${section.id}.content`)}
                    </Typography>
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
            className="p-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-blue-200 dark:border-blue-700 rounded-lg"
          >
            <Typography 
              variant="h6" 
              className="font-semibold text-gray-900 dark:text-white mb-2"
            >
              📄 {i18n.language === 'zh' ? '重要法律文件' : 'Important Legal Document'}
            </Typography>
            <Typography 
              variant="body2" 
              className="text-gray-600 dark:text-gray-300 mb-4"
            >
              {i18n.language === 'zh' 
                ? '这些条款构成您与NetworkingApp之间具有法律约束力的协议。使用我们的服务即表示您同意这些条款。'
                : 'These terms constitute a legally binding agreement between you and NetworkingApp. By using our services, you agree to these terms.'
              }
            </Typography>
            <Button
              variant="contained"
              color="primary"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              {i18n.language === 'zh' ? '返回顶部' : 'Back to Top'}
            </Button>
          </Paper>
        </Box>
      </Paper>
    </Container>
  );
};

// Helper component for individual terms items
interface TermsItemProps {
  content: string;
  icon: React.ReactElement;
}

const TermsItem: React.FC<TermsItemProps> = ({ content, icon }) => {
  return (
    <Box className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
      <Box className="flex-shrink-0 mt-1">
        {icon}
      </Box>
      <Typography 
        variant="body2" 
        className="text-gray-700 dark:text-gray-300 leading-relaxed"
      >
        {content}
      </Typography>
    </Box>
  );
};

export default TermsOfService;
