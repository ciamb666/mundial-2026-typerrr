"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const [matches, setMatches] = useState<any[]>([]);
  const [username, setUsername] = useState("");
  const [totalPoints, setTotalPoints] = useState(0);

  const [predictions, setPredictions] = useState<
    Record<number, { home: string; away: string }>
  >({});

  useEffect(() => {
    async function loadData() {
      const { data: matchesData } = await supabase
        .from("matches")
        .select("*")
        .order("kickoff");

      setMatches(matchesData || []);

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      if (profile) setUsername(profile.username);

      const { data: predictionsData } = await supabase
        .from("predictions")
        .select("*")
        .eq("user_id", user.id);

      const loadedPredictions: Record<number, { home: string; away: string }> =
        {};

      let points = 0;

      predictionsData?.forEach((prediction) => {
        loadedPredictions[prediction.match_id] = {
          home: String(prediction.predicted_home),
          away: String(prediction.predicted_away),
        };

        points += prediction.points || 0;
      });

      setTotalPoints(points);
      setPredictions(loadedPredictions);
    }

    loadData();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  function goToRanking() {
    window.location.href = "/ranking";
  }

  function isMatchLocked(match: any) {
    const kickoffTime = new Date(match.kickoff);
    const now = new Date();

    return now >= kickoffTime || match.finished;
  }

  function formatKickoff(kickoff: string) {
    return new Date(kickoff).toLocaleString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function savePrediction(matchId: number) {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      alert("Musisz być zalogowany.");
      return;
    }

    const match = matches.find((m) => m.id === matchId);

    if (!match) {
      alert("Nie znaleziono meczu.");
      return;
    }

    if (isMatchLocked(match)) {
      alert("Typowanie tego meczu zostało już zamknięte.");
      return;
    }

    const prediction = predictions[matchId];

    if (
      prediction?.home === undefined ||
      prediction?.away === undefined ||
      prediction.home === "" ||
      prediction.away === ""
    ) {
      alert("Wpisz oba wyniki.");
      return;
    }

    const { error } = await supabase.from("predictions").upsert(
      {
        user_id: user.id,
        match_id: matchId,
        predicted_home: Number(prediction.home),
        predicted_away: Number(prediction.away),
      },
      {
        onConflict: "user_id,match_id",
      }
    );

    if (error) {
      alert(error.message);
      return;
    }

    alert("Typ zapisany!");
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="flex flex-col gap-4 mb-8 md:flex-row md:justify-between md:items-start">
        <div>
          <h1 className="text-4xl font-bold">Panel Typera Mundial 2026</h1>

          <p className="text-zinc-400 mt-2">Witaj, {username}</p>

          <p className="text-yellow-400 font-bold mt-1">
            Twoje punkty: {totalPoints}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="rounded bg-white px-4 py-2 font-bold text-black">
            ⚽ Typowanie
          </button>

          <button
            onClick={goToRanking}
            className="rounded bg-yellow-500 px-4 py-2 font-bold text-black"
          >
            🏆 Ranking
          </button>

          <button
            onClick={logout}
            className="rounded bg-red-600 px-4 py-2 font-bold"
          >
            Wyloguj
          </button>
        </div>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Mecze</h2>

      <div className="space-y-4">
        {matches.map((match) => {
          const locked = isMatchLocked(match);

          return (
            <div key={match.id} className="border border-zinc-700 rounded p-4">
              <div className="font-bold mb-2">
                {match.home_team} vs {match.away_team}
              </div>

              <div className="text-zinc-400 text-sm mb-2">
                {formatKickoff(match.kickoff)}
              </div>

              {locked && (
                <div className="text-red-400 text-sm mb-2">
                  Typowanie zamknięte
                </div>
              )}

              {match.finished && (
                <div className="text-green-400 text-sm mb-4">
                  Wynik końcowy: {match.home_score}:{match.away_score}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  className="w-16 rounded bg-zinc-800 px-3 py-2 text-center disabled:opacity-50"
                  type="number"
                  value={predictions[match.id]?.home ?? ""}
                  disabled={locked}
                  onChange={(e) =>
                    setPredictions({
                      ...predictions,
                      [match.id]: {
                        ...predictions[match.id],
                        home: e.target.value,
                      },
                    })
                  }
                />

                <span>:</span>

                <input
                  className="w-16 rounded bg-zinc-800 px-3 py-2 text-center disabled:opacity-50"
                  type="number"
                  value={predictions[match.id]?.away ?? ""}
                  disabled={locked}
                  onChange={(e) =>
                    setPredictions({
                      ...predictions,
                      [match.id]: {
                        ...predictions[match.id],
                        away: e.target.value,
                      },
                    })
                  }
                />

                <button
                  onClick={() => savePrediction(match.id)}
                  disabled={locked}
                  className="ml-4 rounded bg-white px-4 py-2 font-bold text-black disabled:opacity-50"
                >
                  Zapisz typ
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}