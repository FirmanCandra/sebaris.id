<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Event;
use App\Models\Finalist;
use App\Models\Vote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $eventId    = $request->filled('event_id') ? $request->integer('event_id') : null;
        $categoryId = $request->filled('category_id') ? $request->integer('category_id') : null;

        // Resolve active category IDs for filtering
        $filteredCategoryIds = null;
        if ($categoryId) {
            $filteredCategoryIds = [$categoryId];
        } elseif ($eventId) {
            $filteredCategoryIds = Category::where('event_id', $eventId)->pluck('id')->all();
        }

        // 1. KPI Overview (Filtered if event or category is chosen)
        $votesQuery = Vote::query()->where('status', 'confirmed');
        $revQuery   = Vote::query()->where('status', 'confirmed')->where('type', 'paid');
        $catQuery   = Category::query();
        $finQuery   = Finalist::query();
        $pendQuery  = Vote::query()->where('status', 'pending');

        if ($filteredCategoryIds !== null) {
            $votesQuery->whereHas('finalist', fn ($q) => $q->whereIn('category_id', $filteredCategoryIds));
            $revQuery->whereHas('finalist', fn ($q) => $q->whereIn('category_id', $filteredCategoryIds));
            $catQuery->whereIn('id', $filteredCategoryIds);
            $finQuery->whereIn('category_id', $filteredCategoryIds);
            $pendQuery->whereHas('finalist', fn ($q) => $q->whereIn('category_id', $filteredCategoryIds));
        }

        $totalVotesConfirmed = (clone $votesQuery)->sum('vote_amount');
        $totalTransactions   = (clone $votesQuery)->count();
        $totalRevenue        = (clone $revQuery)->sum('total_price');
        $totalCategories     = (clone $catQuery)->count();
        $activeCategories    = (clone $catQuery)->where('status', 'active')->count();
        $totalFinalists      = (clone $finQuery)->count();
        $pendingPayments     = (clone $pendQuery)->count();

        // 2. Votes per day — last 14 days (confirmed only, filtered)
        $dailyVotesQuery = Vote::query()
            ->selectRaw("DATE(created_at) as date, SUM(vote_amount) as total_votes, COUNT(*) as total_transactions")
            ->where('status', 'confirmed')
            ->where('created_at', '>=', now()->subDays(13)->startOfDay());

        if ($filteredCategoryIds !== null) {
            $dailyVotesQuery->whereHas('finalist', fn ($q) => $q->whereIn('category_id', $filteredCategoryIds));
        }

        $votesPerDay = $dailyVotesQuery
            ->groupByRaw('DATE(created_at)')
            ->orderBy('date')
            ->get()
            ->map(fn ($row) => [
                'date'               => $row->date,
                'total_votes'        => (int) $row->total_votes,
                'total_transactions' => (int) $row->total_transactions,
            ]);

        // 3. Revenue per day — last 14 days (paid + confirmed, filtered)
        $dailyRevQuery = Vote::query()
            ->selectRaw("DATE(created_at) as date, SUM(total_price) as revenue")
            ->where('status', 'confirmed')
            ->where('type', 'paid')
            ->where('created_at', '>=', now()->subDays(13)->startOfDay());

        if ($filteredCategoryIds !== null) {
            $dailyRevQuery->whereHas('finalist', fn ($q) => $q->whereIn('category_id', $filteredCategoryIds));
        }

        $revenuePerDay = $dailyRevQuery
            ->groupByRaw('DATE(created_at)')
            ->orderBy('date')
            ->get()
            ->map(fn ($row) => [
                'date'    => $row->date,
                'revenue' => (int) $row->revenue,
            ]);

        // 4. Per-category breakdown
        $categoryBreakdownQuery = Category::query()
            ->with('event:id,name')
            ->withCount('finalists')
            ->with(['finalists' => fn ($q) => $q->orderByDesc('vote_count')->limit(3)]);

        if ($filteredCategoryIds !== null) {
            $categoryBreakdownQuery->whereIn('id', $filteredCategoryIds);
        }

        $categoryStats = $categoryBreakdownQuery->get()->map(function (Category $cat) {
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
                'event_name'     => $cat->event?->name,
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

        // 5. Voter list — paginated, filtered
        $voterQuery = Vote::query()
            ->with(['finalist.category.event', 'user'])
            ->where('status', 'confirmed')
            ->latest();

        if ($filteredCategoryIds !== null) {
            $voterQuery->whereHas('finalist', fn ($q) => $q->whereIn('category_id', $filteredCategoryIds));
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
            'voter_name'     => $v->is_anonymous ? 'Anonim (' . ($v->user?->name ?? $v->voter_name) . ')' : ($v->user?->name ?? $v->voter_name),
            'voter_contact'  => $v->voter_contact,
            'vote_amount'    => $v->vote_amount,
            'total_price'    => $v->total_price,
            'type'           => $v->type,
            'payment_method' => $v->payment_method,
            'message'        => $v->message,
            'is_registered'  => (bool) $v->user_id,
            'finalist_name'  => $v->finalist?->name,
            'category_name'  => $v->finalist?->category?->name,
            'event_name'     => $v->finalist?->category?->event?->name,
            'voted_at'       => $v->paid_at?->toISOString() ?? $v->created_at?->toISOString(),
        ]);

        // 6. Return metadata for filter dropdowns
        $eventsList = Event::select('id', 'name')->orderBy('name')->get();
        $categoriesList = Category::select('id', 'name', 'event_id')->orderBy('name')->get();

        return response()->json([
            'kpi' => [
                'total_votes'        => (int) $totalVotesConfirmed,
                'total_transactions' => (int) $totalTransactions,
                'total_revenue'      => (int) $totalRevenue,
                'total_categories'   => (int) $totalCategories,
                'active_categories'  => (int) $activeCategories,
                'total_finalists'    => (int) $totalFinalists,
                'pending_payments'   => (int) $pendingPayments,
            ],
            'votes_per_day'   => $votesPerDay,
            'revenue_per_day' => $revenuePerDay,
            'category_stats'  => $categoryStats,
            'voters'          => $voters,
            'filters'         => [
                'selected_event_id'    => $eventId,
                'selected_category_id' => $categoryId,
                'events'               => $eventsList,
                'categories'           => $categoriesList,
            ],
        ]);
    }
}
