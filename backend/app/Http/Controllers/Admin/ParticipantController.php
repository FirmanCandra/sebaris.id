<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Vote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ParticipantController extends Controller
{
    /**
     * Display a listing of participants (registered users and active voters/commenters).
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->string('search')->trim()->toString();
        $tab    = $request->string('tab', 'all')->toString(); // 'all', 'registered', 'commenters', 'voters'

        // 1. Overall Metrics
        $totalRegistered = User::count();
        $totalGoogleUsers = User::whereNotNull('google_id')->count();
        $totalComments   = Vote::whereNotNull('message')->where('message', '!=', '')->count();
        $totalUniqueVoters = Vote::where('status', 'confirmed')
            ->whereNotNull('voter_contact')
            ->distinct()
            ->count('voter_contact');
        $totalVotesCast  = Vote::where('status', 'confirmed')->sum('vote_amount');
        $totalRevenue    = Vote::where('status', 'confirmed')->where('type', 'paid')->sum('total_price');

        // 2. Query Registered Users with vote aggregations
        $usersQuery = User::query()
            ->withCount([
                'votes as total_transactions',
                'votes as confirmed_transactions' => fn ($q) => $q->where('status', 'confirmed'),
                'votes as comments_count' => fn ($q) => $q->whereNotNull('message')->where('message', '!=', ''),
            ])
            ->withSum(['votes as total_votes_sum' => fn ($q) => $q->where('status', 'confirmed')], 'vote_amount')
            ->withSum(['votes as total_spent_sum' => fn ($q) => $q->where('status', 'confirmed')->where('type', 'paid')], 'total_price');

        if ($search !== '') {
            $usersQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($tab === 'commenters') {
            $usersQuery->has('votes', '>=', 1, 'and', function ($q) {
                $q->whereNotNull('message')->where('message', '!=', '');
            });
        } elseif ($tab === 'voters') {
            $usersQuery->has('votes', '>=', 1, 'and', function ($q) {
                $q->where('status', 'confirmed');
            });
        }

        $users = $usersQuery->latest()->paginate(25)->through(function (User $u) {
            // Find recent votes and recent messages
            $recentVotes = $u->votes()
                ->with(['finalist.category.event'])
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn ($v) => [
                    'id'             => $v->id,
                    'reference_id'   => $v->reference_id,
                    'finalist_name'  => $v->finalist?->name,
                    'category_name'  => $v->finalist?->category?->name,
                    'event_name'     => $v->finalist?->category?->event?->name,
                    'vote_amount'    => $v->vote_amount,
                    'total_price'    => $v->total_price,
                    'type'           => $v->type,
                    'status'         => $v->status,
                    'message'        => $v->message,
                    'payment_method' => $v->payment_method,
                    'created_at'     => $v->created_at?->toISOString(),
                ]);

            return [
                'id'                     => $u->id,
                'name'                   => $u->name,
                'email'                  => $u->email,
                'avatar'                 => $u->avatar,
                'role'                   => $u->role ?? 'user',
                'provider'               => $u->google_id ? 'google' : 'email',
                'joined_at'              => $u->created_at?->toISOString(),
                'total_transactions'     => $u->total_transactions,
                'confirmed_transactions' => $u->confirmed_transactions,
                'total_votes'            => (int) ($u->total_votes_sum ?? 0),
                'total_spent'            => (int) ($u->total_spent_sum ?? 0),
                'comments_count'         => $u->comments_count,
                'recent_activity'        => $recentVotes,
            ];
        });

        // 3. Recent Live Comments / Support Messages Feed across all users/guests
        $recentCommentsQuery = Vote::query()
            ->with(['finalist.category.event', 'user'])
            ->whereNotNull('message')
            ->where('message', '!=', '')
            ->latest();

        if ($search !== '') {
            $recentCommentsQuery->where(function ($q) use ($search) {
                $q->where('voter_name', 'like', "%{$search}%")
                  ->orWhere('voter_contact', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%");
            });
        }

        $recentComments = $recentCommentsQuery->limit(20)->get()->map(fn ($v) => [
            'id'            => $v->id,
            'reference_id'  => $v->reference_id,
            'voter_name'    => $v->is_anonymous ? 'Anonim' : ($v->user?->name ?? $v->voter_name),
            'actual_name'   => $v->user?->name ?? $v->voter_name,
            'voter_contact' => $v->voter_contact,
            'is_registered' => (bool) $v->user_id,
            'user_avatar'   => $v->user?->avatar,
            'message'       => $v->message,
            'vote_amount'   => $v->vote_amount,
            'status'        => $v->status,
            'finalist_name' => $v->finalist?->name,
            'category_name' => $v->finalist?->category?->name,
            'event_name'    => $v->finalist?->category?->event?->name,
            'created_at'    => $v->created_at?->toISOString(),
        ]);

        return response()->json([
            'kpi' => [
                'total_registered'   => $totalRegistered,
                'total_google_users' => $totalGoogleUsers,
                'total_voters'       => $totalUniqueVoters,
                'total_comments'     => $totalComments,
                'total_votes_cast'   => (int) $totalVotesCast,
                'total_revenue'      => (int) $totalRevenue,
            ],
            'participants'    => $users,
            'recent_comments' => $recentComments,
        ]);
    }

    /**
     * Display the specified participant details and complete history.
     */
    public function show(int $id): JsonResponse
    {
        $user = User::with([
            'votes' => function ($q) {
                $q->with(['finalist.category.event'])->latest();
            },
        ])->findOrFail($id);

        $confirmedVotes = $user->votes->where('status', 'confirmed');
        $messages = $user->votes->whereNotNull('message')->where('message', '!=', '');

        return response()->json([
            'user' => [
                'id'          => $user->id,
                'name'        => $user->name,
                'email'       => $user->email,
                'avatar'      => $user->avatar,
                'role'        => $user->role,
                'provider'    => $user->google_id ? 'google' : 'email',
                'joined_at'   => $user->created_at?->toISOString(),
                'total_votes' => (int) $confirmedVotes->sum('vote_amount'),
                'total_spent' => (int) $confirmedVotes->where('type', 'paid')->sum('total_price'),
                'votes_count' => $confirmedVotes->count(),
                'messages_count' => $messages->count(),
            ],
            'votes' => $user->votes->map(fn ($v) => [
                'id'             => $v->id,
                'reference_id'   => $v->reference_id,
                'finalist_name'  => $v->finalist?->name,
                'finalist_photo' => $v->finalist?->photo_url ?? $v->finalist?->photo,
                'category_name'  => $v->finalist?->category?->name,
                'event_name'     => $v->finalist?->category?->event?->name,
                'vote_amount'    => $v->vote_amount,
                'total_price'    => $v->total_price,
                'type'           => $v->type,
                'status'         => $v->status,
                'payment_method' => $v->payment_method,
                'message'        => $v->message,
                'paid_at'        => $v->paid_at?->toISOString() ?? $v->created_at?->toISOString(),
                'created_at'     => $v->created_at?->toISOString(),
            ])->values(),
        ]);
    }
}
