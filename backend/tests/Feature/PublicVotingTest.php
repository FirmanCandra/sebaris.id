<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Event;
use App\Models\Finalist;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicVotingTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_events_only_returns_active_events(): void
    {
        $active = Event::create([
            'name' => 'Event Aktif',
            'start_date' => '2026-09-25',
            'end_date' => '2026-09-30',
            'status' => 'active',
        ]);

        Event::create([
            'name' => 'Event Nonaktif',
            'start_date' => '2026-09-25',
            'end_date' => '2026-09-30',
            'status' => 'inactive',
        ]);

        $this->getJson('/api/events')
            ->assertOk()
            ->assertJsonPath('data.0.id', $active->id)
            ->assertJsonCount(1, 'data');
    }

    public function test_a_free_vote_is_confirmed_and_increments_the_finalist_score(): void
    {
        [$category, $finalist] = $this->activeCategoryWithFinalist();

        $this->postJson('/api/votes', [
            'finalist_id' => $finalist->id,
            'voter_name' => 'Pemilih Uji',
            'voter_contact' => '081234567890',
            'type' => 'free',
        ])
            ->assertCreated()
            ->assertJsonPath('data.status', 'confirmed')
            ->assertJsonPath('data.vote_amount', 1);

        $this->assertDatabaseHas('votes', [
            'finalist_id' => $finalist->id,
            'voter_contact' => '081234567890',
            'type' => 'free',
            'status' => 'confirmed',
        ]);
        $this->assertDatabaseHas('finalists', ['id' => $finalist->id, 'vote_count' => 1]);
    }

    public function test_a_contact_cannot_use_a_second_free_vote_in_the_same_category(): void
    {
        [$category, $firstFinalist] = $this->activeCategoryWithFinalist();
        $secondFinalist = Finalist::create([
            'category_id' => $category->id,
            'name' => 'Finalis Kedua',
            'vote_count' => 0,
        ]);

        $payload = [
            'voter_name' => 'Pemilih Uji',
            'voter_contact' => '081234567890',
            'type' => 'free',
        ];

        $this->postJson('/api/votes', [...$payload, 'finalist_id' => $firstFinalist->id])->assertCreated();
        $this->postJson('/api/votes', [...$payload, 'finalist_id' => $secondFinalist->id])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('voter_contact');

        $this->assertDatabaseHas('finalists', ['id' => $secondFinalist->id, 'vote_count' => 0]);
    }

    private function activeCategoryWithFinalist(): array
    {
        $event = Event::create([
            'name' => 'Event Aktif',
            'start_date' => '2026-09-25',
            'end_date' => '2026-09-30',
            'status' => 'active',
        ]);
        $category = Category::create(['event_id' => $event->id, 'name' => 'Kategori Uji']);
        $finalist = Finalist::create([
            'category_id' => $category->id,
            'name' => 'Finalis Uji',
            'vote_count' => 0,
        ]);

        return [$category, $finalist];
    }
}
