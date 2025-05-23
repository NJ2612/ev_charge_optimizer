import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Box,
  Button,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { getStation, getStationPredictions } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const StationDetails = () => {
  const { id } = useParams();
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [optimizationSettings, setOptimizationSettings] = useState({
    maxPower: 50,
    priority: 'balanced',
    timeWindow: 24,
  });

  const chartData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    datasets: [
      {
        label: 'Power Usage',
        data: [30, 45, 60, 75, 50, 40],
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
        text: 'Power Usage Over Time',
      },
    },
  };

  useEffect(() => {
    // TODO: Fetch station data from backend
    const fetchStationData = async () => {
      try {
        // Simulated data for now
        const mockStation = {
          id: id,
          name: `Charging Station ${id}`,
          location: 'London, UK',
          status: 'available',
          currentPower: 30,
          maxPower: 100,
          efficiency: 0.95,
        };
        setStation(mockStation);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch station data');
        setLoading(false);
      }
    };

    fetchStationData();
  }, [id]);

  const handleOptimizationSubmit = () => {
    // TODO: Implement optimization submission
    console.log('Optimization settings:', optimizationSettings);
  };

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!station) return <Typography>Station not found</Typography>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom>
              {station.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Location: {station.location}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Station Status
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                Current Status: {station.status}
              </Typography>
              <Typography variant="body1">
                Current Power: {station.currentPower} kW
              </Typography>
              <Typography variant="body1">
                Efficiency: {(station.efficiency * 100).toFixed(1)}%
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Optimization Settings
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>Maximum Power (kW)</Typography>
              <Slider
                value={optimizationSettings.maxPower}
                onChange={(e, newValue) =>
                  setOptimizationSettings({ ...optimizationSettings, maxPower: newValue })
                }
                min={0}
                max={100}
                valueLabelDisplay="auto"
              />

              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Optimization Priority</InputLabel>
                <Select
                  value={optimizationSettings.priority}
                  label="Optimization Priority"
                  onChange={(e) =>
                    setOptimizationSettings({
                      ...optimizationSettings,
                      priority: e.target.value,
                    })
                  }
                >
                  <MenuItem value="balanced">Balanced</MenuItem>
                  <MenuItem value="speed">Charging Speed</MenuItem>
                  <MenuItem value="cost">Cost Efficiency</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Time Window (hours)</InputLabel>
                <Select
                  value={optimizationSettings.timeWindow}
                  label="Time Window (hours)"
                  onChange={(e) =>
                    setOptimizationSettings({
                      ...optimizationSettings,
                      timeWindow: e.target.value,
                    })
                  }
                >
                  <MenuItem value={12}>12 hours</MenuItem>
                  <MenuItem value={24}>24 hours</MenuItem>
                  <MenuItem value={48}>48 hours</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2 }}
                onClick={handleOptimizationSubmit}
              >
                Apply Optimization
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Power Usage History
            </Typography>
            <Line data={chartData} options={chartOptions} />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StationDetails; 