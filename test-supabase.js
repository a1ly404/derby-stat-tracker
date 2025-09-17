// Test Supabase connection
// This file can be used to test your Supabase setup

import { supabase } from './lib/supabase.js'

// Test the connection
async function testConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase.from('teams').select('count')
    
    if (error) {
      console.error('Connection error:', error.message)
      return false
    }
    
    console.log('✅ Supabase connection successful!')
    return true
  } catch (err) {
    console.error('❌ Connection failed:', err)
    return false
  }
}

// Test authentication state
async function testAuth() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    console.log('Current session:', session ? 'Logged in' : 'Not logged in')
    
    const { data: { user } } = await supabase.auth.getUser()
    console.log('Current user:', user ? user.email : 'None')
    
  } catch (err) {
    console.error('Auth test failed:', err)
  }
}

// Run tests if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  testConnection()
  testAuth()
}

export { testConnection, testAuth }