document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    const sections = document.querySelectorAll('.section');
    const navButtons = document.querySelectorAll('.nav-btn');

    function showSection(sectionId) {
        sections.forEach(section => {
            section.classList.remove('active');
            if (section.id === sectionId) {
                section.classList.add('active');
            }
        });

        navButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.id === `${sectionId}Btn`) {
                btn.classList.add('active');
            }
        });
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const sectionId = btn.id.replace('Btn', '');
            showSection(sectionId);
        });
    });

    let currentStep = 0;
    let algorithmSteps = [];
    let stations = [];

    // Dashboard
    async function updateDashboard() {
        try {
            stations = await apiService.getStations();
            const availableStations = stations.filter(s => s.status === 'available');
            
            // Update available stations
            document.getElementById('availableStations').innerHTML = `
                <p>Total: ${availableStations.length}</p>
                <ul>
                    ${availableStations.map(s => `
                        <li>${s.name} (${s.capacity} ports)</li>
                    `).join('')}
                </ul>
            `;

            // Update current load
            const currentLoad = stations.reduce((acc, s) => acc + s.current_load, 0) / stations.length;
            document.getElementById('currentLoad').innerHTML = `
                <p>Average: ${(currentLoad * 100).toFixed(1)}%</p>
                <div class="progress-bar">
                    <div class="progress" style="width: ${currentLoad * 100}%"></div>
                </div>
            `;

            // Update predicted load
            const predictedLoad = stations.reduce((acc, s) => acc + (s.predicted_load || 0), 0) / stations.length;
            document.getElementById('predictedLoad').innerHTML = `
                <p>Average: ${(predictedLoad * 100).toFixed(1)}%</p>
                <div class="progress-bar">
                    <div class="progress" style="width: ${predictedLoad * 100}%"></div>
                </div>
            `;
        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }

    // Route Planner
    async function loadStations() {
        try {
            stations = await apiService.getStations();
            const stationOptions = stations.map(s => 
                `<option value="${s.id}">${s.name}</option>`
            ).join('');

            document.getElementById('startStation').innerHTML = stationOptions;
            document.getElementById('endStation').innerHTML = stationOptions;
        } catch (error) {
            console.error('Error loading stations:', error);
        }
    }

    function displayStep(stepIndex) {
        if (stepIndex < 0 || stepIndex >= algorithmSteps.length) return;

        const step = algorithmSteps[stepIndex];
        const visualization = visualizeStep(step, createGraphFromStations(stations));
        const stepsContainer = document.querySelector('.steps-container');

        stepsContainer.innerHTML = `
            <div class="step-info">
                <h4>Step ${stepIndex + 1}</h4>
                <p>Current Node: ${getStationName(visualization.current)}</p>
                <p>Visited Nodes: ${visualization.visited.length}</p>
                <p>Unvisited Nodes: ${visualization.unvisited.length}</p>
            </div>
            <div class="step-nodes">
                ${visualization.distances.map(({ id, distance }) => `
                    <div class="step-node ${getNodeClass(id, visualization)}">
                        ${getStationName(id)}
                        <div class="step-node distance">${distance}</div>
                    </div>
                `).join('')}
            </div>
        `;

        // Update step controls
        document.getElementById('prevStepBtn').disabled = stepIndex === 0;
        document.getElementById('nextStepBtn').disabled = stepIndex === algorithmSteps.length - 1;
        currentStep = stepIndex;
    }

    function getNodeClass(nodeId, visualization) {
        if (nodeId === visualization.current) return 'current';
        if (visualization.visited.includes(nodeId)) return 'visited';
        return 'unvisited';
    }

    function getStationName(stationId) {
        const station = stations.find(s => s.id === stationId);
        return station ? station.name : `Station ${stationId}`;
    }

    async function findRoute() {
        const params = {
            start_id: parseInt(document.getElementById('startStation').value),
            end_id: parseInt(document.getElementById('endStation').value),
            battery_capacity: parseFloat(document.getElementById('batteryCapacity').value),
            current_charge: parseFloat(document.getElementById('currentCharge').value),
            vehicle_efficiency: parseFloat(document.getElementById('vehicleEfficiency').value)
        };

        try {
            // Create graph from stations
            const graph = createGraphFromStations(stations);
            
            // Run Dijkstra's algorithm
            const dijkstra = new DijkstraAlgorithm(graph);
            const result = dijkstra.findShortestPath(
                params.start_id,
                params.end_id,
                params.battery_capacity,
                params.current_charge,
                params.vehicle_efficiency
            );

            // Store steps for visualization
            algorithmSteps = result.steps;
            currentStep = 0;
            displayStep(currentStep);

            // Display final route
            displayRouteResult({
                route: result.path.map(id => stations.find(s => s.id === id)),
                total_distance: result.distance,
                estimated_time: result.distance * 2 // Rough estimate: 2 minutes per km
            });
        } catch (error) {
            console.error('Error finding route:', error);
            document.getElementById('routeResult').innerHTML = `
                <div class="error">Failed to find route. Please try again.</div>
            `;
        }
    }

    function displayRouteResult(result) {
        if (result.error) {
            document.getElementById('routeResult').innerHTML = `
                <div class="error">${result.error}</div>
            `;
            return;
        }

        document.getElementById('routeResult').innerHTML = `
            <h3>Route Details</h3>
            <p>Total Distance: ${result.total_distance.toFixed(1)} km</p>
            <p>Estimated Time: ${result.estimated_time.toFixed(0)} minutes</p>
            <div class="route-stations">
                ${result.route.map((station, index) => `
                    <div class="station-step">
                        <div class="station-number">${index + 1}</div>
                        <div class="station-info">
                            <h4>${station.name}</h4>
                            <p>Charging Rate: ${station.charging_rate} kW</p>
                            <p>Predicted Load: ${(station.predicted_load * 100).toFixed(1)}%</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Event Listeners
    document.getElementById('findRouteBtn').addEventListener('click', findRoute);
    document.getElementById('logoutBtn').addEventListener('click', () => authService.logout());
    document.getElementById('prevStepBtn').addEventListener('click', () => displayStep(currentStep - 1));
    document.getElementById('nextStepBtn').addEventListener('click', () => displayStep(currentStep + 1));

    // Initialize
    if (authService.isAuthenticated()) {
        loadStations();
        updateDashboard();
        // Update dashboard every 30 seconds
        setInterval(updateDashboard, 30000);
    } else {
        window.location.href = '/login.html';
    }
}); 