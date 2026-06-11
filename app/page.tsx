"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function register() {
    if (!username || !password) {
      alert("Wpisz login i hasło.");
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const email = `${cleanUsername}@mundial2026.pl`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    const user = data.user;

    if (user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        username: cleanUsername,
      });

      if (profileError) {
        alert(profileError.message);
        return;
      }
    }

    alert("Konto utworzone. Możesz się teraz zalogować.");
  }

  async function login() {
    if (!username || !password) {
      alert("Wpisz login i hasło.");
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const email = `${cleanUsername}@mundial2026.pl`;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <div className="w-full max-w-sm rounded-xl bg-zinc-900 p-6">
        <h1 className="text-3xl font-bold text-center">
          Typowanie Mundial 2026
        </h1>

        <p className="mt-2 text-center text-zinc-400">
          Zaloguj się albo załóż konto
        </p>

        <div className="mt-6 space-y-4">
          <input
            className="w-full rounded bg-zinc-800 px-4 py-3"
            placeholder="Login / nick"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            className="w-full rounded bg-zinc-800 px-4 py-3"
            placeholder="Hasło"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            onClick={login}
            className="w-full rounded bg-white px-4 py-3 font-bold text-black"
          >
            Zaloguj
          </button>

          <button
            onClick={register}
            className="w-full rounded border border-zinc-700 px-4 py-3"
          >
            Załóż konto
          </button>
        </div>
      </div>
    </main>
  );
}