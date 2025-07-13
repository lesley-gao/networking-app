import React, { useState, useEffect } from 'react';

const renderForecastsTable = (forecasts) => {
  return (
    <table className='table table-striped'>
      <thead>
        <tr>
          <th>Date</th>
          <th>Temp. (C)</th>
          <th>Temp. (F)</th>
          <th>Summary</th>
        </tr>
      </thead>
      <tbody>
        {forecasts.map(forecast =>
          <tr key={forecast.dateFormatted}>
            <td>{forecast.dateFormatted}</td>
            <td>{forecast.temperatureC}</td>
            <td>{forecast.temperatureF}</td>
            <td>{forecast.summary}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

export const FetchData = () => {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates after unmount

    const fetchData = async () => {
      try {
        const response = await fetch('api/SampleData/WeatherForecasts');
        const data = await response.json();
        
        // Only update state if component is still mounted
        if (isMounted) {
          setForecasts(data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching weather data:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup function - runs when component unmounts
    return () => {
      isMounted = false;
    };
  }, []);

  const contents = loading 
    ? <p><em>Loading...</em></p>
    : renderForecastsTable(forecasts);

  return (
    <div>
      <h1>Weather forecast</h1>
      <p>This component demonstrates fetching data from the server.</p>
      {contents}
    </div>
  );
};
