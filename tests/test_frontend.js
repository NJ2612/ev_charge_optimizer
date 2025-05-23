// Test file for frontend JavaScript functionality
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

// Load the HTML file
const html = fs.readFileSync(path.resolve(__dirname, '../frontend/index.html'), 'utf8');
const dom = new JSDOM(html);
global.document = dom.window.document;
global.window = dom.window;

// Load the JavaScript files
require('../frontend/js/api.js');
require('../frontend/js/auth.js');
require('../frontend/js/app.js');
require('../frontend/js/dijkstra.js');

describe('Frontend Functionality Tests', () => {
    beforeEach(() => {
        // Reset the DOM before each test
        document.body.innerHTML = html;
    });

    describe('Authentication', () => {
        test('login form submission', () => {
            const loginForm = document.getElementById('loginForm');
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');

            usernameInput.value = 'testuser';
            passwordInput.value = 'testpass123';

            const submitEvent = new window.Event('submit');
            loginForm.dispatchEvent(submitEvent);

            // Check if the login function was called with correct parameters
            expect(window.login).toHaveBeenCalledWith('testuser', 'testpass123');
        });

        test('register form submission', () => {
            const registerForm = document.getElementById('registerForm');
            const usernameInput = document.getElementById('regUsername');
            const emailInput = document.getElementById('regEmail');
            const passwordInput = document.getElementById('regPassword');

            usernameInput.value = 'newuser';
            emailInput.value = 'new@example.com';
            passwordInput.value = 'newpass123';

            const submitEvent = new window.Event('submit');
            registerForm.dispatchEvent(submitEvent);

            // Check if the register function was called with correct parameters
            expect(window.register).toHaveBeenCalledWith('newuser', 'new@example.com', 'newpass123');
        });
    });

    describe('Route Planning', () => {
        test('find route button click', () => {
            const findRouteBtn = document.getElementById('findRouteBtn');
            const startStation = document.getElementById('startStation');
            const endStation = document.getElementById('endStation');
            const batteryCapacity = document.getElementById('batteryCapacity');
            const currentCharge = document.getElementById('currentCharge');
            const vehicleEfficiency = document.getElementById('vehicleEfficiency');

            startStation.value = '1';
            endStation.value = '2';
            batteryCapacity.value = '75';
            currentCharge.value = '80';
            vehicleEfficiency.value = '0.2';

            const clickEvent = new window.Event('click');
            findRouteBtn.dispatchEvent(clickEvent);

            // Check if the findRoute function was called with correct parameters
            expect(window.findRoute).toHaveBeenCalledWith({
                start_id: '1',
                end_id: '2',
                battery_capacity: '75',
                current_charge: '80',
                vehicle_efficiency: '0.2'
            });
        });

        test('algorithm steps navigation', () => {
            const prevStepBtn = document.getElementById('prevStepBtn');
            const nextStepBtn = document.getElementById('nextStepBtn');

            // Simulate having steps
            window.algorithmSteps = ['Step 1', 'Step 2', 'Step 3'];
            window.currentStep = 1;

            const clickEvent = new window.Event('click');
            nextStepBtn.dispatchEvent(clickEvent);

            expect(window.currentStep).toBe(2);
            expect(document.getElementById('stepInfo').textContent).toBe('Step 2');

            prevStepBtn.dispatchEvent(clickEvent);
            expect(window.currentStep).toBe(1);
            expect(document.getElementById('stepInfo').textContent).toBe('Step 1');
        });
    });

    describe('Station Management', () => {
        test('station status update', () => {
            const updateStatusBtn = document.getElementById('updateStatusBtn');
            const stationId = document.getElementById('stationId');
            const newStatus = document.getElementById('newStatus');
            const newLoad = document.getElementById('newLoad');

            stationId.value = '1';
            newStatus.value = 'occupied';
            newLoad.value = '0.8';

            const clickEvent = new window.Event('click');
            updateStatusBtn.dispatchEvent(clickEvent);

            // Check if the updateStationStatus function was called with correct parameters
            expect(window.updateStationStatus).toHaveBeenCalledWith('1', '0.8', 'occupied');
        });

        test('load prediction display', () => {
            const predictLoadBtn = document.getElementById('predictLoadBtn');
            const stationId = document.getElementById('stationId');

            stationId.value = '1';

            const clickEvent = new window.Event('click');
            predictLoadBtn.dispatchEvent(clickEvent);

            // Check if the predictLoad function was called with correct parameters
            expect(window.predictLoad).toHaveBeenCalledWith('1');
        });
    });

    describe('Dashboard Updates', () => {
        test('dashboard refresh', () => {
            const refreshBtn = document.getElementById('refreshBtn');

            const clickEvent = new window.Event('click');
            refreshBtn.dispatchEvent(clickEvent);

            // Check if the updateDashboard function was called
            expect(window.updateDashboard).toHaveBeenCalled();
        });

        test('station list display', () => {
            // Simulate station data
            const stations = [
                { id: 1, name: 'Station 1', status: 'available', current_load: 0.5 },
                { id: 2, name: 'Station 2', status: 'occupied', current_load: 0.8 }
            ];

            window.displayStations(stations);

            const stationList = document.getElementById('stationList');
            expect(stationList.children.length).toBe(2);
            expect(stationList.children[0].textContent).toContain('Station 1');
            expect(stationList.children[1].textContent).toContain('Station 2');
        });
    });
}); 