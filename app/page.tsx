// app/page.tsx
"use client";

import React, { useState, useMemo } from "react";
import Script from "next/script";
import dynamic from "next/dynamic";
import { europeanLocations as locations } from "@/lib/locations";
import { Orbitron } from "next/font/google";

const orbitron = Orbitron({ subsets: ["latin"], weight: "700" });

const StreetViewPlayer = dynamic(() => import("./components/StreetViewPlayer"), { ssr: false });
const GuessMap = dynamic(() => import("./components/GuessMap"), { ssr: false });

function shuffleArray<T>(arr: T[]) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function Home() {
  // seed changes on page reload -> re-run shuffle once per reload
  const [seed] = useState(() => Math.random());
  const shuffledLocations = useMemo(() => shuffleArray(locations), [seed]);

  const [round, setRound] = useState(0);
  const [actual, setActual] = useState<{ lat: number; lng: number } | null>(null);
  const [guess, setGuess] = useState<{ lat: number; lng: number } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [pointsThisRound, setPointsThisRound] = useState(0);
  const [guessMade, setGuessMade] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const currentLocation = shuffledLocations[round];

  const handleGuess = () => {
    if (!actual || !guess) return;

    const distance = getDistance(actual, guess);
    const points = calculateScore(distance);

    setPointsThisRound(points);
    setScore((s) => s + points);

    setRevealed(true);
    setGuessMade(true);
    setShowPopup(true);

    setTimeout(() => setShowPopup(false), 3000);
  };

  const nextRound = () => {
    if (round + 1 >= shuffledLocations.length) {
      setGameOver(true);
    } else {
      setRound((r) => r + 1);
      setActual(null);
      setGuess(null);
      setRevealed(false);
      setPointsThisRound(0);
      setGuessMade(false);
    }
  };

  const restartGame = () => {
    // keep simple: reset state and also re-seed on reload by reloading page
    // you can change this to reshuffle programmatically if you prefer not to reload
    window.location.reload();
  };

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
        strategy="beforeInteractive"
      />

      <div className="min-h-screen relative overflow-hidden font-sans">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-700 via-blue-600 to-pink-600 animate-gradient-x opacity-95" />
        <div className="absolute inset-0 backdrop-blur-sm" />

        <div className="relative z-10 text-gray-100 px-6">
          <div className="text-center py-8">
            <h1
              className="text-6xl font-extrabold drop-shadow-lg"
              style={{
                color: "white",
                textShadow: "0 0 12px rgba(255,255,255,0.9), 0 0 24px rgba(255,255,255,0.8)",
              }}
            >
              📍 GeoMaster Europe
            </h1>

            <p className="mt-2 text-lg italic text-gray-200">Test your geography skills!</p>

            {!gameOver && (
              <>
                <p className="mt-4 text-lg font-semibold">
                  Round {round + 1} / {shuffledLocations.length} • Total Score:{" "}
                  <span className="text-yellow-300 font-bold">{Math.round(score)}</span>
                </p>

                <div className="w-11/12 md:w-1/2 mx-auto h-3 mt-3 bg-gray-800 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-300 to-orange-500 transition-all duration-500"
                    style={{ width: `${((round + 1) / shuffledLocations.length) * 100}%` }}
                  />
                </div>
              </>
            )}
          </div>

          {gameOver ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <h2 className="text-5xl font-extrabold text-yellow-300 drop-shadow-lg animate-bounce">
                🎉 Game Over!
              </h2>
              <p className="mt-6 text-2xl font-semibold">
                Final Score: <span className="text-green-400">{Math.round(score)}</span>
              </p>
              <button
                onClick={restartGame}
                className="mt-10 px-10 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-2xl transform transition hover:scale-110"
              >
                🔄 Play Again
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap justify-center gap-6">
                <div
                  className="flex-1 min-w-[320px] h-[520px] rounded-2xl overflow-hidden border bg-black/40"
                  style={{
                    border: "3px solid rgba(255,255,255,0.85)",
                    boxShadow: "0 0 24px rgba(255,255,255,0.7)",
                    transition: "all 200ms ease",
                  }}
                >
                  {/* render StreetViewPlayer only if currentLocation exists */}
                  {currentLocation && (
                    <StreetViewPlayer location={currentLocation} onFound={setActual} />
                  )}
                </div>

                <div
                  className="flex-1 min-w-[320px] h-[520px] rounded-2xl overflow-hidden border bg-black/40"
                  style={{
                    border: "3px solid rgba(255,255,255,0.85)",
                    boxShadow: "0 0 24px rgba(255,255,255,0.7)",
                    transition: "all 200ms ease",
                  }}
                >
                  <GuessMap actual={actual} guess={guess} setGuess={setGuess} revealed={revealed} round={round} />
                </div>
              </div>

              <div className="mt-10 flex justify-center">
                {!guessMade ? (
                  <button
                    onClick={handleGuess}
                    className="px-10 py-4 rounded-2xl bg-gradient-to-r from-green-400 to-emerald-600 text-white font-bold shadow-xl transform transition hover:scale-105"
                  >
                    🚀 Make Guess
                  </button>
                ) : (
                  <button
                    onClick={nextRound}
                    className="px-10 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold shadow-xl transform transition hover:scale-105"
                  >
                    ⏭ Next Round
                  </button>
                )}
              </div>
            </>
          )}

          {showPopup && actual && guess && (
            <div
              style={{
                position: "fixed",
                top: 20,
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "rgba(255,255,255,0.95)",
                padding: "16px 28px",
                borderRadius: 12,
                boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
                textAlign: "center",
                fontSize: 16,
                color: "#111",
                zIndex: 1000,
                animation: "fadein 0.5s, fadeout 0.5s 2.5s",
              }}
            >
              {(() => {
                const distanceMeters = getDistance(actual, guess);
                const distanceKm = distanceMeters / 1000;
                const distanceLabel = distanceKm < 1 ? `${Math.round(distanceMeters)} m` : `${distanceKm.toFixed(1)} km`;

                return (
                  <>
                    🎯 You were <span style={{ fontWeight: 700, color: "#4f46e5" }}>{distanceLabel}</span> away!
                    <br />
                    ⭐ You scored <span style={{ fontWeight: 700, color: "#059669" }}>{pointsThisRound}</span> points.
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .animate-gradient-x {
          background-size: 400% 400%;
          animation: gradient-x 18s linear infinite;
        }
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fadein { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeout { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-12px); } }
      `}</style>
    </>
  );
}

// distance & scoring functions (unchanged)
function getDistance(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;

  const x = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

  return R * c;
}

function calculateScore(distance: number) {
  const maxPoints = 5000;
  const maxDistance = 2000_000;
  const minPoints = 50;

  const cappedDistance = Math.min(distance, maxDistance);
  const score = maxPoints * Math.pow((maxDistance - cappedDistance) / maxDistance, 2);

  return Math.round(Math.max(score, minPoints));
}
