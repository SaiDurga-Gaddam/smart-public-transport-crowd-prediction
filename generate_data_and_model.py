import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import pickle
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import os

print("Generating 1-Year ETM Dataset...")

# Hyderabad specific routes and stops
routes = ['218', '10H', '49M', '5K', '127K', 'Pushpak']
stops = ['Secunderabad', 'Ameerpet', 'Hitec City', 'Mehdipatnam', 'Koti', 'Uppal', 'Gachibowli', 'Kukatpally', 'Patancheru', 'LB Nagar']
weather_conditions = ['Sunny', 'Rainy', 'Cloudy']
day_types = ['Weekday', 'Weekend', 'Holiday']

data = []
start_date = datetime.now() - timedelta(days=365)

# Generate approx 5000 random records across the year
for i in range(5000):
    dt = start_date + timedelta(days=random.randint(0, 365), hours=random.randint(5, 23), minutes=random.randint(0, 59))
    route = random.choice(routes)
    stop = random.choice(stops)
    weather = random.choice(weather_conditions)
    
    # Determine day type
    if dt.weekday() >= 5:
        day_type = 'Weekend'
    else:
        day_type = 'Weekday'
        
    hour = dt.hour
    is_peak = 1 if (8 <= hour <= 11) or (17 <= hour <= 21) else 0
    
    # Base passengers logic
    base_passengers = random.randint(10, 40)
    if is_peak: base_passengers += random.randint(20, 50)
    if weather == 'Rainy': base_passengers += random.randint(5, 15)
    
    # Cap at 100 max for a bus
    passengers = min(100, base_passengers)
    
    data.append({
        'timestamp': dt,
        'route': route,
        'stop': stop,
        'weather': weather,
        'day_type': day_type,
        'hour': hour,
        'is_peak': is_peak,
        'passengers': passengers
    })

df = pd.DataFrame(data)
df.to_csv('etm_dataset.csv', index=False)
print(f"Dataset generated with {len(df)} rows. Saved to etm_dataset.csv")

print("Training Machine Learning Model...")
# Preprocessing for ML
# We will predict passengers based on route, hour, is_peak, day_type
le_route = LabelEncoder()
df['route_encoded'] = le_route.fit_transform(df['route'])

le_day = LabelEncoder()
df['day_encoded'] = le_day.fit_transform(df['day_type'])

features = ['route_encoded', 'hour', 'is_peak', 'day_encoded']
X = df[features]
y = df['passengers']

model = RandomForestRegressor(n_estimators=50, random_state=42)
model.fit(X, y)

print("Model trained successfully.")

# Save model and encoders
with open('model.pkl', 'wb') as f:
    pickle.dump({
        'model': model,
        'le_route': le_route,
        'le_day': le_day
    }, f)
print("Model saved to model.pkl")
