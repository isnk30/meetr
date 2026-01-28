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

function getRoomServiceClient() {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return null;
  }

  const httpUrl = wsUrl.replace("wss://", "https://").replace("ws://", "http://");
  return new RoomServiceClient(httpUrl, apiKey, apiSecret);
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

// PATCH - Update room metadata (for host to set meeting name)
export async function PATCH(request: NextRequest) {
  try {
    const { roomName, meetingName, hostIdentity } = await request.json();

    if (!roomName) {
      return NextResponse.json(
        { success: false, error: "Room name is required" },
        { status: 400 }
      );
    }

    const roomService = getRoomServiceClient();
    if (!roomService) {
      return NextResponse.json(
        { success: false, error: "LiveKit credentials not configured" },
        { status: 500 }
      );
    }

    const metadata = JSON.stringify({
      meetingName: meetingName || "",
      hostIdentity: hostIdentity || "",
    });

    // Check if room exists first
    const rooms = await roomService.listRooms([roomName]);
    const room = rooms.find((r) => r.name === roomName);
    
    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found - it may not be created yet" },
        { status: 404 }
      );
    }

    await roomService.updateRoomMetadata(roomName, metadata);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error updating room metadata:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update room metadata" },
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

    const roomService = getRoomServiceClient();
    if (!roomService) {
      return NextResponse.json(
        { valid: false, error: "LiveKit credentials not configured" },
        { status: 500 }
      );
    }

    try {
      // Try to list rooms and check if our room exists
      const rooms = await roomService.listRooms([code]);
      const room = rooms.find((r) => r.name === code);

      if (room) {
        // Parse room metadata to get meeting name and host identity
        let meetingName = "";
        let hostIdentity = "";
        
        if (room.metadata) {
          try {
            const metadata = JSON.parse(room.metadata);
            meetingName = metadata.meetingName || "";
            hostIdentity = metadata.hostIdentity || "";
          } catch {
            // Invalid JSON in metadata, ignore
          }
        }

        return NextResponse.json({
          valid: true,
          meetingName,
          hostIdentity,
        });
      }

      return NextResponse.json({
        valid: false,
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
