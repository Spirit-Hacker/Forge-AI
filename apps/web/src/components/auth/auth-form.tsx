"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/auth/use-auth";
import { api } from "@/lib/api";

interface AuthFormProps {
  mode: "login" | "register";
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  accessToken: string;
}

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();

  const { setAuth } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setLoading(true);

    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";

      const body = isRegister
        ? {
            name: name.trim() || undefined,
            email: email.trim(),
            password,
          }
        : {
            email: email.trim(),
            password,
          };

      const response = await api<AuthResponse>(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
        skipAuthRefresh: true,
      });

      setAuth(response.user, response.accessToken);

      console.log("LOGIN USER: ", response.user);

      router.replace("/projects");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <div className="mb-2 text-2xl font-bold">Forge</div>

        <h1 className="text-3xl font-semibold">
          {isRegister ? "Create your account" : "Welcome back"}
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          {isRegister
            ? "Start building with Forge."
            : "Sign in to continue building."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {isRegister && (
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium">
              Name
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              autoComplete="name"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 outline-none transition focus:border-zinc-500"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium">
            Email
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 outline-none transition focus:border-zinc-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium">
            Password
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
            minLength={8}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 outline-none transition focus:border-zinc-500"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-white px-4 py-3 font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading
            ? "Please wait..."
            : isRegister
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-zinc-500">
        {isRegister ? (
          <>
            Already have an account?{" "}
            <a href="/login" className="text-white hover:underline">
              Sign in
            </a>
          </>
        ) : (
          <>
            {"Don't"} have an account?{" "}
            <a href="/register" className="text-white hover:underline">
              Create one
            </a>
          </>
        )}
      </div>
    </div>
  );
}
