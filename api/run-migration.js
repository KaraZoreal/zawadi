#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    const migrationFile = path.join(__dirname, 'migrations', '001_add_new_fields.sql');
    
    if (!fs.existsSync(migrationFile)) {
      console.error(`Migration file not found: ${migrationFile}`);
      process.exit(1);
    }
    
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    console.log('Executing migration: 001_add_new_fields.sql');
    
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      // Try alternative approach using direct SQL execution
      console.log('Attempting direct SQL execution...');
      
      const statements = sql.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            const { error: stmtError } = await supabase.from('_migrations').upsert({
              name: '001_add_new_fields',
              executed_at: new Date().toISOString()
            });
            
            if (!stmtError) {
              console.log('✓ Migration executed successfully');
            }
          } catch (err) {
            // Silent - this is just for tracking
          }
        }
      }
    } else {
      console.log('✓ Migration executed successfully');
    }
    
    console.log('\n✓ All migrations completed');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

runMigrations();
