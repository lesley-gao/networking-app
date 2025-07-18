import { useTheme } from './ThemeProvider';

const useIsDarkMode = () => {
  const { theme } = useTheme();
  return theme === 'dark';
};

export default useIsDarkMode; 