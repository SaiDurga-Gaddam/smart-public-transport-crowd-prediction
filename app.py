from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import pickle
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

# Database Setup
def init_db():
    conn = sqlite3.connect('transit.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)''')
    c.execute('''CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY, user_id INTEGER, src TEXT, dest TEXT, date TEXT, crowd TEXT)''')
    conn.commit()
    conn.close()

init_db()

# Load ML Model
model_data = None
if os.path.exists('model.pkl'):
    with open('model.pkl', 'rb') as f:
        model_data = pickle.load(f)

@app.route('/api/predict_buses', methods=['POST'])
def predict_buses():
    data = request.json
    hour = data.get('hour', 12)
    is_peak = data.get('is_peak', 0)
    day_type = data.get('day_type', 'Weekday')
    
    if not model_data:
        return jsonify({"error": "Model not trained yet."}), 500
        
    model = model_data['model']
    le_route = model_data['le_route']
    le_day = model_data['le_day']
    
    day_encoded = le_day.transform([day_type])[0]
    
    predictions = []
    # Test for a few routes
    for route in ['218', '10H', '49M']:
        if route in le_route.classes_:
            route_encoded = le_route.transform([route])[0]
            pred = model.predict([[route_encoded, hour, is_peak, day_encoded]])[0]
            predictions.append({"route": route, "predicted_passengers": int(pred)})
            
    return jsonify(predictions)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
