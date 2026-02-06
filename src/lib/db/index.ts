import { Pool } from 'pg';

// Use a global variable to prevent multiple pools during HMR (Hot Module Replacement) in development
declare global {
    var pgPool: Pool | undefined;
}

const pool = global.pgPool || new Pool({
    connectionString: process.env.DATABASE_URL,
    // SSL is required for Supabase outside of local Docker network
    ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('supabase')
        ? { rejectUnauthorized: false }
        : undefined
});

if (process.env.NODE_ENV !== 'production') {
    global.pgPool = pool;
}

export default pool;
