export async function POST(req: Request) {
  try {
    const { provider, key } = await req.json();

    if (!provider || !key) {
      return Response.json({ error: 'Missing provider or key' }, { status: 400 });
    }

    if (provider === 'tavily') {
      const { tavily } = await import('@tavily/core');
      const client = tavily({ apiKey: key });
      // Make a minimal search to verify the key works
      await client.search('test', { maxResults: 1 });
      return Response.json({ valid: true });
    }

    // For other providers, just accept the key (validation not implemented)
    return Response.json({ valid: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.toLowerCase().includes('unauthorized') || message.toLowerCase().includes('invalid')) {
      return Response.json(
        { error: 'Invalid API key. Please check your key and try again.' },
        { status: 401 }
      );
    }
    return Response.json({ error: `Validation failed: ${message}` }, { status: 500 });
  }
}
