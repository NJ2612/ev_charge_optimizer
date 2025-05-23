class DijkstraAlgorithm {
    constructor(graph) {
        this.graph = graph;
        this.distances = new Map();
        this.previous = new Map();
        this.visited = new Set();
        this.unvisited = new Set();
    }

    initialize(startId) {
        // Initialize distances and previous nodes
        for (const node of this.graph.nodes) {
            this.distances.set(node.id, Infinity);
            this.previous.set(node.id, null);
            this.unvisited.add(node.id);
        }
        this.distances.set(startId, 0);
    }

    getNeighbors(nodeId) {
        return this.graph.edges
            .filter(edge => edge.from === nodeId || edge.to === nodeId)
            .map(edge => edge.from === nodeId ? edge.to : edge.from);
    }

    getDistance(fromId, toId) {
        const edge = this.graph.edges.find(
            edge => (edge.from === fromId && edge.to === toId) || 
                   (edge.from === toId && edge.to === fromId)
        );
        return edge ? edge.weight : Infinity;
    }

    findShortestPath(startId, endId, batteryCapacity, currentCharge, vehicleEfficiency) {
        this.initialize(startId);
        const steps = [];

        while (this.unvisited.size > 0) {
            // Find unvisited node with smallest distance
            let currentId = null;
            let smallestDistance = Infinity;

            for (const nodeId of this.unvisited) {
                const distance = this.distances.get(nodeId);
                if (distance < smallestDistance) {
                    smallestDistance = distance;
                    currentId = nodeId;
                }
            }

            if (currentId === null || smallestDistance === Infinity) {
                break;
            }

            // Record step for visualization
            steps.push({
                current: currentId,
                distances: new Map(this.distances),
                visited: new Set(this.visited),
                unvisited: new Set(this.unvisited)
            });

            if (currentId === endId) {
                break;
            }

            this.unvisited.delete(currentId);
            this.visited.add(currentId);

            // Check neighbors
            for (const neighborId of this.getNeighbors(currentId)) {
                if (this.visited.has(neighborId)) continue;

                const distance = this.getDistance(currentId, neighborId);
                const energyNeeded = distance * vehicleEfficiency;
                const currentEnergy = currentCharge * batteryCapacity / 100;

                // Skip if not enough battery
                if (energyNeeded > currentEnergy) continue;

                const totalDistance = this.distances.get(currentId) + distance;
                
                if (totalDistance < this.distances.get(neighborId)) {
                    this.distances.set(neighborId, totalDistance);
                    this.previous.set(neighborId, currentId);
                }
            }
        }

        // Reconstruct path
        const path = [];
        let currentId = endId;
        
        while (currentId !== null) {
            path.unshift(currentId);
            currentId = this.previous.get(currentId);
        }

        return {
            path: path,
            distance: this.distances.get(endId),
            steps: steps
        };
    }
}

// Visualization helper functions
function visualizeStep(step, graph) {
    const visualization = {
        current: step.current,
        distances: Array.from(step.distances.entries()).map(([id, distance]) => ({
            id,
            distance: distance === Infinity ? '∞' : distance.toFixed(1)
        })),
        visited: Array.from(step.visited),
        unvisited: Array.from(step.unvisited)
    };

    return visualization;
}

function createGraphFromStations(stations) {
    const nodes = stations.map(station => ({
        id: station.id,
        name: station.name,
        lat: station.lat,
        lng: station.lng
    }));

    // Create edges between all stations (in a real app, this would be based on actual connections)
    const edges = [];
    for (let i = 0; i < stations.length; i++) {
        for (let j = i + 1; j < stations.length; j++) {
            const station1 = stations[i];
            const station2 = stations[j];
            
            // Calculate distance using Haversine formula
            const distance = calculateDistance(
                station1.lat, station1.lng,
                station2.lat, station2.lng
            );

            edges.push({
                from: station1.id,
                to: station2.id,
                weight: distance
            });
        }
    }

    return { nodes, edges };
}

// Haversine formula to calculate distance between two points on Earth
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function toRad(degrees) {
    return degrees * (Math.PI/180);
} 