import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const WHISPER_SERVER_URL = process.env.NEXT_PUBLIC_WHISPER_SERVER_URL;

/**
 * API route to proxy transcription requests to the whisper server
 * This allows us to hide the server URL and add additional functionality
 */
export async function POST(request: NextRequest) {
  try {
    // Check if server URL is configured
    if (!WHISPER_SERVER_URL) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Whisper server URL not configured',
            code: 'SERVER_MISCONFIGURED'
          } 
        },
        { status: 500 }
      );
    }

    // Get form data from the request
    const formData = await request.formData();
    
    // Forward the request to the whisper server
    const response = await axios.post(
      `${WHISPER_SERVER_URL}/api/transcribe`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    // Return the response
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error in transcribe API:', error);
    
    // Format error response
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to transcribe audio',
          code: 'TRANSCRIPTION_ERROR',
          details: { originalError: error },
        } 
      },
      { status: 500 }
    );
  }
}