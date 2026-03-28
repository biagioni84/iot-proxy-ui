import * as React from 'react';

import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import AppNavbar from './components/AppNavbar';
import Header from './components/Header';
import SummaryPage from './components/SummaryPage';
import SideMenu from './components/SideMenu';
import AppTheme from '../shared-theme/AppTheme';
import { LoginContext } from '../App';
import { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchUserSummary } from '../api';
// import { useQuery } from '@tanstack/react-query';
import {
  useQuery,
} from '@tanstack/react-query'
import {
  dataGridCustomizations,
} from './theme/customizations';

const xThemeComponents = {
  ...dataGridCustomizations,
};

export default function Dashboard(props) {
  const location = useLocation();
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useContext(LoginContext);

  useEffect(() => {
    const isLoggedIn = !!localStorage.getItem('access');
    setLoggedIn(isLoggedIn);
  }, []);

  useEffect(() => {
    if (!loggedIn) {
      navigate(
        location?.state?.previousUrl
          ? location.state.previousUrl
          : '/login'
      );
    }
  }, [loggedIn, navigate]);

    const { isPending, error, data } = useQuery({
        queryKey: ['userData'],
        queryFn: () => fetchUserSummary(setLoggedIn),
    })

    if (isPending) {
        return 'Loading...';
    }

    if (error) {
        return 'Error loading data. Please try again later.';
    }
  return (
    <AppTheme {...props} themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex' }}>
        <SideMenu username={data?.username} />
        <AppNavbar />
        {/* Main content */}
        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : alpha(theme.palette.background.default, 1),
            overflow: 'auto',
          })}
        >
          <Stack
            spacing={2}
            sx={{
              alignItems: 'center',
              mx: 3,
              pb: 5,
              mt: { xs: 8, md: 0 },
            }}
          >
            <Header />
            <SummaryPage summary={data}/>
          </Stack>
        </Box>
      </Box>
    </AppTheme>
  );
}
