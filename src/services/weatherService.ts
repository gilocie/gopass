// A real-world implementation would use a robust weather API.
// This is a simplified example to establish the service pattern.

export interface WeatherData {
  temperature: number;
  condition: 'Sunny' | 'Cloudy' | 'Rainy' | 'Stormy' | 'Snowy';
  windSpeed: number; // in km/h
}

/**
 * Fetches a simulated weather forecast for a given location.
 * In a real application, this would call an external Weather API.
 * @param location The name of the location (e.g., "San Francisco, CA").
 * @returns A promise that resolves to the weather data.
 */
export const getWeatherForecast = async (location: string): Promise<WeatherData> => {
  console.log(`Fetching simulated weather for ${location}...`);

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Simulate different weather based on location name for variety
  const hash = location.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const conditionSeed = hash % 5;
  
  let condition: WeatherData['condition'];
  switch (conditionSeed) {
    case 0: condition = 'Sunny'; break;
    case 1: condition = 'Cloudy'; break;
    case 2: condition = 'Rainy'; break;
    case 3: condition = 'Stormy'; break;
    default: condition = 'Snowy'; break;
  }

  const temperature = Math.floor(hash % 30) + 5; // Temp between 5°C and 34°C
  const windSpeed = Math.floor(hash % 20) + 2; // Wind between 2 and 21 km/h

  const simulatedData: WeatherData = {
    temperature,
    condition,
    windSpeed,
  };

  return simulatedData;
};
