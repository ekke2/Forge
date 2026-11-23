import { ImageResponse } from "next/og";

export const alt = "Forge — project management where your code lives";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0F172A",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.10) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              background: "#4F46E5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
              fontWeight: 700,
              color: "white",
            }}
          >
            F
          </div>
          <div style={{ fontSize: 34, fontWeight: 600, color: "#E2E8F0" }}>
            Forge
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 700,
              color: "#F8FAFC",
              lineHeight: 1.1,
              maxWidth: 900,
              letterSpacing: -1.5,
            }}
          >
            Your project management should live where your code already lives.
          </div>
          <div style={{ fontSize: 30, color: "#94A3B8" }}>
            GitHub issues, pull requests, tasks and activity — one workspace.
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {["Issues", "Pull requests", "My Tasks", "Activity"].map((t) => (
            <div
              key={t}
              style={{
                fontSize: 22,
                color: "#CBD5E1",
                border: "1px solid #334155",
                borderRadius: 8,
                padding: "8px 16px",
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
