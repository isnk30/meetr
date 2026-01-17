import { NextResponse } from "next/server";

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
