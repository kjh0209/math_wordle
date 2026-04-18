import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminPuzzleTable } from "@/components/admin/AdminPuzzleTable";
import { adminGetAllPuzzles } from "@/lib/puzzles/puzzle-repository";

export const dynamic = "force-dynamic";

export default async function AdminPuzzlesPage() {
  const puzzles = await adminGetAllPuzzles();

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-game-text">퍼즐 관리</h1>
          <p className="text-sm text-game-text-muted mt-0.5">
            총 {puzzles.length}개 퍼즐
          </p>
        </div>
        <Link
          href="/admin/puzzles/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          새 퍼즐
        </Link>
      </div>

      <AdminPuzzleTable puzzles={puzzles} />
    </div>
  );
}
