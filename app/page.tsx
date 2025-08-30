"use client";

import React, { useState } from "react";
import Script from "next/script";
import dynamic from "next/dynamic";
import { europeanLocations as locations } from "@/lib/locations";

const StreetViewPlayer = dynamic(() => import("./components/StreetViewPlayer"), { ssr: false });
const GuessMap = dynamic(() => import("./components/GuessMap"), { ssr: false });

export default function Home() {
  const [round, setRound] = useState(0);
  const [actual, setActual] = useState<{ lat: number; lng: number } | null>(null);
  const [guess, setGuess] = useState<{ lat: number; lng: number } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [pointsThisRound, setPointsThisRound] = useState(0);
  const [guessMade, setGuessMade] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const handleGuess = () => {
    if (!actual || !guess) return;

    const distance = getDistance(actual, guess);
    const points = calculateScore(distance);

    setPointsThisRound(points);
    setScore((s) => s + points);

    setRevealed(true);
    setGuessMade(true);
    setShowPopup(true);

    // Hide popup after 3 seconds
    setTimeout(() => setShowPopup(false), 3000);
  };

  const nextRound = () => {
    setRound((r) => (r + 1) % locations.length);
    setActual(null);
    setGuess(null);
    setRevealed(false);
    setPointsThisRound(0);
    setGuessMade(false);
  };

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
        strategy="beforeInteractive"
      />

      <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto", fontFamily: "sans-serif" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h1 style={{ fontSize: 32, marginBottom: 5 }}>
            <span role="img" aria-label="pin">📍</span> PinPoint Guide Europe
          </h1>
          <p style={{ fontSize: 18, color: "#555" }}>
            Round {round + 1} / {locations.length} - Total Score: {Math.round(score)}
          </p>
          <div
            style={{
              height: 10,
              backgroundColor: "#eee",
              borderRadius: 5,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${((round + 1) / locations.length) * 100}%`,
                height: "100%",
                backgroundColor: "#0070f3",
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>

        {/* Street View + Map */}
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
          <div
            style={{
              flex: 1,
              minWidth: 300,
              height: 500,
              background: "#000",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <StreetViewPlayer locationIndex={round} onFound={setActual} />
          </div>

          <div
            style={{
              flex: 1,
              minWidth: 300,
              height: 500,
              borderRadius: 12,
              overflow: "hidden",
              border: "2px solid #ccc",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            }}
          >
            <GuessMap actual={actual} guess={guess} setGuess={setGuess} revealed={revealed} round={round} />
          </div>
        </div>

        {/* Controls */}
        <div style={{ marginTop: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: 15 }}>
          {!guessMade ? (
            <button
              onClick={handleGuess}
              style={{
                padding: "14px 28px",
                fontSize: 16,
                borderRadius: 8,
                backgroundColor: "#0070f3",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                transition: "0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#005bb5")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#0070f3")}
            >
              Make Guess
            </button>
          ) : (
            <button
              onClick={nextRound}
              style={{
                padding: "14px 28px",
                fontSize: 16,
                borderRadius: 8,
                backgroundColor: "#28a745",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                transition: "0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#1e7e34")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#28a745")}
            >
              Next Round
            </button>
          )}
        </div>

        {/* Score Popup */}
        {showPopup && (
          <div
            style={{
              position: "fixed",
              top: 20,
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "#fff",
              padding: "16px 28px",
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              textAlign: "center",
              fontSize: 16,
              color: "#333",
              zIndex: 1000,
              animation: "fadein 0.5s, fadeout 0.5s 2.5s",
            }}
          >
            You were <strong>{Math.round(getDistance(actual!, guess!))}</strong> meters away!<br />
            You scored <strong>{pointsThisRound}</strong> points.
          </div>
        )}

        <style jsx>{`
          @keyframes fadein {
            from { opacity: 0; transform: translateY(-10px);}
            to { opacity: 1; transform: translateY(0);}
          }
          @keyframes fadeout {
            from { opacity: 1; transform: translateY(0);}
            to { opacity: 0; transform: translateY(-10px);}
          }
        `}</style>
      </div>
    </>
  );
}

// Haversine distance formula
function getDistance(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000; // meters
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;

  const x = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

  return R * c;
}

// GeoGuessr-style scoring
function calculateScore(distance: number) {
  const maxPoints = 5000;
  const perfectDistance = 1000; // 1 km = perfect score
  const maxDistance = 200_000; // 200 km capped
  const minPoints = 50; // minimum score

  const cappedDistance = Math.min(distance, maxDistance);
  const score = maxPoints * Math.pow((maxDistance - cappedDistance) / maxDistance, 2);

  return Math.round(Math.max(score, minPoints));
}
