
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('Missing image URL', { status: 400 });
  }

  try {
    // Fetch the image from the external URL
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      return new NextResponse('Failed to fetch image', { status: imageResponse.status });
    }

    // Get the headers from the original image response
    const contentType = imageResponse.headers.get('content-type') || 'application/octet-stream';
    const contentLength = imageResponse.headers.get('content-length');

    // Create a new response, streaming the body of the original image
    const response = new NextResponse(imageResponse.body);

    // Set the appropriate content type and length headers
    response.headers.set('Content-Type', contentType);
    if (contentLength) {
      response.headers.set('Content-Length', contentLength);
    }
    response.headers.set('Cache-Control', 'public, max-age=604800, immutable'); // Cache for 1 week

    return response;

  } catch (error) {
    console.error('Image proxy error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
