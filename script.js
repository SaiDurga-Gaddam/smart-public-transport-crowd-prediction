// Application State & Logic
const app = {
    state: {
        theme: 'light',
        language: 'EN',
        currentView: 'home',
        isLoggedIn: false
    },

    // Initialization
    init() {
        this.setupNavigation();
        this.setupChatbot();
        
        // Check Auth State
        const user = localStorage.getItem('tp_user');
        if (user) {
            this.state.isLoggedIn = true;
            this.applyAuthState();
            this.showDashboard();
        } else {
            this.state.isLoggedIn = false;
            this.applyAuthState();
            this.showDashboard();
        }
        
        // Hide help tooltip after a few seconds
        setTimeout(() => {
            const tooltip = document.getElementById('help-tooltip');
            if(tooltip) tooltip.style.display = 'none';
        }, 5000);
    },

    applyAuthState() {
        if (this.state.isLoggedIn) {
            document.querySelectorAll('.auth-required').forEach(el => el.classList.remove('hidden'));
            document.querySelectorAll('.guest-only').forEach(el => el.classList.add('hidden'));
            
            const user = JSON.parse(localStorage.getItem('tp_user'));
            document.getElementById('mini-profile-name').innerText = user.name;
            document.getElementById('mini-profile-tier').innerText = 'Premium Member';
            document.getElementById('profile-name').innerText = user.name;
            document.getElementById('profile-email').innerText = user.email;
        } else {
            document.querySelectorAll('.auth-required').forEach(el => el.classList.add('hidden'));
            document.querySelectorAll('.guest-only').forEach(el => el.classList.remove('hidden'));
            
            document.getElementById('mini-profile-name').innerText = 'Guest';
            document.getElementById('mini-profile-tier').innerText = 'Free Mode';
            
            // Force user to journey page if they try to access protected ones
            if (['history', 'alerts', 'settings'].includes(this.state.currentView)) {
                this.startJourneyFlow();
            }
        }
    },

    // --- Auth Logic ---
    showLogin() {
        document.getElementById('signup-view').classList.add('hidden');
        document.getElementById('dashboard-view').classList.add('hidden');
        document.getElementById('login-view').classList.remove('hidden');
        document.getElementById('chatbot-fab').classList.add('hidden');
    },

    showSignup() {
        document.getElementById('login-view').classList.add('hidden');
        document.getElementById('dashboard-view').classList.add('hidden');
        document.getElementById('signup-view').classList.remove('hidden');
        document.getElementById('chatbot-fab').classList.add('hidden');
    },

    login() {
        const emailInput = document.querySelector('#login-view input[type="email"]').value.trim().toLowerCase();
        const pwdInput = document.querySelector('#login-view input[type="password"]').value;
        if (!emailInput || !pwdInput) { alert("Please enter credentials."); return; }
        
        const db = JSON.parse(localStorage.getItem('tp_db_users') || '{}');
        const userRecord = db[emailInput];
        
        if (!userRecord || userRecord.password !== pwdInput) {
            alert("Invalid email or password.");
            return;
        }

        const btn = document.querySelector('#login-view button.btn-primary');
        const origText = btn.innerText;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Authenticating...';
        
        setTimeout(() => {
            btn.innerText = origText;
            
            // Set session data from DB
            const user = { name: userRecord.name, email: emailInput };
            localStorage.setItem('tp_user', JSON.stringify(user));
            localStorage.setItem('tp_history', JSON.stringify(userRecord.history || []));
            localStorage.setItem('tp_favorites', JSON.stringify(userRecord.favorites || []));
            
            this.state.isLoggedIn = true;
            this.applyAuthState();
            this.showDashboard();
        }, 1000);
    },

    signup() {
        const nameInput = document.querySelector('#signup-view input[type="text"]').value.trim();
        const emailInput = document.querySelector('#signup-view input[type="email"]').value.trim().toLowerCase();
        const pwdInput = document.querySelector('#signup-view input[type="password"]').value; // First password input
        
        if (!nameInput || !emailInput || !pwdInput) { alert("Please fill all fields."); return; }
        
        const db = JSON.parse(localStorage.getItem('tp_db_users') || '{}');
        if (db[emailInput]) {
            alert("Account with this email already exists! Please log in.");
            return;
        }

        const btn = document.querySelector('#signup-view button.btn-primary');
        const origText = btn.innerText;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Creating Profile...';
        
        setTimeout(() => {
            btn.innerText = origText;
            
            // Create in DB
            db[emailInput] = { password: pwdInput, name: nameInput, history: [], favorites: [] };
            localStorage.setItem('tp_db_users', JSON.stringify(db));
            
            // Set session data
            const user = { name: nameInput, email: emailInput };
            localStorage.setItem('tp_user', JSON.stringify(user));
            localStorage.setItem('tp_history', JSON.stringify([]));
            localStorage.setItem('tp_favorites', JSON.stringify([]));
            
            this.state.isLoggedIn = true;
            this.applyAuthState();
            this.showDashboard();
        }, 1200);
    },

    saveToDB(key, data) {
        if (!this.state.isLoggedIn) return;
        const user = JSON.parse(localStorage.getItem('tp_user'));
        if (user && user.email) {
            const db = JSON.parse(localStorage.getItem('tp_db_users') || '{}');
            if (db[user.email]) {
                if (key === 'tp_history') db[user.email].history = data;
                if (key === 'tp_favorites') db[user.email].favorites = data;
                localStorage.setItem('tp_db_users', JSON.stringify(db));
            }
        }
    },

    logout() {
        localStorage.removeItem('tp_user');
        localStorage.removeItem('tp_history'); // Clear session
        localStorage.removeItem('tp_favorites'); // Clear session
        this.state.isLoggedIn = false;
        this.applyAuthState();
        this.navigate('home'); // Go to home view
    },

    showDashboard() {
        document.getElementById('login-view').classList.add('hidden');
        document.getElementById('signup-view').classList.add('hidden');
        document.getElementById('dashboard-view').classList.remove('hidden');
        document.getElementById('chatbot-fab').classList.remove('hidden');
        
        this.navigate('home');
    },

    // --- Navigation Logic ---
    setupNavigation() {
        const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.currentTarget.getAttribute('data-target');
                this.navigate(target);
            });
        });
    },

    navigate(target) {
        this.state.currentView = target;
        
        // Update Sidebar Active State
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-target') === target) {
                item.classList.add('active');
            }
        });

        // Hide all sections
        const sections = ['home-section', 'journey-section', 'history-section', 'alerts-section', 'settings-section', 'about-section'];
        sections.forEach(id => {
            document.getElementById(id).classList.add('hidden');
        });

        // Show target section
        if (target === 'home') {
            document.getElementById('home-section').classList.remove('hidden');
            document.getElementById('page-title').innerText = 'TransitPulse';
            if (this.state.isLoggedIn) {
                this.populateHistory();
                this.renderFavorites();
            }
        } else if (target === 'history') {
            document.getElementById('history-section').classList.remove('hidden');
            document.getElementById('page-title').innerText = 'History';
            this.populateHistory();
        } else if (target === 'alerts') {
            document.getElementById('alerts-section').classList.remove('hidden');
            document.getElementById('page-title').innerText = 'Alerts';
        } else if (target === 'settings') {
            document.getElementById('settings-section').classList.remove('hidden');
            document.getElementById('page-title').innerText = 'Settings';
        } else if (target === 'about') {
            document.getElementById('about-section').classList.remove('hidden');
            document.getElementById('page-title').innerText = 'About';
        }
    },

    // --- Journey Flow ---
    startJourneyFlow() {
        // Hide home, show journey
        document.getElementById('home-section').classList.add('hidden');
        document.getElementById('journey-section').classList.remove('hidden');
        
        // Remove active class from sidebar home
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => item.classList.remove('active'));
        document.getElementById('page-title').innerText = 'Plan Journey';
        
        // Reset view
        document.getElementById('bus-results').classList.add('hidden');
        document.getElementById('live-tracking').classList.add('hidden');
    },

    findBuses() {
        const start = document.getElementById('start-point').value;
        const end = document.getElementById('end-point').value;
        
        if (!start || !end) {
            alert('Please enter both starting point and destination.');
            return;
        }

        document.getElementById('bus-results').classList.add('hidden');
        document.getElementById('live-tracking').classList.add('hidden');
        document.getElementById('search-loader-text').innerText = 'Fetching live routes and predictions...';
        document.getElementById('search-loader').classList.remove('hidden');

        setTimeout(() => {
            document.getElementById('search-loader').classList.add('hidden');

            // Peak hour logic (8-11 AM, 5-9 PM)
        const hour = new Date().getHours();
        const isPeak = (hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21);
        const isNight = (hour < 6 || hour > 22);
        
        const getCap = (base) => {
            let pct = base;
            if (isPeak) pct += 30;
            if (isNight) pct -= 40;
            return Math.min(100, Math.max(10, pct));
        };

        // Real TSRTC Route database for mapping (Gamyam-style full tracking)
        const tsrtcDB = {
            '218D': ['Patancheru', 'Muthangi', 'RC Puram', 'BHEL', 'Chandanagar', 'Madinaguda', 'Miyapur', 'JNTU', 'KPHB', 'Kukatpally', 'Moosapet', 'Bharat Nagar', 'Erragadda', 'ESI', 'SR Nagar', 'Ameerpet', 'Punjagutta', 'Khairatabad', 'Lakdikapul', 'Assembly', 'Abids', 'Koti', 'Chaderghat', 'Malakpet', 'Dilsukhnagar'],
            '10H': ['Secunderabad', 'Patny', 'Paradise', 'Begumpet', 'Ameerpet', 'Madhura Nagar', 'Yousufguda', 'Jubilee Hills', 'Peddamma Temple', 'Madhapur', 'Hitec City', 'Kondapur'],
            '113K': ['Uppal', 'Survey of India', 'Habsiguda', 'Tarnaka', 'Mettuguda', 'Alugadda Bavi', 'Secunderabad', 'Patny', 'Paradise', 'Begumpet', 'Ameerpet', 'SR Nagar', 'ESI', 'Erragadda', 'Bharat Nagar', 'Moosapet', 'Kukatpally', 'KPHB', 'JNTU', 'Miyapur', 'Madinaguda', 'Chandanagar', 'Lingampally'],
            '158': ['Sanath Nagar', 'Czech Colony', 'Erragadda', 'ESI', 'SR Nagar', 'Ameerpet', 'Punjagutta', 'Banjara Hills', 'Masab Tank', 'Mehdipatnam'],
            '94R': ['Koti', 'Afzalgunj', 'City College', 'High Court', 'Zoo Park', 'Attapur', 'Hyderguda', 'Rajendra Nagar'],
            '5K': ['Secunderabad', 'Gandhi Hospital', 'Musheerabad', 'Tank Bund', 'Secretariat', 'Lakdikapul', 'Masab Tank', 'Mehdipatnam'],
            '219': ['Patancheru', 'BHEL', 'Chandanagar', 'Miyapur', 'JNTU', 'KPHB', 'Kukatpally', 'Moosapet', 'Balanagar', 'Bowenpally', 'Tadbund', 'Secunderabad'],
            '290': ['Secunderabad', 'Rathifile Bus Station', 'Alugadda Bavi', 'Mettuguda', 'Tarnaka', 'Habsiguda', 'Uppal', 'Nagole', 'Kothapet', 'LB Nagar', 'Panama Godowns', 'Hayathnagar']
        };

        let buses = [];
        let idCounter = 1;

        // Check if any route matches the search
        for (const [routeNum, stopsList] of Object.entries(tsrtcDB)) {
            const hasStart = stopsList.some(s => s.toLowerCase().includes(start.toLowerCase()));
            const hasEnd = stopsList.some(s => s.toLowerCase().includes(end.toLowerCase()));
            
            if (hasStart && hasEnd) {
                const sIdx = stopsList.findIndex(s => s.toLowerCase().includes(start.toLowerCase()));
                const eIdx = stopsList.findIndex(s => s.toLowerCase().includes(end.toLowerCase()));
                if (sIdx !== eIdx) {
                    // Extract exact path
                    const uiStops = sIdx < eIdx 
                        ? stopsList.slice(sIdx, eIdx + 1)
                        : stopsList.slice(eIdx, sIdx + 1).reverse();
                        
                    buses.push({
                        id: String(idCounter++),
                        route: routeNum,
                        name: `${start} - ${end}`,
                        type: 'Metro Express',
                        time: Math.floor(Math.random() * 10 + 2) + ' min',
                        capPct: getCap(Math.floor(Math.random() * 40 + 30)),
                        stops: uiStops
                    });
                }
            }
        }

        // If no exact match found, dynamically generate generic connecting routes so the UI always works perfectly
        if (buses.length === 0) {
            const randomRoutes = ['1Z', '9X', '47L', '18C', '115', '2Z'];
            buses.push({
                id: '1', route: randomRoutes[Math.floor(Math.random()*randomRoutes.length)],
                name: `${start} - ${end}`,
                type: 'City Ordinary',
                time: '4 min',
                capPct: getCap(60),
                stops: [start, 'Connecting Stop', 'City Center', end]
            });
            buses.push({
                id: '2', route: randomRoutes[Math.floor(Math.random()*randomRoutes.length)],
                name: `${start} - ${end}`,
                type: 'Metro Luxury',
                time: '9 min',
                capPct: getCap(25),
                stops: [start, 'Highway', 'Express Stop', end]
            });
        }

        const container = document.querySelector('.bus-list');
        container.innerHTML = '';
        
        buses.forEach(bus => {
            bus.capacity = bus.capPct > 75 ? 'High' : (bus.capPct > 45 ? 'Moderate' : 'Low');
            bus.color = bus.capPct > 75 ? 'danger' : (bus.capPct > 45 ? 'warning' : 'success');
            
            // Next stop logic
            const nextStop = bus.stops.length > 1 ? bus.stops[1] : 'Terminal';
            const predText = bus.capPct > 70 ? '+5 Boarding (High)' : (bus.capPct > 40 ? '+2 Boarding' : '-3 Alighting');
            const predColor = bus.capPct > 70 ? 'text-red' : (bus.capPct > 40 ? 'text-yellow' : 'text-green');
            
            // Pass stops as JSON string to the selectBus function
            const stopsJson = encodeURIComponent(JSON.stringify(bus.stops));
            
            const html = `
                <div class="bus-item advanced-card" onclick="app.selectBus(this, '${bus.id}', '${bus.route}', '${bus.name}', ${bus.capPct}, '${bus.type}', '${stopsJson}')">
                    <div class="card-row-top">
                        <div class="d-flex align-items-center" style="gap:12px;">
                            <div class="route-badge badge-blue">${bus.route}</div>
                            <div class="route-headers">
                                <h4>${bus.name.replace('-', '→')}</h4>
                                <span class="bus-type-tag">${bus.type}</span>
                            </div>
                        </div>
                        <div class="eta-box text-blue">
                            <strong>${bus.time}</strong>
                            <span>Away</span>
                        </div>
                    </div>
                    <div class="card-row-bottom">
                        <div class="next-stop-box">
                            <i class="fa-solid fa-location-dot text-gray"></i> Next: <strong>${nextStop}</strong>
                        </div>
                        <div class="crowd-status-box">
                            <span class="status-pill pill-${bus.color === 'danger' ? 'red' : bus.color === 'warning' ? 'yellow' : 'green'}">${bus.capacity} (${bus.capPct}%)</span>
                            <span class="pred-indicator ${predColor}">${predText}</span>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += html;
        });

        document.getElementById('bus-results').classList.remove('hidden');
        }, 1200); // Simulated network delay
    },

    selectBus(element, id, route, name, capPct, type, stopsEncoded) {
        // Highlight selection
        document.querySelectorAll('.bus-item').forEach(item => item.classList.remove('selected'));
        if(element) element.classList.add('selected');

        document.getElementById('live-tracking').classList.add('hidden');
        document.getElementById('search-loader-text').innerText = 'Syncing real-time ETM and GPS data...';
        document.getElementById('search-loader').classList.remove('hidden');
        document.getElementById('search-loader').scrollIntoView({ behavior: 'smooth' });

        setTimeout(() => {
            document.getElementById('search-loader').classList.add('hidden');

            // Populate basic headers
            document.getElementById('track-route').innerText = route;
            
            let favs = JSON.parse(localStorage.getItem('tp_favorites') || '[]');
            const isFav = favs.some(f => f.route === route);
            const starClass = isFav ? 'fa-solid text-yellow' : 'fa-regular';
            
            document.getElementById('track-desc').innerHTML = `${name} | ${type} <i class="${starClass} fa-star action-icon" onclick="app.toggleFavorite('${route}', '${name}'); this.classList.toggle('fa-solid'); this.classList.toggle('fa-regular'); this.classList.toggle('text-yellow'); event.stopPropagation();" title="Favorite this route" style="cursor:pointer; font-size:18px; vertical-align:middle; margin-left:8px;"></i>`;
        
        // Initialize Live Passenger Data
        const totalSeats = 52;
        let onboard = Math.round(totalSeats * (capPct / 100));
        document.getElementById('track-onboard').innerText = onboard;
        app.updatePassengerData();

        // Simulate continuous real-time boarding/alighting every 60 seconds
        if(app.paxInterval) clearInterval(app.paxInterval);
        app.paxInterval = setInterval(() => {
            app.updatePassengerData();
        }, 60000);

        // Decode accurate stops for this route
        const stops = JSON.parse(decodeURIComponent(stopsEncoded));
        
        // Pick a current stop index (somewhere in the first half)
        const currentIdx = Math.max(0, Math.floor(stops.length / 3));
        const nextStop = stops.length > currentIdx + 1 ? stops[currentIdx + 1] : stops[stops.length - 1];

        // Update Stops Timeline
        const flowStops = document.getElementById('stops-list-vertical');
        let stopsHtml = '';
        stops.forEach((stop, idx) => {
            let dotCls = 'future';
            let nameColor = 'var(--text-main)';
            let paxText = '';
            let tagHtml = '';
            
            if (idx < currentIdx) {
                dotCls = 'passed';
                nameColor = 'var(--text-muted)';
                paxText = Math.max(5, onboard - (currentIdx - idx) * 8) + ' pax';
            } else if (idx === currentIdx) {
                dotCls = 'current';
                nameColor = 'var(--primary)';
                paxText = onboard + ' pax now';
                tagHtml = '<span class="v-stop-tag current-bus">BUS HERE</span>';
            } else if (idx === currentIdx + 1) {
                tagHtml = '<span class="v-stop-tag predict">PREDICTED</span>';
            }
            
            stopsHtml += `<div class="v-stop-item">
                <div class="v-stop-dot ${dotCls}"></div>
                <div class="v-stop-info">
                    <div class="v-stop-name" style="color:${nameColor}">${stop}</div>
                    <div class="v-stop-meta">${paxText ? `<span class="v-stop-pax">${paxText}</span>` : ''} ${tagHtml}</div>
                </div>
            </div>`;
        });
        flowStops.innerHTML = stopsHtml;

        // --- LEAFLET MAP & ANIMATION ---
        const coordMap = {
            'Secunderabad': [17.4399, 78.4983], 'Ameerpet': [17.4375, 78.4482],
            'Jubilee Hills': [17.4310, 78.4080], 'Kondapur': [17.4622, 78.3568],
            'Begumpet': [17.4447, 78.4664], 'Punjagutta': [17.4265, 78.4511],
            'Koti': [17.3850, 78.4867], 'Dilsukhnagar': [17.3688, 78.5247],
            'Patancheru': [17.5287, 78.2667], 'BHEL': [17.5100, 78.2982],
            'Kukatpally': [17.4849, 78.4080], 'Madhapur': [17.4483, 78.3915],
            'Lingampally': [17.4856, 78.3188], 'Uppal': [17.4018, 78.5602],
            'Tarnaka': [17.4283, 78.5372], 'Sanath Nagar': [17.4582, 78.4404],
            'ESI': [17.4435, 78.4392], 'Banjara Hills': [17.4143, 78.4326],
            'Mehdipatnam': [17.3934, 78.4334], 'Afzalgunj': [17.3770, 78.4812],
            'High Court': [17.3682, 78.4735], 'Attapur': [17.3653, 78.4282],
            'Rajendra Nagar': [17.3197, 78.4035], 'Tank Bund': [17.4239, 78.4738],
            'Lakdikapul': [17.4042, 78.4616], 'Masab Tank': [17.3963, 78.4496],
            'Balanagar': [17.4658, 78.4443], 'LB Nagar': [17.3457, 78.5522],
            'Hayathnagar': [17.3204, 78.6017], 'Transit Hub': [17.4000, 78.4500],
            // New Real World Stops
            'Survey of India': [17.4050, 78.5550], 'Habsiguda': [17.4080, 78.5450],
            'Mettuguda': [17.4330, 78.5250], 'Alugadda Bavi': [17.4360, 78.5100],
            'Patny': [17.4420, 78.4900], 'Paradise': [17.4440, 78.4850],
            'SR Nagar': [17.4400, 78.4440], 'Erragadda': [17.4470, 78.4350],
            'Bharat Nagar': [17.4560, 78.4280], 'Moosapet': [17.4650, 78.4200],
            'KPHB': [17.4950, 78.3950], 'JNTU': [17.4970, 78.3880],
            'Miyapur': [17.4950, 78.3650], 'Madinaguda': [17.4940, 78.3450],
            'Chandanagar': [17.4920, 78.3300], 'Muthangi': [17.5350, 78.2500],
            'RC Puram': [17.5180, 78.2800], 'Khairatabad': [17.4110, 78.4590],
            'Assembly': [17.3980, 78.4680], 'Abids': [17.3910, 78.4750],
            'Chaderghat': [17.3800, 78.4920], 'Malakpet': [17.3750, 78.5050],
            'Madhura Nagar': [17.4350, 78.4400], 'Yousufguda': [17.4330, 78.4250],
            'Peddamma Temple': [17.4270, 78.4030], 'Hitec City': [17.4470, 78.3750],
            'Czech Colony': [17.4520, 78.4380], 'City College': [17.3700, 78.4750],
            'Zoo Park': [17.3550, 78.4500], 'Hyderguda': [17.3350, 78.4200],
            'Gandhi Hospital': [17.4250, 78.5000], 'Musheerabad': [17.4150, 78.4950],
            'Secretariat': [17.4100, 78.4700], 'Bowenpally': [17.4650, 78.4800],
            'Tadbund': [17.4600, 78.4850], 'Rathifile Bus Station': [17.4350, 78.5020],
            'Nagole': [17.3850, 78.5600], 'Kothapet': [17.3650, 78.5450],
            'Panama Godowns': [17.3350, 78.5750]
        };

        const mapContainer = document.getElementById('bus-map');
        if (app.mapInstance) {
            app.mapInstance.remove();
        }
        
        // Initialize Map
        const pathCoords = stops.map(s => coordMap[s] || [17.4 + Math.random()*0.1, 78.4 + Math.random()*0.1]);
        app.mapInstance = L.map('bus-map').setView(pathCoords[Math.floor(pathCoords.length/2)], 12);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(app.mapInstance);
        
        // Draw Route Line
        const routeLine = L.polyline(pathCoords, {color: '#0052CC', weight: 5, opacity: 0.8}).addTo(app.mapInstance);
        app.mapInstance.fitBounds(routeLine.getBounds(), {padding: [30, 30]});
        
        // Draw Stop Markers
        stops.forEach((s, i) => {
            L.circleMarker(pathCoords[i], {radius: 6, fillColor: i < currentIdx ? '#6b7280' : '#ffffff', color: '#0052CC', weight: 2, fillOpacity: 1}).addTo(app.mapInstance).bindPopup(s);
        });
        
        // Create Moving Bus Animation (Realistic GPS Simulation)
        const busIcon = L.divIcon({
            html: '<div style="font-size:24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4)); transition: all 1s ease-out;">🚌</div>',
            className: 'moving-bus-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
        
        // Place bus near the "Current Stop" mathematically
        const cPos = pathCoords[currentIdx];
        const nPos = pathCoords[Math.min(currentIdx + 1, pathCoords.length - 1)];
        
        let segmentProgress = 0.15; // Bus is currently 15% on its way to the next stop
        let initialLat = cPos[0] + (nPos[0] - cPos[0]) * segmentProgress;
        let initialLng = cPos[1] + (nPos[1] - cPos[1]) * segmentProgress;
        
        const busMarker = L.marker([initialLat, initialLng], {icon: busIcon}).addTo(app.mapInstance);
        
        // Simulate live GPS ping every 3 seconds moving very slowly in real-time
        if(app.moveInterval) clearInterval(app.moveInterval);
        app.moveInterval = setInterval(() => {
            segmentProgress += 0.008; // Very slow, realistic movement
            
            // If it reached the next stop, just hold it there for realistic simulation
            if (segmentProgress >= 1) segmentProgress = 1; 
            
            const lat = cPos[0] + (nPos[0] - cPos[0]) * segmentProgress;
            const lng = cPos[1] + (nPos[1] - cPos[1]) * segmentProgress;
            
            // Set new position
            busMarker.setLatLng([lat, lng]);
        }, 3000);

        // Prediction Section
        const trend = capPct > 60 ? (Math.random() * 15) : (Math.random() * 10 - 5);
        let predPax = Math.max(0, Math.min(totalSeats, Math.round(onboard + trend)));
        let predPct = Math.round((predPax / totalSeats) * 100);
        
        document.getElementById('track-pred').innerText = nextStop;
        
        const pb = document.getElementById('pred-bar');
        pb.style.background = predPct > 70 ? 'linear-gradient(90deg, var(--danger), #ff8888)' : (predPct > 40 ? 'var(--warning)' : 'var(--success)');
        setTimeout(() => { pb.style.width = predPct + '%'; }, 100);
        
        document.getElementById('pred-text').innerText = predPct > 70 ? 'CROWDED' : (predPct > 40 ? 'MODERATE' : 'LOW CROWD');
        document.getElementById('pred-text').style.color = predPct > 70 ? 'var(--danger)' : (predPct > 40 ? 'var(--warning)' : 'var(--success)');
        document.getElementById('pred-pax').innerText = predPax;
        
        // Confidence score
        const conf = Math.floor(75 + Math.random() * 20);
        const filled = Math.round(conf / 20);
        let dotsHtml = '';
        for (let i = 0; i < 5; i++) dotsHtml += `<div class="conf-dot ${i < filled ? 'filled' : ''}"></div>`;
        document.getElementById('conf-dots').innerHTML = dotsHtml;
        document.getElementById('conf-pct').innerText = conf + '%';
        
        // ETM Table
        let etmHtml = '';
        const recentStops = stops.length > 2 ? [stops[0], stops[1]] : [stops[0]];
        recentStops.forEach((stop, idx) => {
            const b = Math.floor(Math.random() * 12 + 2);
            const d = Math.floor(Math.random() * 8 + 1);
            const t = b + Math.floor(Math.random() * 4);
            const l = Math.min(100, Math.floor(capPct * (0.8 + Math.random()*0.4)));
            const lc = l > 70 ? 'var(--danger)' : (l > 40 ? 'var(--warning)' : 'var(--success)');
            etmHtml += `<tr>
                <td>${stop}</td>
                <td style="color:var(--success)">+${b}</td>
                <td style="color:var(--text-muted)">-${d}</td>
                <td style="color:var(--primary); font-weight:bold;">${t}</td>
                <td><span style="color:${lc};font-weight:700">${l}%</span></td>
            </tr>`;
        });
        document.getElementById('etm-tbody').innerHTML = etmHtml;

        document.getElementById('live-tracking').classList.remove('hidden');
        
            // Scroll to tracking
            document.getElementById('live-tracking').scrollIntoView({ behavior: 'smooth' });
            
            // Fix Leaflet sizing issue by invalidating size after the container is visible
            setTimeout(() => {
                if (app.mapInstance) {
                    app.mapInstance.invalidateSize();
                    app.mapInstance.fitBounds(L.polyline(pathCoords).getBounds(), {padding: [30, 30]});
                }
            }, 300);

            // Save to History if logged in
            if (this.state.isLoggedIn) {
                const history = JSON.parse(localStorage.getItem('tp_history') || '[]');
                const start = document.getElementById('start-point').value;
                const end = document.getElementById('end-point').value;
                const now = new Date();
                
                history.unshift({
                    src: start,
                    dest: end,
                    date: now.toLocaleDateString(),
                    time: now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    crowd: capPct > 70 ? 'High' : (capPct > 40 ? 'Moderate' : 'Low'),
                    color: capPct > 70 ? 'red' : (capPct > 40 ? 'yellow' : 'green')
                });
                
                // Keep last 10
                if(history.length > 10) history.pop();
                localStorage.setItem('tp_history', JSON.stringify(history));
                app.saveToDB('tp_history', history);
                
                // Clear current table to force refresh next time
                document.getElementById('history-table-body').innerHTML = '';
            }
        }, 1500); // 1.5s simulated ETM sync
    },

    refreshTracking(btnElement) {
        const icon = btnElement ? btnElement.querySelector('i') : document.querySelector('#refresh-btn i');
        if(icon) icon.classList.add('fa-spin');
        setTimeout(() => {
            if(icon) icon.classList.remove('fa-spin');
            
            // Force a manual data refresh immediately
            this.updatePassengerData();
            
            // Randomize prediction slightly to simulate live update
            const preds = ["+4 Boarding", "-1 Alighting", "+12 Boarding", "No Change"];
            document.getElementById('track-pred').innerText = preds[Math.floor(Math.random() * preds.length)];
        }, 1000);
    },

    updatePassengerData() {
        const totalSeats = 52;
        // Get current onboard from UI
        let onboard = parseInt(document.getElementById('track-onboard').innerText);
        if (isNaN(onboard)) onboard = 30;
        
        // Randomly simulate entries/exits (-3 to +4 passengers)
        const change = Math.floor(Math.random() * 8) - 3; 
        onboard = Math.max(0, Math.min(totalSeats + 15, onboard + change)); // Allow some standees
        
        const available = Math.max(0, totalSeats - onboard);
        const adults = Math.floor(onboard * (0.7 + Math.random() * 0.2));
        const kids = onboard - adults;
        const tickets = onboard + Math.floor(Math.random() * 6);

        // Update Stats Grid
        document.getElementById('track-seats').innerText = totalSeats;
        
        const availEl = document.getElementById('track-avail');
        availEl.innerText = available > 0 ? available : 'FULL';
        availEl.style.color = available > 0 ? 'var(--success)' : 'var(--danger)';
        document.getElementById('d-avail-sub').innerText = available > 0 ? 'seats free' : 'no seats available';
        
        const onboardEl = document.getElementById('track-onboard');
        onboardEl.innerText = onboard;
        onboardEl.style.color = onboard > 40 ? 'var(--danger)' : (onboard > 20 ? 'var(--warning)' : 'var(--success)');
        
        document.getElementById('d-adults').innerText = adults;
        document.getElementById('d-children').innerText = kids;
        document.getElementById('d-tickets').innerText = tickets;
        
        // Add a quick pulse animation to show it updated
        onboardEl.style.animation = 'none';
        setTimeout(() => onboardEl.style.animation = 'pulse 1s', 50);
    },

    // --- History Logic ---
    populateHistory() {
        const tbody = document.getElementById('history-table-body');
        if (tbody.children.length > 0 && tbody.innerHTML.trim() !== '') return; // Already populated

        let historyData = JSON.parse(localStorage.getItem('tp_history') || '[]');
        
        if (historyData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No recent travel history.</td></tr>';
            return;
        }

        let html = '';
        historyData.forEach(item => {
            html += `
                <tr>
                    <td><i class="fa-solid fa-location-dot text-blue"></i> ${item.src}</td>
                    <td><i class="fa-solid fa-location-arrow text-gray"></i> ${item.dest}</td>
                    <td>
                        <div>${item.date}</div>
                        <div style="font-size: 0.7rem; color: var(--text-muted);">${item.time}</div>
                    </td>
                    <td><span class="status-pill pill-${item.color}"><i class="fa-solid fa-circle" style="font-size:0.5rem; margin-right:4px;"></i> ${item.crowd}</span></td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    },

    toggleFavorite(route, dest) {
        if (!this.state.isLoggedIn) {
            this.showLogin();
            return;
        }
        let favs = JSON.parse(localStorage.getItem('tp_favorites') || '[]');
        const idx = favs.findIndex(f => f.route === route);
        if (idx >= 0) {
            favs.splice(idx, 1);
        } else {
            favs.push({ route, dest });
        }
        localStorage.setItem('tp_favorites', JSON.stringify(favs));
        this.saveToDB('tp_favorites', favs);
        this.renderFavorites();
    },

    renderFavorites() {
        const favs = JSON.parse(localStorage.getItem('tp_favorites') || '[]');
        const container = document.getElementById('favorites-container');
        if (!container) return;

        if (favs.length === 0) {
            container.innerHTML = '<p class="text-muted" style="width: 100%; text-align: center; padding: 20px;">No favorite routes yet. Click the star icon on a bus route to save it here!</p>';
            return;
        }

        let html = '';
        favs.forEach(f => {
            html += `
                <div class="route-card" onclick="app.startJourneyFlow('${f.route}')" style="cursor:pointer;">
                    <div class="card-header">
                        <div class="route-badge badge-blue">${f.route}</div>
                        <div class="route-info">
                            <h4>Route ${f.route}</h4>
                            <p>${f.dest}</p>
                        </div>
                        <i class="fa-solid fa-star star-active text-yellow"></i>
                    </div>
                    <div class="card-footer">
                        <span class="crowd-tag tag-low"><i class="fa-solid fa-users"></i> Saved Route</span>
                        <div class="next-bus">
                            <span>Track</span>
                            <strong>View</strong>
                        </div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    },

    // --- Topbar Logic ---
    toggleLangMenu() {
        const menu = document.getElementById('lang-menu');
        menu.classList.toggle('hidden');
    },

    changeLanguage(lang) {
        this.state.language = lang;
        const btn = document.querySelector('.language-selector .icon-btn');
        btn.innerHTML = `<i class="fa-solid fa-language"></i> ${lang}`;
        document.getElementById('lang-menu').classList.add('hidden');
        
        // Simulate translation effect
        const title = document.getElementById('page-title');
        const origText = title.innerText;
        title.style.opacity = '0';
        setTimeout(() => {
            if (lang === 'ES') title.innerText = 'TránsitoPulse';
            else if (lang === 'FR') title.innerText = 'TransitImpulsion';
            else title.innerText = origText === 'TransitPulse' || origText === 'TránsitoPulse' || origText === 'TransitImpulsion' ? 'TransitPulse' : origText;
            title.style.opacity = '1';
        }, 300);
    },

    // --- Settings / Theme / Profile Logic ---
    toggleEditProfile() {
        const display = document.getElementById('profile-display');
        const form = document.getElementById('profile-edit-form');
        
        if (form.classList.contains('hidden')) {
            // Opening form
            document.getElementById('edit-name').value = document.getElementById('profile-name').innerText;
            document.getElementById('edit-email').value = document.getElementById('profile-email').innerText;
            display.classList.add('hidden');
            form.classList.remove('hidden');
        } else {
            // Closing form
            display.classList.remove('hidden');
            form.classList.add('hidden');
        }
    },

    saveProfile() {
        const newName = document.getElementById('edit-name').value;
        const newEmail = document.getElementById('edit-email').value;
        
        if (!newName || !newEmail) return;
        
        const user = { name: newName, email: newEmail };
        localStorage.setItem('tp_user', JSON.stringify(user));
        
        this.applyAuthState();
        this.toggleEditProfile();
    },

    setTheme(themeName) {
        this.state.theme = themeName;
        document.documentElement.setAttribute('data-theme', themeName);
        
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.innerText.toLowerCase().includes(themeName)) {
                btn.classList.add('active');
            }
        });
    },

    // --- Chatbot Logic ---
    setupChatbot() {
        // Nothing specific needed on load, handled via HTML onclicks
    },

    toggleChatbot() {
        const container = document.getElementById('chatbot-container');
        container.classList.toggle('chatbot-hidden');
    },

    handleChatKeyPress(e) {
        if (e.key === 'Enter') {
            this.sendChatMessageFromInput();
        }
    },

    sendChatMessageFromInput() {
        const input = document.getElementById('chat-input');
        const msg = input.value.trim();
        if (msg) {
            this.sendChatMessage(msg);
            input.value = '';
        }
    },

    sendChatMessage(text) {
        const chatWindow = document.getElementById('chat-messages');
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // User message
        chatWindow.innerHTML += `
            <div class="message user">
                <div class="msg-bubble">${text}</div>
                <span class="msg-time">${time}</span>
            </div>
        `;

        // Scroll to bottom
        chatWindow.scrollTop = chatWindow.scrollHeight;

        // Add a temporary loading message
        const loadingId = 'loading-' + Date.now();
        chatWindow.innerHTML += `
            <div class="message bot" id="${loadingId}">
                <div class="msg-bubble"><i class="fa-solid fa-circle-notch fa-spin"></i> Thinking...</div>
            </div>
        `;
        chatWindow.scrollTop = chatWindow.scrollHeight;

        // Simulate network delay
        setTimeout(() => {
            // Remove loading
            const loadingEl = document.getElementById(loadingId);
            if (loadingEl) loadingEl.remove();

            // Simple bot logic
            const lowerText = text.toLowerCase();
            
            if (lowerText.includes('who developed') || lowerText.includes('developer') || lowerText.includes('who made') || lowerText.includes('creator')) {
                this.insertBotHtml(`<div class="msg-bubble">This project was developed by K. Pranay Raj and K. Pavan Sai.</div>`);
            } else if (lowerText.includes('guide') || lowerText.includes('mentor')) {
                this.insertBotHtml(`<div class="msg-bubble">The guide and mentor for this project is Veeresh, Assistant Professor.</div>`);
            } else if (lowerText.includes('218')) {
                this.insertBotHtml(`
                    <div class="msg-bubble">
                        The 218 bus currently has a <strong>moderate crowd level</strong> (around 65% capacity). The next one arrives in <strong>4 minutes</strong>.
                    </div>
                    <div class="msg-widget">
                        <div class="widget-icon"><i class="fa-solid fa-bus"></i></div>
                        <div class="widget-info">
                            <span class="w-route">ROUTE 218</span>
                            <span class="w-dest">Koti</span>
                        </div>
                        <div class="widget-stats">
                            <span class="w-cap text-yellow">• 65% Capacity</span>
                            <span class="w-time">4m</span>
                        </div>
                    </div>
                `);
            } else if (lowerText.includes('fastest')) {
                 this.insertBotHtml(`<div class="msg-bubble">The fastest way to Koti right now is the <strong>Route 218</strong>. It has moderate crowding and arrives in 2 mins.</div>`);
            } else if (lowerText.match(/^(hi|hello|hey|hii|good morning|good evening|good afternoon|hola)(\\s.*)?$/)) {
                this.typeBotResponse("Hello! I'm TransitPulse AI. I can help you track buses, check crowd levels, and plan your journey. How can I assist you today?");
            } else if (lowerText.includes('how are you')) {
                this.typeBotResponse("I'm doing great, thank you! I'm ready to help you navigate your transit journey. How can I help?");
            } else if (lowerText.includes('thank')) {
                this.typeBotResponse("You're very welcome! If you need any more help with bus routes or tracking, just ask.");
            } else if (lowerText.includes('bus') || lowerText.includes('route') || lowerText.includes('track') || lowerText.includes('crowd') || lowerText.includes('plan')) {
                this.typeBotResponse("I can help with that! You can use the 'Plan Journey' section to track specific routes and see live crowd predictions. Alternatively, ask me about a specific route (like '218').");
            } else {
                this.typeBotResponse("I'm not quite sure about that. I am an AI designed specifically to help you with TransitPulse—like tracking buses, checking crowd predictions, and finding routes. Try asking me about a bus route!");
            }
        }, 800);
    },

    insertBotHtml(htmlContent) {
        const chatWindow = document.getElementById('chat-messages');
        chatWindow.innerHTML += `
            <div class="message bot">
                ${htmlContent}
                <span class="msg-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
        `;
        chatWindow.scrollTop = chatWindow.scrollHeight;
    },

    typeBotResponse(textToType) {
        const chatWindow = document.getElementById('chat-messages');
        const msgId = 'msg-' + Date.now();
        
        chatWindow.innerHTML += `
            <div class="message bot">
                <div class="msg-bubble" id="${msgId}"></div>
                <span class="msg-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
        `;
        chatWindow.scrollTop = chatWindow.scrollHeight;
        
        const bubble = document.getElementById(msgId);
        let i = 0;
        const interval = setInterval(() => {
            bubble.innerHTML += textToType.charAt(i);
            i++;
            chatWindow.scrollTop = chatWindow.scrollHeight;
            if (i >= textToType.length) {
                clearInterval(interval);
            }
        }, 20); // typing speed
    }
};

// Close dropdowns if clicked outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.language-selector')) {
        document.getElementById('lang-menu').classList.add('hidden');
    }
});

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
