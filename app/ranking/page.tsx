"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function RankingPage() {
  const [ranking, setRanking] = useState<any[]>([]);

  useEffect(() => {
    loadRanking();
  }, []);

  async function loadRanking() {
    const { data: predictionsData, error: predictionsError } = await supabase
      .from("predictions")
      .select("user_id, points");

    if (predictionsError) {
      console.error(predictionsError);
      return;
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username");

    if (profilesError) {
      console.error(profilesError);
      return;
    }

    const profilesMap: Record<string, string> = {};

    for (const profile of profilesData || []) {
      profilesMap[profile.id] = profile.username;
    }

    const totals: Record<string, number> = {};

    for (const row of predictionsData || []) {
      totals[row.user_id] = (totals[row.user_id] || 0) + (row.points || 0);
    }

    const rankingArray = Object.entries(totals)
      .map(([user_id, points]) => ({
        user_id,
        username: profilesMap[user_id] || user_id,
        points,
      }))
      .sort((a, b) => b.points - a.points);

    setRanking(rankingArray);
  }

  function getMedal(index: number) {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";

    return `#${index + 1}`;
  }

  function getBorder(index: number) {
    if (index === 0) return "border-yellow-500";
    if (index === 1) return "border-zinc-400";
    if (index === 2) return "border-amber-700";

    return "border-zinc-700";
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">
        🏆 Ranking Typera
      </h1>

      <div className="space-y-3">
        {ranking.map((user, index) => (
          <div
            key={user.user_id}
            className={`border ${getBorder(
              index
            )} rounded p-4 flex items-center justify-between`}
          >
            <div className="text-2xl font-bold w-16">
              {getMedal(index)}
            </div>

            <div className="flex-1 text-center text-lg font-semibold">
              {user.username}
            </div>

            <div className="text-xl font-bold text-yellow-400">
              {user.points} pkt
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}