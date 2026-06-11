"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

function calculatePoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
) {
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return 10;
  }

  const predictedDiff = predictedHome - predictedAway;
  const actualDiff = actualHome - actualAway;

  const predictedResult = Math.sign(predictedDiff);
  const actualResult = Math.sign(actualDiff);

  if (predictedResult !== actualResult) {
    return 0;
  }

  if (actualResult === 0) {
    return 7;
  }

  if (predictedDiff === actualDiff) {
    return 7;
  }

  return 5;
}

export default function AdminPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [results, setResults] = useState<
    Record<number, { home: string; away: string }>
  >({});

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      setIsAdmin(false);
      setCheckingAdmin(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    if (profile?.username === "domcio-99") {
      setIsAdmin(true);
      await loadMatches();
    } else {
      setIsAdmin(false);
    }

    setCheckingAdmin(false);
  }

  async function loadMatches() {
    const { data } = await supabase
      .from("matches")
      .select("*")
      .order("kickoff");

    setMatches(data || []);

    const loadedResults: Record<number, { home: string; away: string }> = {};

    data?.forEach((match) => {
      loadedResults[match.id] = {
        home: match.home_score !== null ? String(match.home_score) : "0",
        away: match.away_score !== null ? String(match.away_score) : "0",
      };
    });

    setResults(loadedResults);
  }

  async function saveResult(matchId: number) {
    if (!isAdmin) {
      alert("Brak dostępu.");
      return;
    }

    const result = results[matchId];

    if (
      result?.home === undefined ||
      result?.away === undefined ||
      result.home === "" ||
      result.away === ""
    ) {
      alert("Wpisz oba wyniki.");
      return;
    }

    const actualHome = Number(result.home);
    const actualAway = Number(result.away);

    const { error: matchError } = await supabase
      .from("matches")
      .update({
        home_score: actualHome,
        away_score: actualAway,
        finished: true,
      })
      .eq("id", matchId);

    if (matchError) {
      alert(matchError.message);
      return;
    }

    const { data: predictionsData, error: predictionsError } = await supabase
      .from("predictions")
      .select("*")
      .eq("match_id", matchId);

    if (predictionsError) {
      alert(predictionsError.message);
      return;
    }

    for (const prediction of predictionsData || []) {
      const points = calculatePoints(
        prediction.predicted_home,
        prediction.predicted_away,
        actualHome,
        actualAway
      );

      const { error: pointsError } = await supabase
        .from("predictions")
        .update({ points })
        .eq("id", prediction.id);

      if (pointsError) {
        alert(pointsError.message);
        return;
      }
    }

    alert("Wynik zapisany i punkty przeliczone!");

    loadMatches();
  }

  if (checkingAdmin) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white p-8">
        Sprawdzanie dostępu...
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white p-8">
        <h1 className="text-4xl font-bold mb-4">Brak dostępu</h1>
        <p className="text-zinc-400">
          Nie masz uprawnień do panelu admina.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="text-4xl font-bold mb-6">Panel Admina</h1>

      <div className="space-y-4">
        {matches.map((match) => (
          <div key={match.id} className="border border-zinc-700 rounded p-4">
            <div className="font-bold mb-2">
              {match.home_team} vs {match.away_team}
            </div>

            <div className="text-zinc-400 mb-4">
              {match.finished
                ? `Wynik: ${match.home_score}:${match.away_score}`
                : "Mecz nierozliczony"}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                className="w-16 rounded bg-zinc-800 px-3 py-2 text-center"
                value={results[match.id]?.home ?? "0"}
                onChange={(e) =>
                  setResults({
                    ...results,
                    [match.id]: {
                      ...results[match.id],
                      home: e.target.value,
                    },
                  })
                }
              />

              <span>:</span>

              <input
                type="number"
                className="w-16 rounded bg-zinc-800 px-3 py-2 text-center"
                value={results[match.id]?.away ?? "0"}
                onChange={(e) =>
                  setResults({
                    ...results,
                    [match.id]: {
                      ...results[match.id],
                      away: e.target.value,
                    },
                  })
                }
              />

              <button
                onClick={() => saveResult(match.id)}
                className="ml-4 rounded bg-green-500 px-4 py-2 font-bold text-black"
              >
                Zapisz wynik
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}