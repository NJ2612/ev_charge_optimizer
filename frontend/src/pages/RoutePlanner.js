import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Chip,
} from '@mui/material';
import { GoogleMap, LoadScript, Marker, Polyline } from '@react-google-maps/api';
import {
  findOptimalRoute,
  calculateRouteDistance,
  estimateChargingTime,
  calculateTotalEnergyConsumption,
  estimateTotalCost,
} from '../services/routingService';

const RoutePlanner = () => {
  const [stations, setStations] = useState([]);
  const [startStation, setStartStation] = useState(null);
  const [endStation, setEndStation] = useState(null);
  const [route, setRoute] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicleInfo, setVehicleInfo] = useState({
    batteryCapacity: 75, // kWh
    currentCharge: 20, // percentage
    vehicleEfficiency: 0.2, // kWh/km
  });

  const mapContainerStyle = {
    width: '100%',
    height: '400px',
  };

  const center = {
    lat: 51.5074,
    lng: -0.1278,
  };

  useEffect(() => {
    // TODO: Fetch stations data from backend
    const fetchStations = async () => {
      try {
        // Simulated data for now
        const mockStations = [
          { id: 1, name: 'Station 1', lat: 51.5074, lng: -0.1278, status: 'available', currentPower: 50 },
          { id: 2, name: 'Station 2', lat: 51.5174, lng: -0.1378, status: 'available', currentPower: 75 },
          { id: 3, name: 'Station 3', lat: 51.4974, lng: -0.1178, status: 'available', currentPower: 100 },
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

  const handleFindRoute = () => {
    if (!startStation || !endStation) {
      setError('Please select both start and end stations');
      return;
    }

    try {
      const optimalRoute = findOptimalRoute(stations, startStation, endStation, vehicleInfo);
      if (optimalRoute.length === 0) {
        setError('No feasible route found with current battery level');
        return;
      }
      setRoute(optimalRoute);
      setError(null);
    } catch (err) {
      setError('Failed to calculate route');
    }
  };

  const getRoutePath = () => {
    if (!route.length) return [];
    return route.map(station => ({
      lat: station.lat,
      lng: station.lng,
    }));
  };

  if (loading) return <Typography>Loading...</Typography>;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom>
              Route Planner
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Start Station</InputLabel>
                  <Select
                    value={startStation?.id || ''}
                    label="Start Station"
                    onChange={(e) => {
                      const station = stations.find(s => s.id === e.target.value);
                      setStartStation(station);
                    }}
                  >
                    {stations.map((station) => (
                      <MenuItem key={station.id} value={station.id}>
                        {station.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>End Station</InputLabel>
                  <Select
                    value={endStation?.id || ''}
                    label="End Station"
                    onChange={(e) => {
                      const station = stations.find(s => s.id === e.target.value);
                      setEndStation(station);
                    }}
                  >
                    {stations.map((station) => (
                      <MenuItem key={station.id} value={station.id}>
                        {station.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="Battery Capacity (kWh)"
                    type="number"
                    value={vehicleInfo.batteryCapacity}
                    onChange={(e) => setVehicleInfo({
                      ...vehicleInfo,
                      batteryCapacity: Number(e.target.value),
                    })}
                    fullWidth
                  />
                  <TextField
                    label="Current Charge (%)"
                    type="number"
                    value={vehicleInfo.currentCharge}
                    onChange={(e) => setVehicleInfo({
                      ...vehicleInfo,
                      currentCharge: Number(e.target.value),
                    })}
                    fullWidth
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Vehicle Efficiency (kWh/km)"
                  type="number"
                  value={vehicleInfo.vehicleEfficiency}
                  onChange={(e) => setVehicleInfo({
                    ...vehicleInfo,
                    vehicleEfficiency: Number(e.target.value),
                  })}
                  fullWidth
                  helperText="Typical values: 0.15-0.25 kWh/km for most EVs"
                />
              </Grid>
            </Grid>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              onClick={handleFindRoute}
            >
              Find Optimal Route
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Route Map
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
                    title={station.name}
                  />
                ))}
                {route.length > 0 && (
                  <Polyline
                    path={getRoutePath()}
                    options={{
                      strokeColor: '#FF0000',
                      strokeOpacity: 1.0,
                      strokeWeight: 2,
                    }}
                  />
                )}
              </GoogleMap>
            </LoadScript>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Route Details
            </Typography>
            {route.length > 0 ? (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    Total Distance: {calculateRouteDistance(route).toFixed(2)} km
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Total Energy: {calculateTotalEnergyConsumption(route, vehicleInfo.vehicleEfficiency).toFixed(2)} kWh
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Estimated Cost: ${estimateTotalCost(route).toFixed(2)}
                  </Typography>
                </Box>
                <List>
                  {route.map((station, index) => (
                    <React.Fragment key={station.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography>{`${index + 1}. ${station.name}`}</Typography>
                              <Chip
                                label={`${station.currentPower} kW`}
                                size="small"
                                color="primary"
                              />
                            </Box>
                          }
                          secondary={
                            index < route.length - 1 ? (
                              <Box>
                                <Typography variant="body2">
                                  Energy Needed: {station.energyNeeded.toFixed(2)} kWh
                                </Typography>
                                <Typography variant="body2">
                                  Charging Time: {estimateChargingTime(
                                    station,
                                    vehicleInfo.batteryCapacity,
                                    vehicleInfo.currentCharge
                                  ).toFixed(0)} minutes
                                </Typography>
                              </Box>
                            ) : (
                              'Final Destination'
                            )
                          }
                        />
                      </ListItem>
                      {index < route.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </>
            ) : (
              <Typography variant="body1" color="text.secondary">
                Select stations and click "Find Optimal Route" to see details
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default RoutePlanner; 