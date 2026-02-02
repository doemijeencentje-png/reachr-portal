import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { wordpress_base_url, wordpress_username, wordpress_app_password } = body;

    if (!wordpress_base_url || !wordpress_username || !wordpress_app_password) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Clean up the URL
    let baseUrl = wordpress_base_url.trim();
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }

    // Try to authenticate with WordPress REST API
    const credentials = Buffer.from(`${wordpress_username}:${wordpress_app_password}`).toString('base64');

    const response = await fetch(`${baseUrl}/wp-json/wp/v2/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WordPress verification failed:', response.status, errorText);

      if (response.status === 401) {
        return NextResponse.json({
          success: false,
          error: 'Invalid username or application password',
        });
      }

      if (response.status === 404) {
        return NextResponse.json({
          success: false,
          error: 'WordPress REST API not found. Make sure your site has REST API enabled.',
        });
      }

      return NextResponse.json({
        success: false,
        error: `WordPress returned error: ${response.status}`,
      });
    }

    const userData = await response.json();

    // Check if user has sufficient capabilities
    const capabilities = userData.capabilities || {};
    const canPublish = capabilities.publish_posts || capabilities.administrator;

    if (!canPublish) {
      return NextResponse.json({
        success: false,
        error: 'User does not have permission to publish posts',
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
      },
    });
  } catch (error) {
    console.error('Error verifying WordPress connection:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to connect to WordPress. Check the URL and try again.',
    });
  }
}
