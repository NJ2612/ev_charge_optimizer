import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Box,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { Line } from 'react-chartjs-2';

const UserProfile = () => {
  const { user } = useAuth();
  const [chargingHistory, setChargingHistory] = useState([]);
  const [preferences, setPreferences] = useState({
    notifications: true,
    autoOptimization: true,
    ecoMode: false,
  });

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Monthly Charging Sessions',
        data: [12, 19, 15, 17, 22, 20],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Charging History',
      },
    },
  };

  useEffect(() => {
    // TODO: Fetch user's charging history from backend
    const mockHistory = [
      {
        id: 1,
        station: 'Station 1',
        date: '2024-03-15',
        duration: '45 min',
        energy: '25 kWh',
        cost: '$12.50',
      },
      {
        id: 2,
        station: 'Station 2',
        date: '2024-03-14',
        duration: '30 min',
        energy: '15 kWh',
        cost: '$7.50',
      },
    ];
    setChargingHistory(mockHistory);
  }, []);

  const handlePreferenceChange = (preference) => (event) => {
    setPreferences({
      ...preferences,
      [preference]: event.target.checked,
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                sx={{ width: 100, height: 100, mb: 2 }}
                src={user?.photoURL}
              />
              <Typography variant="h5" gutterBottom>
                {user?.displayName || 'User Name'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {user?.email}
              </Typography>
              <Button variant="outlined" sx={{ mt: 2 }}>
                Edit Profile
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Preferences
            </Typography>
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.notifications}
                    onChange={handlePreferenceChange('notifications')}
                  />
                }
                label="Enable Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.autoOptimization}
                    onChange={handlePreferenceChange('autoOptimization')}
                  />
                }
                label="Auto-Optimization"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.ecoMode}
                    onChange={handlePreferenceChange('ecoMode')}
                  />
                }
                label="Eco Mode"
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Charging Sessions
            </Typography>
            <List>
              {chargingHistory.map((session, index) => (
                <React.Fragment key={session.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>CS</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={session.station}
                      secondary={`${session.date} - ${session.duration}`}
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2">{session.energy}</Typography>
                      <Typography variant="body2" color="primary">
                        {session.cost}
                      </Typography>
                    </Box>
                  </ListItem>
                  {index < chargingHistory.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Charging Statistics
            </Typography>
            <Line data={chartData} options={chartOptions} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UserProfile; 