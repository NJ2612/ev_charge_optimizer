import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography, Box } from '@mui/material';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [stations, setStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const mapContainerStyle = {
    width: '100%',
    height: '400px',
  };

  const center = {
    lat: 51.5074,
    lng: -0.1278,
  };

  const chartData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    datasets: [
      {
        label: 'Energy Demand',
        data: [65, 59, 80, 81, 56, 55],
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
        text: 'Daily Energy Demand',
      },
    },
  };

  useEffect(() => {
    // TODO: Fetch stations data from backend
    const fetchStations = async () => {
      try {
        // Simulated data for now
        const mockStations = [
          { id: 1, name: 'Station 1', lat: 51.5074, lng: -0.1278, status: 'available' },
          { id: 2, name: 'Station 2', lat: 51.5174, lng: -0.1378, status: 'charging' },
        ];
        setStations(mockStations);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch stations');
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom>
              Charging Stations Map
            </Typography>
            <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={12}
              >
                {stations.map((station) => (
                  <Marker
                    key={station.id}
                    position={{ lat: station.lat, lng: station.lng }}
                    onClick={() => setSelectedStation(station)}
                  />
                ))}
                {selectedStation && (
                  <InfoWindow
                    position={{ lat: selectedStation.lat, lng: selectedStation.lng }}
                    onCloseClick={() => setSelectedStation(null)}
                  >
                    <Box>
                      <Typography variant="subtitle1">{selectedStation.name}</Typography>
                      <Typography variant="body2">
                        Status: {selectedStation.status}
                      </Typography>
                    </Box>
                  </InfoWindow>
                )}
              </GoogleMap>
            </LoadScript>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Energy Demand Forecast
            </Typography>
            <Line data={chartData} options={chartOptions} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              System Status
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                Total Stations: {stations.length}
              </Typography>
              <Typography variant="body1">
                Available Stations: {stations.filter(s => s.status === 'available').length}
              </Typography>
              <Typography variant="body1">
                Charging Stations: {stations.filter(s => s.status === 'charging').length}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard; 