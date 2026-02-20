export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return new Response('No file provided', { status: 400 });
    }

    const mimeType = file.type;
    const name = file.name;

    if (mimeType === 'application/pdf') {
      // Server-side PDF text extraction
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Dynamic import to avoid build-time issues
      const { extractText, getDocumentProxy } = await import('unpdf');
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const data = await extractText(pdf, { mergePages: true });

      return Response.json({
        name,
        mimeType,
        content: data.text,
        type: 'pdf',
        pages: data.totalPages,
      });
    }

    if (mimeType.startsWith('image/') || mimeType === 'text/plain') {
      // Convert to base64 data URL
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;

      return Response.json({
        name,
        mimeType,
        content: dataUrl,
        type: mimeType.startsWith('image/') ? 'image' : 'text',
      });
    }

    return new Response(`Unsupported file type: ${mimeType}`, { status: 400 });
  } catch (error) {
    console.error('Upload route error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Upload failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
