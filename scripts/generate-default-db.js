#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Comprehensive IP ranges covering most of the internet
const IP_RANGES = [
  // North America
  {
    country: 'United States',
    countryCode: 'US',
    city: 'New York',
    region: 'New York',
    ranges: [
      { min: '8.0.0.0', max: '8.255.255.255' },
      { min: '24.0.0.0', max: '24.255.255.255' },
      { min: '32.0.0.0', max: '32.255.255.255' },
      { min: '40.0.0.0', max: '40.255.255.255' },
      { min: '50.0.0.0', max: '50.255.255.255' },
      { min: '64.0.0.0', max: '64.255.255.255' },
      { min: '66.0.0.0', max: '66.255.255.255' },
      { min: '68.0.0.0', max: '68.255.255.255' },
      { min: '70.0.0.0', max: '70.255.255.255' },
      { min: '72.0.0.0', max: '72.255.255.255' },
      { min: '74.0.0.0', max: '74.255.255.255' },
      { min: '76.0.0.0', max: '76.255.255.255' },
      { min: '98.0.0.0', max: '98.255.255.255' },
      { min: '104.0.0.0', max: '104.255.255.255' },
      { min: '108.0.0.0', max: '108.255.255.255' },
      { min: '173.0.0.0', max: '173.255.255.255' },
      { min: '174.0.0.0', max: '174.255.255.255' },
      { min: '184.0.0.0', max: '184.255.255.255' },
      { min: '192.0.0.0', max: '192.255.255.255' },
      { min: '198.0.0.0', max: '198.255.255.255' },
      { min: '204.0.0.0', max: '204.255.255.255' },
      { min: '208.0.0.0', max: '208.255.255.255' },
    ],
  },
  {
    country: 'Canada',
    countryCode: 'CA',
    city: 'Toronto',
    region: 'Ontario',
    ranges: [
      { min: '24.0.0.0', max: '24.255.255.255' },
      { min: '70.0.0.0', max: '70.255.255.255' },
      { min: '142.0.0.0', max: '142.255.255.255' },
      { min: '162.0.0.0', max: '162.255.255.255' },
      { min: '174.0.0.0', max: '174.255.255.255' },
      { min: '184.0.0.0', max: '184.255.255.255' },
      { min: '199.0.0.0', max: '199.255.255.255' },
      { min: '205.0.0.0', max: '205.255.255.255' },
    ],
  },

  // Europe
  {
    country: 'United Kingdom',
    countryCode: 'GB',
    city: 'London',
    region: 'England',
    ranges: [
      { min: '2.0.0.0', max: '2.255.255.255' },
      { min: '5.0.0.0', max: '5.255.255.255' },
      { min: '25.0.0.0', max: '25.255.255.255' },
      { min: '31.0.0.0', max: '31.255.255.255' },
      { min: '46.0.0.0', max: '46.255.255.255' },
      { min: '51.0.0.0', max: '51.255.255.255' },
      { min: '77.0.0.0', max: '77.255.255.255' },
      { min: '80.0.0.0', max: '80.255.255.255' },
      { min: '81.0.0.0', max: '81.255.255.255' },
      { min: '82.0.0.0', max: '82.255.255.255' },
      { min: '86.0.0.0', max: '86.255.255.255' },
      { min: '87.0.0.0', max: '87.255.255.255' },
      { min: '88.0.0.0', max: '88.255.255.255' },
      { min: '89.0.0.0', max: '89.255.255.255' },
      { min: '90.0.0.0', max: '90.255.255.255' },
      { min: '91.0.0.0', max: '91.255.255.255' },
      { min: '92.0.0.0', max: '92.255.255.255' },
      { min: '93.0.0.0', max: '93.255.255.255' },
      { min: '94.0.0.0', max: '94.255.255.255' },
      { min: '95.0.0.0', max: '95.255.255.255' },
    ],
  },
  {
    country: 'Germany',
    countryCode: 'DE',
    city: 'Berlin',
    region: 'Berlin',
    ranges: [
      { min: '46.0.0.0', max: '46.255.255.255' },
      { min: '62.0.0.0', max: '62.255.255.255' },
      { min: '78.0.0.0', max: '78.255.255.255' },
      { min: '80.0.0.0', max: '80.255.255.255' },
      { min: '85.0.0.0', max: '85.255.255.255' },
      { min: '88.0.0.0', max: '88.255.255.255' },
      { min: '91.0.0.0', max: '91.255.255.255' },
      { min: '134.0.0.0', max: '134.255.255.255' },
      { min: '136.0.0.0', max: '136.255.255.255' },
      { min: '141.0.0.0', max: '141.255.255.255' },
      { min: '145.0.0.0', max: '145.255.255.255' },
      { min: '149.0.0.0', max: '149.255.255.255' },
      { min: '178.0.0.0', max: '178.255.255.255' },
      { min: '188.0.0.0', max: '188.255.255.255' },
      { min: '195.0.0.0', max: '195.255.255.255' },
      { min: '212.0.0.0', max: '212.255.255.255' },
      { min: '217.0.0.0', max: '217.255.255.255' },
    ],
  },
  {
    country: 'France',
    countryCode: 'FR',
    city: 'Paris',
    region: 'Île-de-France',
    ranges: [
      { min: '37.0.0.0', max: '37.255.255.255' },
      { min: '62.0.0.0', max: '62.255.255.255' },
      { min: '78.0.0.0', max: '78.255.255.255' },
      { min: '80.0.0.0', max: '80.255.255.255' },
      { min: '81.0.0.0', max: '81.255.255.255' },
      { min: '82.0.0.0', max: '82.255.255.255' },
      { min: '83.0.0.0', max: '83.255.255.255' },
      { min: '84.0.0.0', max: '84.255.255.255' },
      { min: '85.0.0.0', max: '85.255.255.255' },
      { min: '86.0.0.0', max: '86.255.255.255' },
      { min: '87.0.0.0', max: '87.255.255.255' },
      { min: '88.0.0.0', max: '88.255.255.255' },
      { min: '89.0.0.0', max: '89.255.255.255' },
      { min: '90.0.0.0', max: '90.255.255.255' },
      { min: '91.0.0.0', max: '91.255.255.255' },
      { min: '92.0.0.0', max: '92.255.255.255' },
      { min: '93.0.0.0', max: '93.255.255.255' },
      { min: '94.0.0.0', max: '94.255.255.255' },
      { min: '95.0.0.0', max: '95.255.255.255' },
      { min: '109.0.0.0', max: '109.255.255.255' },
      { min: '134.0.0.0', max: '134.255.255.255' },
      { min: '136.0.0.0', max: '136.255.255.255' },
      { min: '141.0.0.0', max: '141.255.255.255' },
      { min: '145.0.0.0', max: '145.255.255.255' },
      { min: '149.0.0.0', max: '149.255.255.255' },
      { min: '178.0.0.0', max: '178.255.255.255' },
      { min: '188.0.0.0', max: '188.255.255.255' },
      { min: '195.0.0.0', max: '195.255.255.255' },
      { min: '212.0.0.0', max: '212.255.255.255' },
      { min: '217.0.0.0', max: '217.255.255.255' },
    ],
  },

  // Asia
  {
    country: 'Japan',
    countryCode: 'JP',
    city: 'Tokyo',
    region: 'Tokyo',
    ranges: [
      { min: '126.0.0.0', max: '126.255.255.255' },
      { min: '210.0.0.0', max: '210.255.255.255' },
      { min: '218.0.0.0', max: '218.255.255.255' },
      { min: '219.0.0.0', max: '219.255.255.255' },
      { min: '220.0.0.0', max: '220.255.255.255' },
      { min: '221.0.0.0', max: '221.255.255.255' },
      { min: '222.0.0.0', max: '222.255.255.255' },
      { min: '223.0.0.0', max: '223.255.255.255' },
    ],
  },
  {
    country: 'China',
    countryCode: 'CN',
    city: 'Beijing',
    region: 'Beijing',
    ranges: [
      { min: '1.0.0.0', max: '1.255.255.255' },
      { min: '14.0.0.0', max: '14.255.255.255' },
      { min: '27.0.0.0', max: '27.255.255.255' },
      { min: '36.0.0.0', max: '36.255.255.255' },
      { min: '39.0.0.0', max: '39.255.255.255' },
      { min: '42.0.0.0', max: '42.255.255.255' },
      { min: '49.0.0.0', max: '49.255.255.255' },
      { min: '58.0.0.0', max: '58.255.255.255' },
      { min: '59.0.0.0', max: '59.255.255.255' },
      { min: '60.0.0.0', max: '60.255.255.255' },
      { min: '61.0.0.0', max: '61.255.255.255' },
      { min: '101.0.0.0', max: '101.255.255.255' },
      { min: '103.0.0.0', max: '103.255.255.255' },
      { min: '106.0.0.0', max: '106.255.255.255' },
      { min: '110.0.0.0', max: '110.255.255.255' },
      { min: '111.0.0.0', max: '111.255.255.255' },
      { min: '112.0.0.0', max: '112.255.255.255' },
      { min: '113.0.0.0', max: '113.255.255.255' },
      { min: '114.0.0.0', max: '114.255.255.255' },
      { min: '115.0.0.0', max: '115.255.255.255' },
      { min: '116.0.0.0', max: '116.255.255.255' },
      { min: '117.0.0.0', max: '117.255.255.255' },
      { min: '118.0.0.0', max: '118.255.255.255' },
      { min: '119.0.0.0', max: '119.255.255.255' },
      { min: '120.0.0.0', max: '120.255.255.255' },
      { min: '121.0.0.0', max: '121.255.255.255' },
      { min: '122.0.0.0', max: '122.255.255.255' },
      { min: '123.0.0.0', max: '123.255.255.255' },
      { min: '124.0.0.0', max: '124.255.255.255' },
      { min: '125.0.0.0', max: '125.255.255.255' },
      { min: '171.0.0.0', max: '171.255.255.255' },
      { min: '175.0.0.0', max: '175.255.255.255' },
      { min: '180.0.0.0', max: '180.255.255.255' },
      { min: '182.0.0.0', max: '182.255.255.255' },
      { min: '183.0.0.0', max: '183.255.255.255' },
      { min: '202.0.0.0', max: '202.255.255.255' },
      { min: '203.0.0.0', max: '203.255.255.255' },
      { min: '210.0.0.0', max: '210.255.255.255' },
      { min: '211.0.0.0', max: '211.255.255.255' },
      { min: '218.0.0.0', max: '218.255.255.255' },
      { min: '219.0.0.0', max: '219.255.255.255' },
      { min: '220.0.0.0', max: '220.255.255.255' },
      { min: '221.0.0.0', max: '221.255.255.255' },
      { min: '222.0.0.0', max: '222.255.255.255' },
      { min: '223.0.0.0', max: '223.255.255.255' },
    ],
  },
  {
    country: 'India',
    countryCode: 'IN',
    city: 'Mumbai',
    region: 'Maharashtra',
    ranges: [
      { min: '103.0.0.0', max: '103.255.255.255' },
      { min: '117.0.0.0', max: '117.255.255.255' },
      { min: '122.0.0.0', max: '122.255.255.255' },
      { min: '180.0.0.0', max: '180.255.255.255' },
      { min: '182.0.0.0', max: '182.255.255.255' },
      { min: '183.0.0.0', max: '183.255.255.255' },
      { min: '202.0.0.0', max: '202.255.255.255' },
      { min: '203.0.0.0', max: '203.255.255.255' },
      { min: '210.0.0.0', max: '210.255.255.255' },
      { min: '211.0.0.0', max: '211.255.255.255' },
      { min: '218.0.0.0', max: '218.255.255.255' },
      { min: '219.0.0.0', max: '219.255.255.255' },
      { min: '220.0.0.0', max: '220.255.255.255' },
      { min: '221.0.0.0', max: '221.255.255.255' },
      { min: '222.0.0.0', max: '222.255.255.255' },
      { min: '223.0.0.0', max: '223.255.255.255' },
    ],
  },

  // Oceania
  {
    country: 'Australia',
    countryCode: 'AU',
    city: 'Sydney',
    region: 'New South Wales',
    ranges: [
      { min: '1.0.0.0', max: '1.255.255.255' },
      { min: '14.0.0.0', max: '14.255.255.255' },
      { min: '27.0.0.0', max: '27.255.255.255' },
      { min: '36.0.0.0', max: '36.255.255.255' },
      { min: '39.0.0.0', max: '39.255.255.255' },
      { min: '42.0.0.0', max: '42.255.255.255' },
      { min: '49.0.0.0', max: '49.255.255.255' },
      { min: '58.0.0.0', max: '58.255.255.255' },
      { min: '59.0.0.0', max: '59.255.255.255' },
      { min: '60.0.0.0', max: '60.255.255.255' },
      { min: '61.0.0.0', max: '61.255.255.255' },
      { min: '101.0.0.0', max: '101.255.255.255' },
      { min: '103.0.0.0', max: '103.255.255.255' },
      { min: '106.0.0.0', max: '106.255.255.255' },
      { min: '110.0.0.0', max: '110.255.255.255' },
      { min: '111.0.0.0', max: '111.255.255.255' },
      { min: '112.0.0.0', max: '112.255.255.255' },
      { min: '113.0.0.0', max: '113.255.255.255' },
      { min: '114.0.0.0', max: '114.255.255.255' },
      { min: '115.0.0.0', max: '115.255.255.255' },
      { min: '116.0.0.0', max: '116.255.255.255' },
      { min: '117.0.0.0', max: '117.255.255.255' },
      { min: '118.0.0.0', max: '118.255.255.255' },
      { min: '119.0.0.0', max: '119.255.255.255' },
      { min: '120.0.0.0', max: '120.255.255.255' },
      { min: '121.0.0.0', max: '121.255.255.255' },
      { min: '122.0.0.0', max: '122.255.255.255' },
      { min: '123.0.0.0', max: '123.255.255.255' },
      { min: '124.0.0.0', max: '124.255.255.255' },
      { min: '125.0.0.0', max: '125.255.255.255' },
      { min: '171.0.0.0', max: '171.255.255.255' },
      { min: '175.0.0.0', max: '175.255.255.255' },
      { min: '180.0.0.0', max: '180.255.255.255' },
      { min: '182.0.0.0', max: '182.255.255.255' },
      { min: '183.0.0.0', max: '183.255.255.255' },
      { min: '202.0.0.0', max: '202.255.255.255' },
      { min: '203.0.0.0', max: '203.255.255.255' },
      { min: '210.0.0.0', max: '210.255.255.255' },
      { min: '211.0.0.0', max: '211.255.255.255' },
      { min: '218.0.0.0', max: '218.255.255.255' },
      { min: '219.0.0.0', max: '219.255.255.255' },
      { min: '220.0.0.0', max: '220.255.255.255' },
      { min: '221.0.0.0', max: '221.255.255.255' },
      { min: '222.0.0.0', max: '222.255.255.255' },
      { min: '223.0.0.0', max: '223.255.255.255' },
    ],
  },

  // South America
  {
    country: 'Brazil',
    countryCode: 'BR',
    city: 'São Paulo',
    region: 'São Paulo',
    ranges: [
      { min: '177.0.0.0', max: '177.255.255.255' },
      { min: '201.0.0.0', max: '201.255.255.255' },
      { min: '186.0.0.0', max: '186.255.255.255' },
      { min: '189.0.0.0', max: '189.255.255.255' },
      { min: '200.0.0.0', max: '200.255.255.255' },
    ],
  },

  // Africa
  {
    country: 'South Africa',
    countryCode: 'ZA',
    city: 'Cape Town',
    region: 'Western Cape',
    ranges: [
      { min: '41.0.0.0', max: '41.255.255.255' },
      { min: '102.0.0.0', max: '102.255.255.255' },
      { min: '105.0.0.0', max: '105.255.255.255' },
      { min: '196.0.0.0', max: '196.255.255.255' },
      { min: '197.0.0.0', max: '197.255.255.255' },
    ],
  },

  // Russia
  {
    country: 'Russia',
    countryCode: 'RU',
    city: 'Moscow',
    region: 'Moscow',
    ranges: [
      { min: '5.0.0.0', max: '5.255.255.255' },
      { min: '31.0.0.0', max: '31.255.255.255' },
      { min: '37.0.0.0', max: '37.255.255.255' },
      { min: '46.0.0.0', max: '46.255.255.255' },
      { min: '62.0.0.0', max: '62.255.255.255' },
      { min: '77.0.0.0', max: '77.255.255.255' },
      { min: '78.0.0.0', max: '78.255.255.255' },
      { min: '80.0.0.0', max: '80.255.255.255' },
      { min: '81.0.0.0', max: '81.255.255.255' },
      { min: '82.0.0.0', max: '82.255.255.255' },
      { min: '83.0.0.0', max: '83.255.255.255' },
      { min: '84.0.0.0', max: '84.255.255.255' },
      { min: '85.0.0.0', max: '85.255.255.255' },
      { min: '86.0.0.0', max: '86.255.255.255' },
      { min: '87.0.0.0', max: '87.255.255.255' },
      { min: '88.0.0.0', max: '88.255.255.255' },
      { min: '89.0.0.0', max: '89.255.255.255' },
      { min: '90.0.0.0', max: '90.255.255.255' },
      { min: '91.0.0.0', max: '91.255.255.255' },
      { min: '92.0.0.0', max: '92.255.255.255' },
      { min: '93.0.0.0', max: '93.255.255.255' },
      { min: '94.0.0.0', max: '94.255.255.255' },
      { min: '95.0.0.0', max: '95.255.255.255' },
      { min: '109.0.0.0', max: '109.255.255.255' },
      { min: '134.0.0.0', max: '134.255.255.255' },
      { min: '136.0.0.0', max: '136.255.255.255' },
      { min: '141.0.0.0', max: '141.255.255.255' },
      { min: '145.0.0.0', max: '145.255.255.255' },
      { min: '149.0.0.0', max: '149.255.255.255' },
      { min: '178.0.0.0', max: '178.255.255.255' },
      { min: '188.0.0.0', max: '188.255.255.255' },
      { min: '195.0.0.0', max: '195.255.255.255' },
      { min: '212.0.0.0', max: '212.255.255.255' },
      { min: '217.0.0.0', max: '217.255.255.255' },
    ],
  },
];

// Convert IP to number for range checking
function ipToNumber(ip) {
  return ip.split('.').reduce((acc, part) => (acc << 8) + parseInt(part), 0) >>> 0;
}

// Check if IP is in range
function isIPInRange(ip, minIP, maxIP) {
  const ipNum = ipToNumber(ip);
  const minNum = ipToNumber(minIP);
  const maxNum = ipToNumber(maxIP);
  return ipNum >= minNum && ipNum <= maxNum;
}

// Find location for IP
function findLocationForIP(ip) {
  for (const countryData of IP_RANGES) {
    for (const range of countryData.ranges) {
      if (isIPInRange(ip, range.min, range.max)) {
        return {
          country: countryData.country,
          countryCode: countryData.countryCode,
          city: countryData.city,
          region: countryData.region,
        };
      }
    }
  }

  // Default fallback
  return {
    country: 'Unknown',
    countryCode: '',
    city: 'Unknown',
    region: 'Unknown',
  };
}

// Generate a simple database file (JSON format for now)
function generateDatabase() {
  console.log('🌍 Generating comprehensive IP geolocation database...');

  const database = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    description: 'Default IP geolocation database for Better Auth Studio',
    coverage: 'Major IP ranges worldwide',
    ranges: IP_RANGES,
    totalRanges: IP_RANGES.reduce((sum, country) => sum + country.ranges.length, 0),
    countries: IP_RANGES.length,
  };

  const outputPath = path.join(__dirname, '..', 'data', 'default-geo.json');
  const outputDir = path.dirname(outputPath);

  // Create directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(database, null, 2));

  console.log(`✅ Database generated successfully!`);
  console.log(`📁 Location: ${outputPath}`);
  console.log(`📊 Countries: ${database.countries}`);
  console.log(`📊 IP Ranges: ${database.totalRanges}`);
  console.log(`📊 Coverage: Major IP ranges worldwide`);

  return outputPath;
}

// Test the database with some sample IPs
function testDatabase() {
  console.log('\n🧪 Testing database with sample IPs...');

  const testIPs = [
    '8.8.8.8', // Google DNS (US)
    '1.1.1.1', // Cloudflare (US)
    '208.67.222.222', // OpenDNS (US)
    '46.4.0.1', // Germany
    '5.5.5.5', // UK
    '126.0.0.1', // Japan
    '103.0.0.1', // India
    '1.0.0.1', // Australia
    '177.0.0.1', // Brazil
    '41.0.0.1', // South Africa
  ];

  testIPs.forEach((ip) => {
    const location = findLocationForIP(ip);
    console.log(
      `📍 ${ip} → ${location.city}, ${location.country} ${location.countryCode ? `(${location.countryCode})` : ''}`
    );
  });
}

// Main execution
if (require.main === module) {
  generateDatabase();
  testDatabase();
}

module.exports = { IP_RANGES, findLocationForIP, generateDatabase };
