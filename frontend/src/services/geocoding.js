const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

export const geocodeAddress = async (address) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${API_KEY}`
    );
    const data = await response.json();

    if (data.status === 'OK') {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    } else {
      throw new Error(data.status);
    }
  } catch (error) {
    throw new Error('Geocoding failed: ' + error.message);
  }
};

export const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`
    );
    const data = await response.json();

    if (data.status === 'OK') {
      return data.results[0].formatted_address;
    } else {
      throw new Error(data.status);
    }
  } catch (error) {
    throw new Error('Reverse geocoding failed: ' + error.message);
  }
}; 