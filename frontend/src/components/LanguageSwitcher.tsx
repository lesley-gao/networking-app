import React from 'react';
import { useTranslation } from 'react-i18next';
import { MenuItem, Select, Box, SelectChangeEvent } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'zh', label: '中文' },
];

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.split('-')[0] || 'en';

  const handleChange = (event: SelectChangeEvent) => {
    i18n.changeLanguage(event.target.value as string);
  };

  return (
    <Box display="flex" alignItems="center" ml={2}>
      <LanguageIcon className="mr-1 text-[#020F6F]" />
      <Select
        value={currentLang}
        onChange={handleChange}
        variant="standard"
        disableUnderline
        sx={{ minWidth: 80, color: 'text.primary' }}
      >
        {languages.map((lang) => (
          <MenuItem key={lang.code} value={lang.code}>
            {lang.label}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
};

export default LanguageSwitcher;
