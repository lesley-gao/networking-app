// import React, { useState, useEffect } from 'react';
// import { Button, Alert, Box, Typography } from '@mui/material';
// import { AdminPanelSettings as AdminIcon } from '@mui/icons-material';
// import { useAppSelector } from '../store/hooks';
// import { selectAuthUser, selectIsAuthenticated } from '../store/slices/authSelectors';

// const AdminNavLink: React.FC = () => {
//   const user = useAppSelector(selectAuthUser);
//   const isAuthenticated = useAppSelector(selectIsAuthenticated);
//   const [isAdmin, setIsAdmin] = useState(false);
//   const [showDebug, setShowDebug] = useState(false);

//   useEffect(() => {
//     const checkAdminStatus = () => {
//       if (!isAuthenticated || !user) {
//         setIsAdmin(false);
//         return;
//       }

//       try {
//         const token = localStorage.getItem('token');
//         if (token) {
//           const payload = JSON.parse(atob(token.split('.')[1]));
//           console.log('JWT Payload:', payload); // Debug log
          
//           // Check for role in different possible claim names
//           const userRoles = payload?.role || 
//                            payload?.roles || 
//                            payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 
//                            [];
//           const hasAdminRole = Array.isArray(userRoles) 
//             ? userRoles.includes('Admin')
//             : userRoles === 'Admin';
          
//           setIsAdmin(hasAdminRole);
          
//           if (!hasAdminRole) {
//             console.log('User roles found:', userRoles);
//             console.log('Expected Admin role not found');
//           }
//         }
//       } catch (error) {
//         console.error('Error checking admin status:', error);
//         setIsAdmin(false);
//       }
//     };

//     checkAdminStatus();
//   }, [isAuthenticated, user]);

//   const handleAdminClick = () => {
//     window.location.href = '/admin';
//   };

//   const handleDebugClick = () => {
//     setShowDebug(!showDebug);
//   };

//   if (!isAuthenticated) {
//     return null;
//   }

//   return (
//     <Box sx={{ position: 'fixed', top: 20, right: 20, zIndex: 1000 }}>
//       {isAdmin ? (
//         <Button
//           variant="contained"
//           color="primary"
//           startIcon={<AdminIcon />}
//           onClick={handleAdminClick}
//           sx={{ mb: 1 }}
//         >
//           Admin Dashboard
//         </Button>
//       ) : (
//         <Alert severity="warning" sx={{ mb: 1 }}>
//           Not an admin user
//         </Alert>
//       )}
      
//       <Button
//         variant="outlined"
//         size="small"
//         onClick={handleDebugClick}
//         sx={{ width: '100%' }}
//       >
//         {showDebug ? 'Hide Debug' : 'Show Debug'}
//       </Button>
      
//       {showDebug && (
//         <Box sx={{ mt: 1, p: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1 }}>
//           <Typography variant="caption" display="block">
//             User ID: {user?.id}
//           </Typography>
//           <Typography variant="caption" display="block">
//             Email: {user?.email}
//           </Typography>
//           <Typography variant="caption" display="block">
//             Is Admin: {isAdmin ? 'Yes' : 'No'}
//           </Typography>
//           <Typography variant="caption" display="block">
//             Token: {localStorage.getItem('token') ? 'Present' : 'Missing'}
//           </Typography>
//         </Box>
//       )}
//     </Box>
//   );
// };

// export default AdminNavLink; 