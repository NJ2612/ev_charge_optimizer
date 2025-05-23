// Implementation of Dijkstra's algorithm for finding optimal charging station routes
class PriorityQueue {
  constructor() {
    this.values = [];
  }

  enqueue(val, priority) {
    this.values.push({ val, priority });
    this.sort();
  }

  dequeue() {
    return this.values.shift();
  }

  sort() {
    this.values.sort((a, b) => a.priority - b.priority);
  }

  isEmpty() {
    return this.values.length === 0;
  }
}

class Graph {
  constructor() {
    this.adjacencyList = {};
  }

  addVertex(vertex) {
    if (!this.adjacencyList[vertex]) {
      this.adjacencyList[vertex] = [];
    }
  }

  addEdge(vertex1, vertex2, weight, additionalInfo = {}) {
    this.adjacencyList[vertex1].push({ node: vertex2, weight, ...additionalInfo });
    this.adjacencyList[vertex2].push({ node: vertex1, weight, ...additionalInfo });
  }

  dijkstra(start, finish, constraints = {}) {
    const nodes = new PriorityQueue();
    const distances = {};
    const previous = {};
    const path = [];
    let smallest;

    // Build up initial state
    for (let vertex in this.adjacencyList) {
      if (vertex === start) {
        distances[vertex] = 0;
        nodes.enqueue(vertex, 0);
      } else {
        distances[vertex] = Infinity;
        nodes.enqueue(vertex, Infinity);
      }
      previous[vertex] = null;
    }

    // As long as there is something to visit
    while (!nodes.isEmpty()) {
      smallest = nodes.dequeue().val;
      
      if (smallest === finish) {
        // We are done, build up path to return
        while (previous[smallest]) {
          path.push(smallest);
          smallest = previous[smallest];
        }
        break;
      }

      if (smallest || distances[smallest] !== Infinity) {
        for (let neighbor in this.adjacencyList[smallest]) {
          // Find neighboring node
          let nextNode = this.adjacencyList[smallest][neighbor];
          
          // Check constraints
          if (constraints.checkConstraints && !constraints.checkConstraints(nextNode)) {
            continue;
          }

          // Calculate new distance to neighboring node
          let candidate = distances[smallest] + nextNode.weight;
          let nextNeighbor = nextNode.node;

          if (candidate < distances[nextNeighbor]) {
            // Updating new smallest distance to neighbor
            distances[nextNeighbor] = candidate;
            // Updating previous - How we got to neighbor
            previous[nextNeighbor] = smallest;
            // Enqueue in priority queue with new priority
            nodes.enqueue(nextNeighbor, candidate);
          }
        }
      }
    }
    return path.concat(smallest).reverse();
  }
}

// Helper function to calculate distance between two points using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

// Function to calculate energy consumption based on distance and vehicle efficiency
const calculateEnergyConsumption = (distance, vehicleEfficiency = 0.2) => {
  return distance * vehicleEfficiency; // kWh
};

// Function to check if a station is reachable with current battery level
const isStationReachable = (currentBattery, distance, vehicleEfficiency) => {
  const energyNeeded = calculateEnergyConsumption(distance, vehicleEfficiency);
  return currentBattery >= energyNeeded;
};

// Function to find optimal route between charging stations
export const findOptimalRoute = (stations, startStation, endStation, vehicleInfo) => {
  const graph = new Graph();
  const { batteryCapacity, currentCharge, vehicleEfficiency = 0.2 } = vehicleInfo;
  const currentBattery = (currentCharge / 100) * batteryCapacity;

  // Add all stations as vertices
  stations.forEach(station => {
    graph.addVertex(station.id);
  });

  // Add edges between stations based on distance and constraints
  for (let i = 0; i < stations.length; i++) {
    for (let j = i + 1; j < stations.length; j++) {
      const distance = calculateDistance(
        stations[i].lat,
        stations[i].lng,
        stations[j].lat,
        stations[j].lng
      );

      // Calculate energy needed for this segment
      const energyNeeded = calculateEnergyConsumption(distance, vehicleEfficiency);
      
      // Add edge with distance as weight and additional information
      graph.addEdge(stations[i].id, stations[j].id, distance, {
        energyNeeded,
        chargingRate: stations[j].currentPower,
        status: stations[j].status
      });
    }
  }

  // Define constraints for the route
  const constraints = {
    checkConstraints: (edge) => {
      // Check if station is available
      if (edge.status !== 'available') return false;
      
      // Check if we have enough battery to reach the station
      if (!isStationReachable(currentBattery, edge.weight, vehicleEfficiency)) return false;
      
      return true;
    }
  };

  // Find optimal path
  const optimalPath = graph.dijkstra(startStation.id, endStation.id, constraints);

  // Convert path to station objects with additional information
  return optimalPath.map(stationId => {
    const station = stations.find(s => s.id === stationId);
    return {
      ...station,
      energyNeeded: calculateEnergyConsumption(
        calculateDistance(
          station.lat,
          station.lng,
          stations.find(s => s.id === optimalPath[optimalPath.indexOf(stationId) + 1])?.lat || endStation.lat,
          stations.find(s => s.id === optimalPath[optimalPath.indexOf(stationId) + 1])?.lng || endStation.lng
        ),
        vehicleEfficiency
      )
    };
  });
};

// Function to calculate total distance of a route
export const calculateRouteDistance = (route) => {
  let totalDistance = 0;
  for (let i = 0; i < route.length - 1; i++) {
    totalDistance += calculateDistance(
      route[i].lat,
      route[i].lng,
      route[i + 1].lat,
      route[i + 1].lng
    );
  }
  return totalDistance;
};

// Function to estimate charging time at each station
export const estimateChargingTime = (station, batteryCapacity, currentCharge) => {
  const chargeNeeded = batteryCapacity - (currentCharge / 100) * batteryCapacity;
  const chargingRate = station.currentPower; // kW
  return (chargeNeeded / chargingRate) * 60; // minutes
};

// Function to calculate total energy consumption for the route
export const calculateTotalEnergyConsumption = (route, vehicleEfficiency = 0.2) => {
  return calculateRouteDistance(route) * vehicleEfficiency;
};

// Function to estimate total cost of the journey
export const estimateTotalCost = (route, energyPrice = 0.15) => {
  const totalEnergy = calculateTotalEnergyConsumption(route);
  return totalEnergy * energyPrice;
}; 