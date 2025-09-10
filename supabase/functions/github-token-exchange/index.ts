import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve(async (req) => {
  // Manejar CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const { code, state } = await req.json();

    if (!code) {
      return new Response(JSON.stringify({ error: 'Missing code parameter' }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Obtener variables de entorno - probar diferentes nombres
    const GITHUB_CLIENT_ID = Deno.env.get('VITE_GITHUB_CLIENT_ID') || 
                            Deno.env.get('GITHUB_CLIENT_ID') || 
                            Deno.env.get('GITHUB_CLIENT_ID');
    const GITHUB_CLIENT_SECRET = Deno.env.get('VITE_GITHUB_CLIENT_SECRET') || 
                                Deno.env.get('GITHUB_CLIENT_SECRET') || 
                                Deno.env.get('GITHUB_CLIENT_SECRET');
    const GITHUB_REDIRECT_URI = Deno.env.get('VITE_GITHUB_REDIRECT_URI') || 
                               Deno.env.get('GITHUB_REDIRECT_URI') || 
                               'http://localhost:8083/auth/github/callback';

    console.log('GitHub OAuth Config:', {
      clientId: GITHUB_CLIENT_ID ? '***' + GITHUB_CLIENT_ID.slice(-4) : 'MISSING',
      clientSecret: GITHUB_CLIENT_SECRET ? '***' + GITHUB_CLIENT_SECRET.slice(-4) : 'MISSING',
      redirectUri: GITHUB_REDIRECT_URI
    });

    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      console.error('Missing GitHub OAuth credentials:', {
        clientId: !!GITHUB_CLIENT_ID,
        clientSecret: !!GITHUB_CLIENT_SECRET,
        availableEnvVars: Object.keys(Deno.env.toObject()).filter(key => key.includes('GITHUB'))
      });
      
      return new Response(JSON.stringify({ 
        error: 'Server configuration error: Missing GitHub OAuth credentials',
        details: 'Please configure VITE_GITHUB_CLIENT_ID and VITE_GITHUB_CLIENT_SECRET in Supabase Edge Functions environment variables'
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Intercambiar código por token con GitHub
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: GITHUB_REDIRECT_URI,
        state: state || '',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('GitHub token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData,
        requestData: {
          clientId: GITHUB_CLIENT_ID ? '***' + GITHUB_CLIENT_ID.slice(-4) : 'MISSING',
          redirectUri: GITHUB_REDIRECT_URI,
          code: code ? '***' + code.slice(-4) : 'MISSING'
        }
      });
      
      return new Response(JSON.stringify({ 
        error: 'GitHub token exchange failed',
        details: errorData,
        status: tokenResponse.status,
        statusText: tokenResponse.statusText
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return new Response(JSON.stringify({ 
        error: 'GitHub OAuth error',
        details: tokenData.error_description || tokenData.error 
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    return new Response(JSON.stringify(tokenData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error in GitHub token exchange Edge Function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error',
      details: error.message 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
