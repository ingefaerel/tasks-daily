#!/bin/bash

# Navigate to the frontend directory and run `npm start` in the background
echo "Starting frontend React app..."
cd ~/Documents/TasksDaily/FRontend 
npm start &  # Run the frontend server in the background

# Navigate to the backend directory and run `node server.js`
echo "Starting backend server..."
cd ~/Documents/TasksDaily/Backend
node server.js  # Start the backend server

