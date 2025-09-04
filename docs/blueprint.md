# **App Name**: AquaGuard Dashboard

## Core Features:

- Water Quality Display: Display real-time data from the water quality monitoring system (temperature and TDS) from the ESP32 in a clear, concise format.
- Security Status Display: Display the security status (motion detection and day/night mode) from the ESP32-CAM.
- Environmental Data: Light level data received from the ESP32-CAM
- Alerting System: Provide visual alerts in the dashboard when water quality parameters are out of range (temperature too high/low, TDS too high) or when motion is detected at night. Use a tool for determining alert severity based on a number of factors.
- Historical Data Logging: Log historical sensor data from both systems in Firebase Realtime Database and display them using interactive charts, offering a tool to decide on visualization parameters for displaying data in a suitable timescale.
- Image Display: Display recent images captured by the ESP32-CAM, pulled from Firebase Storage, to confirm motion alerts.
- Modular Data Streams: Receive and display data from two separate data streams (ESP32 and ESP32-CAM) within the same dashboard.

## Style Guidelines:

- Primary color: Sky blue (#87CEEB), reflecting the aquatic environment.
- Background color: Light gray (#F0F0F0), provides a clean and neutral backdrop for the data visualizations.
- Accent color: Orange (#FFA500) for alerts and important actions to grab user attention.
- Body and headline font: 'PT Sans' (sans-serif), to offer a balance of modernity and approachability, and suits both headers and body text
- Use simple, clear icons for water quality parameters and security status, following a consistent style.
- Divide the dashboard into clear sections for water quality data, security status, and historical data, each with appropriate visualizations.
- Use subtle transitions and animations when data updates to provide a dynamic, real-time feel without being distracting.