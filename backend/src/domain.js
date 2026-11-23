export const normalizePlate = value => String(value ?? '').trim().toUpperCase().replace(/\s+/g, '');
export const validPlate = value => /^[A-Z0-9-]{4,10}$/.test(normalizePlate(value));
export const validSpot = value => /^[A-Z][0-9]{1,3}$/.test(String(value ?? '').trim().toUpperCase());
export const hoursParked = (start, end) => Math.max(1, Math.ceil((new Date(end)-new Date(start))/3600000));
export const fee = (start, end, rate=5) => hoursParked(start,end)*rate;
export const occupancy = (occupied,total) => total ? Math.round(occupied*100/total) : 0;
