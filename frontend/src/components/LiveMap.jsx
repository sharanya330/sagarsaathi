import React, { useEffect, useState, useRef } from 'react';
import '../styles/LiveMap.css';

const LiveMap = ({ trips = [], drivers = [], center = null }) => {
    const [map, setMap] = useState(null);
    const [markers, setMarkers] = useState([]);
    const mapRef = useRef(null);
    const googleMapsLoaded = useRef(false);

    useEffect(() => {
        // Load Google Maps API
        if (!window.google && !googleMapsLoaded.current) {
            googleMapsLoaded.current = true;
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`;
            script.async = true;
            script.defer = true;
            script.onload = initializeMap;
            document.head.appendChild(script);
        } else if (window.google) {
            initializeMap();
        }
    }, []);

    const initializeMap = () => {
        if (!mapRef.current || !window.google) return;

        const defaultCenter = center || { lat: 28.6139, lng: 77.2090 }; // Delhi default
        const mapInstance = new window.google.maps.Map(mapRef.current, {
            center: defaultCenter,
            zoom: 12,
            styles: [
                {
                    featureType: 'poi',
                    elementType: 'labels',
                    stylers: [{ visibility: 'off' }]
                }
            ]
        });

        setMap(mapInstance);
    };

    useEffect(() => {
        if (!map || !window.google) return;

        // Clear existing markers
        markers.forEach(marker => marker.setMap(null));
        const newMarkers = [];

        // Add driver markers
        drivers.forEach(driver => {
            if (driver.location?.coordinates) {
                const [lng, lat] = driver.location.coordinates;
                const marker = new window.google.maps.Marker({
                    position: { lat, lng },
                    map: map,
                    title: driver.name,
                    icon: {
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: '#4CAF50',
                        fillOpacity: 1,
                        strokeColor: '#fff',
                        strokeWeight: 2
                    },
                    label: {
                        text: driver.vehicleType?.substring(0, 1) || 'D',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 'bold'
                    }
                });

                const infoWindow = new window.google.maps.InfoWindow({
                    content: `
                        <div style="padding: 10px;">
                            <h3 style="margin: 0 0 8px 0;">${driver.name}</h3>
                            <p style="margin: 4px 0;"><strong>Vehicle:</strong> ${driver.vehicleType || 'N/A'}</p>
                            <p style="margin: 4px 0;"><strong>Status:</strong> ${driver.isActive ? 'Active' : 'Offline'}</p>
                            <p style="margin: 4px 0; font-size: 11px; color: #666;">
                                Updated: ${driver.lastUpdated ? new Date(driver.lastUpdated).toLocaleTimeString() : 'N/A'}
                            </p>
                        </div>
                    `
                });

                marker.addListener('click', () => {
                    infoWindow.open(map, marker);
                });

                newMarkers.push(marker);
            }
        });

        // Add trip route markers
        trips.forEach(trip => {
            // Pickup marker
            if (trip.pickUpLocation?.coords?.coordinates) {
                const [lng, lat] = trip.pickUpLocation.coords.coordinates;
                const pickupMarker = new window.google.maps.Marker({
                    position: { lat, lng },
                    map: map,
                    title: 'Pickup: ' + trip.pickUpLocation.name,
                    icon: {
                        url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                    }
                });
                newMarkers.push(pickupMarker);
            }

            // Dropoff marker
            if (trip.dropOffLocation?.coords?.coordinates) {
                const [lng, lat] = trip.dropOffLocation.coords.coordinates;
                const dropoffMarker = new window.google.maps.Marker({
                    position: { lat, lng },
                    map: map,
                    title: 'Dropoff: ' + trip.dropOffLocation.name,
                    icon: {
                        url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                    }
                });
                newMarkers.push(dropoffMarker);
            }

            // Draw route polyline if location history exists
            if (trip.locationHistory && trip.locationHistory.length > 0) {
                const path = trip.locationHistory.map(loc => ({
                    lat: loc.coords.coordinates[1],
                    lng: loc.coords.coordinates[0]
                }));

                const polyline = new window.google.maps.Polyline({
                    path: path,
                    geodesic: true,
                    strokeColor: '#2196F3',
                    strokeOpacity: 0.8,
                    strokeWeight: 3
                });
                polyline.setMap(map);
            }

            // Current driver location for this trip
            if (trip.driver?.location?.coordinates) {
                const [lng, lat] = trip.driver.location.coordinates;
                const driverMarker = new window.google.maps.Marker({
                    position: { lat, lng },
                    map: map,
                    title: `Driver: ${trip.driver.name}`,
                    icon: {
                        path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        scale: 5,
                        fillColor: '#FF5722',
                        fillOpacity: 1,
                        strokeColor: '#fff',
                        strokeWeight: 2
                    }
                });

                const tripInfoWindow = new window.google.maps.InfoWindow({
                    content: `
                        <div style="padding: 10px;">
                            <h3 style="margin: 0 0 8px 0;">Active Trip</h3>
                            <p style="margin: 4px 0;"><strong>Driver:</strong> ${trip.driver.name}</p>
                            <p style="margin: 4px 0;"><strong>Vehicle:</strong> ${trip.driver.vehicleType || 'N/A'}</p>
                            <p style="margin: 4px 0;"><strong>Status:</strong> ${trip.status}</p>
                            <p style="margin: 4px 0;"><strong>From:</strong> ${trip.pickUpLocation.name}</p>
                            <p style="margin: 4px 0;"><strong>To:</strong> ${trip.dropOffLocation.name}</p>
                        </div>
                    `
                });

                driverMarker.addListener('click', () => {
                    tripInfoWindow.open(map, driverMarker);
                });

                newMarkers.push(driverMarker);
            }
        });

        setMarkers(newMarkers);

        // Auto-fit bounds if markers exist
        if (newMarkers.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            newMarkers.forEach(marker => {
                if (marker.getPosition()) {
                    bounds.extend(marker.getPosition());
                }
            });
            map.fitBounds(bounds);
        }
    }, [map, trips, drivers]);

    return (
        <div className="live-map-container">
            <div ref={mapRef} className="map-canvas" style={{ width: '100%', height: '100%' }} />
            {!window.google && (
                <div className="map-loading">
                    <p>Loading map...</p>
                </div>
            )}
        </div>
    );
};

export default LiveMap;
