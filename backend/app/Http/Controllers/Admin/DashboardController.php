<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Finalist;
use App\Models\Vote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        // KPI Overview — real data only
        $totalVotesConfirmed = Vote::where('status', 'confirmed')->count();
        $totalRevenue        = Vote::where('status', 'confirmed')->where('type', 'paid')->sum('total_price');
        $totalCategories     = Category::count();
        $activeCategories    = Category::where('status', 'active')->count();
        $totalFinalists      = Finalist::count();
        $pendingPayments     = Vote::where('status', 'pending')->count();

        // Votes per day — last 14 days (confirmed only)
        $votesPerDay = Vote::query()
            ->selectRaw("DATE(created_at) as date, SUM(vote_amount) as total_votes, COUNT(*) as total_transactions")
            ->where('status', 'confirmed')
            ->where('created_at', '>=', now()->subDays(13)->startOfDay())
            ->groupByRaw('DATE(created_at)')
            ->orderBy('date')
            ->get()
            ->map(fn ($row) => [
                'date'               => $row->date,
                'total_votes'        => (int) $row->total_votes,
                'total_transactions' => (int) $row->total_transactions,
            ]);

        // Revenue per day — last 14 days (paid + confirmed)
        $revenuePerDay = Vote::query()
            ->selectRaw("DATE(created_at) as date, SUM(total_price) as revenue")
            ->where('status', 'confirmed')
            ->where('type', 'paid')
            ->where('created_at', '>=', now()->subDays(13)->startOfDay())
            ->groupByRaw('DATE(created_at)')
            ->orderBy('date')
            ->get()
            ->map(fn ($row) => [
                'date'    => $row->date,
                'revenue' => (int) $row->revenue,
            ]);

        // Per-category breakdown
        $categoryStats = Category::query()
            ->withCount('finalists')
            ->with(['finalists' => fn ($q) => $q->orderByDesc('vote_count')->limit(3)])
            ->get()
            ->map(function (Category $cat) {
                $votes = Vote::query()
                    ->whereHas('finalist', fn ($q) => $q->where('category_id', $cat->id))
                    ->where('status', 'confirmed');

                $totalVotes   = (clone $votes)->sum('vote_amount');
                $totalRevenue = (clone $votes)->where('type', 'paid')->sum('total_price');
                $freeCount    = (clone $votes)->where('type', 'free')->count();
                $paidCount    = (clone $votes)->where('type', 'paid')->count();

                return [
                    'id'             => $cat->id,
                    'name'           => $cat->name,
                    'status'         => $cat->status,
                    'finalists_count'=> $cat->finalists_count,
                    'total_votes'    => (int) $totalVotes,
                    'total_revenue'  => (int) $totalRevenue,
                    'free_count'     => (int) $freeCount,
                    'paid_count'     => (int) $paidCount,
                    'top_finalists'  => $cat->finalists->map(fn ($f) => [
                        'id'         => $f->id,
                        'name'       => $f->name,
                        'vote_count' => $f->vote_count,
                    ])->values(),
                ];
            });

        // Voter list — paginated, filterable by category_id
        $voterQuery = Vote::query()
            ->with(['finalist.category'])
            ->where('status', 'confirmed')
            ->latest();

        if ($request->filled('category_id')) {
            $voterQuery->whereHas('finalist', fn ($q) => $q->where('category_id', $request->integer('category_id')));
        }

        if ($request->filled('search')) {
            $search = $request->string('search')->trim()->toString();
            $voterQuery->where(function ($q) use ($search) {
                $q->where('voter_name', 'like', "%{$search}%")
                  ->orWhere('voter_contact', 'like', "%{$search}%")
                  ->orWhere('reference_id', $search);
            });
        }

        $voters = $voterQuery->paginate(20)->through(fn ($v) => [
            'id'             => $v->id,
            'reference_id'   => $v->reference_id,
            'voter_name'     => $v->voter_name,
            'voter_contact'  => $v->voter_contact,
            'vote_amount'    => $v->vote_amount,
            'total_price'    => $v->total_price,
            'type'           => $v->type,
            'payment_method' => $v->payment_method,
            'finalist_name'  => $v->finalist?->name,
            'category_name'  => $v->finalist?->category?->name,
            'voted_at'       => $v->paid_at?->toISOString() ?? $v->created_at?->toISOString(),
        ]);

        return response()->json([
            'kpi' => [
                'total_votes'        => $totalVotesConfirmed,
                'total_revenue'      => (int) $totalRevenue,
                'total_categories'   => $totalCategories,
                'active_categories'  => $activeCategories,
                'total_finalists'    => $totalFinalists,
                'pending_payments'   => $pendingPayments,
            ],
            'votes_per_day'   => $votesPerDay,
            'revenue_per_day' => $revenuePerDay,
            'category_stats'  => $categoryStats,
            'voters'          => $voters,
        ]);
    }
}
