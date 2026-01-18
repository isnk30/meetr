import { NextRequest, NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";

// Generate a random meeting code (e.g., abc-defg-hij)
function generateMeetingCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const segments = [3, 4, 3];

  return segments
    .map((len) =>
      Array.from({ length: len }, () =>
        chars.charAt(Math.floor(Math.random() * chars.length))
      ).join("")
    )
    .join("-");
}

export async function POST() {
  try {
    const meetingCode = generateMeetingCode();

    return NextResponse.json({
      success: true,
      meetingCode,
    });
  } catch (error) {
    console.error("Error creating meeting:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create meeting" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { valid: false, error: "Meeting code is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json(
        { valid: false, error: "LiveKit credentials not configured" },
        { status: 500 }
      );
    }

    // Convert WebSocket URL to HTTP URL for the RoomService
    const httpUrl = wsUrl.replace("wss://", "https://").replace("ws://", "http://");
    
    const roomService = new RoomServiceClient(httpUrl, apiKey, apiSecret);

    try {
      // Try to list rooms and check if our room exists
      const rooms = await roomService.listRooms([code]);
      const roomExists = rooms.some((room) => room.name === code);

      return NextResponse.json({
        valid: roomExists,
      });
    } catch {
      // If we can't list rooms, the room doesn't exist
      return NextResponse.json({
        valid: false,
      });
    }
  } catch (error) {
    console.error("Error validating meeting:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to validate meeting" },
      { status: 500 }
    );
  }
}
