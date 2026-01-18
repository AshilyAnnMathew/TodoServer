const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('--- SUPABASE DEBUG ---');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseKey ? supabaseKey.length : 0);
console.log('----------------------');

const authenticateUser = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Missing token' });
    }

    const tempSupabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error } = await tempSupabase.auth.getUser(token);

    if (error || !user) {
        return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    req.supabase = createClient(supabaseUrl, supabaseKey, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    });
    next();
};

module.exports = { authenticateUser };
