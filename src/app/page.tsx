"use client";

import { testFlow } from "@/utils/safe";
import Image from "next/image";

export default function Home() {
  async function onClick() {
    await testFlow();
  }
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <button
        onClick={onClick}
        className="btn btn-primary lg:col-span-2 bg-blue-400 rounded-2xl p-4"
      >
        Test
      </button>
    </main>
  );
}
