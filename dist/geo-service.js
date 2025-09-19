import { existsSync, readFileSync } from 'fs';
import maxmind from 'maxmind';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let lookup = null;
let geoDbPath = null;
let defaultDatabase = null;
export function setGeoDbPath(path) {
    geoDbPath = path;
}
function loadDefaultDatabase() {
    try {
        const defaultDbPath = join(__dirname, '../data/default-geo.json');
        if (existsSync(defaultDbPath)) {
            const dbContent = readFileSync(defaultDbPath, 'utf-8');
            defaultDatabase = JSON.parse(dbContent);
            console.log(`✅ Default geolocation database loaded (${defaultDatabase?.countries} countries, ${defaultDatabase?.totalRanges} IP ranges)`);
        }
        else {
            console.log('⚠️  Default geolocation database not found, using basic fallback');
        }
    }
    catch (error) {
        console.error('❌ Failed to load default geolocation database:', error);
    }
}
export async function initializeGeoService() {
    try {
        const dbPath = geoDbPath || './data/GeoLite2-City.mmdb';
        lookup = await maxmind.open(dbPath);
    }
    catch (error) {
        lookup = null;
        loadDefaultDatabase();
    }
}
export function resolveIPLocation(ipAddress) {
    if (lookup) {
        try {
            const result = lookup.get(ipAddress);
            if (result) {
                return {
                    country: result.country?.names?.en || 'Unknown',
                    countryCode: result.country?.iso_code || '',
                    city: result.city?.names?.en || 'Unknown',
                    region: result.subdivisions?.[0]?.names?.en || 'Unknown',
                };
            }
        }
        catch (error) {
            console.error('MaxMind lookup failed:', error);
        }
    }
    if (defaultDatabase) {
        const location = findLocationInDefaultDatabase(ipAddress);
        if (location) {
            return location;
        }
    }
    // Final fallback to basic IP range detection
    return resolveIPFromRanges(ipAddress);
}
function findLocationInDefaultDatabase(ipAddress) {
    if (!defaultDatabase)
        return null;
    const ipToNumber = (ip) => {
        return ip.split('.').reduce((acc, part) => (acc << 8) + parseInt(part), 0) >>> 0;
    };
    const isIPInRange = (ip, minIP, maxIP) => {
        const ipNum = ipToNumber(ip);
        const minNum = ipToNumber(minIP);
        const maxNum = ipToNumber(maxIP);
        return ipNum >= minNum && ipNum <= maxNum;
    };
    for (const countryData of defaultDatabase.ranges) {
        for (const range of countryData.ranges) {
            if (isIPInRange(ipAddress, range.min, range.max)) {
                return {
                    country: countryData.country,
                    countryCode: countryData.countryCode,
                    city: countryData.city,
                    region: countryData.region,
                };
            }
        }
    }
    return null;
}
function resolveIPFromRanges(ipAddress) {
    const countryIPRanges = [
        {
            country: 'United States',
            countryCode: 'US',
            city: 'New York',
            region: 'New York',
            ranges: [
                { min: '8.0.0.0', max: '8.255.255.255' },
                { min: '24.0.0.0', max: '24.255.255.255' },
            ],
        },
        {
            country: 'United Kingdom',
            countryCode: 'GB',
            city: 'London',
            region: 'England',
            ranges: [
                { min: '2.0.0.0', max: '2.255.255.255' },
                { min: '5.0.0.0', max: '5.255.255.255' },
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
            ],
        },
        {
            country: 'Japan',
            countryCode: 'JP',
            city: 'Tokyo',
            region: 'Tokyo',
            ranges: [
                { min: '126.0.0.0', max: '126.255.255.255' },
                { min: '210.0.0.0', max: '210.255.255.255' },
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
            ],
        },
        {
            country: 'Australia',
            countryCode: 'AU',
            city: 'Sydney',
            region: 'New South Wales',
            ranges: [
                { min: '1.0.0.0', max: '1.255.255.255' },
                { min: '27.0.0.0', max: '27.255.255.255' },
            ],
        },
        {
            country: 'Brazil',
            countryCode: 'BR',
            city: 'São Paulo',
            region: 'São Paulo',
            ranges: [
                { min: '177.0.0.0', max: '177.255.255.255' },
                { min: '201.0.0.0', max: '201.255.255.255' },
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
            ],
        },
    ];
    const ipParts = ipAddress.split('.').map(Number);
    if (ipParts.length !== 4 || ipParts.some((part) => isNaN(part) || part < 0 || part > 255)) {
        return null;
    }
    for (const countryData of countryIPRanges) {
        for (const range of countryData.ranges) {
            if (isIPInRange(ipAddress, range.min, range.max)) {
                return {
                    country: countryData.country,
                    countryCode: countryData.countryCode,
                    city: countryData.city,
                    region: countryData.region,
                };
            }
        }
    }
    return {
        country: 'Unknown',
        countryCode: '',
        city: 'Unknown',
        region: 'Unknown',
    };
}
function isIPInRange(ip, minIP, maxIP) {
    const ipToNumber = (ip) => {
        return ip.split('.').reduce((acc, part) => (acc << 8) + parseInt(part), 0) >>> 0;
    };
    const ipNum = ipToNumber(ip);
    const minNum = ipToNumber(minIP);
    const maxNum = ipToNumber(maxIP);
    return ipNum >= minNum && ipNum <= maxNum;
}
//# sourceMappingURL=geo-service.js.map