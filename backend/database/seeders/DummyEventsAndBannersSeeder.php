<?php

namespace Database\Seeders;

use App\Models\Banner;
use App\Models\Category;
use App\Models\Event;
use App\Models\Finalist;
use Illuminate\Database\Seeder;

class DummyEventsAndBannersSeeder extends Seeder
{
    public function run(): void
    {
        // 1. EVENT 1: Pemilihan Putra Putri Duta Pariwisata Nusantara 2026
        $eventPariwisata = Event::updateOrCreate(
            ['name' => 'Pemilihan Putra Putri Duta Pariwisata Nusantara 2026'],
            [
                'thumbnail'  => 'categories/thumb_duta_pariwisata.jpg',
                'start_date' => '2026-09-01',
                'end_date'   => '2026-10-31',
                'status'     => 'active',
            ]
        );

        $catPariwisata = Category::updateOrCreate(
            ['slug' => 'putra-putri-pariwisata-nusantara-2026'],
            [
                'event_id'           => $eventPariwisata->id,
                'tier'               => 'premier',
                'sort_order'         => 1,
                'name'               => 'Putra Putri Pariwisata Favorit 2026',
                'thumbnail'          => 'categories/thumb_duta_pariwisata.jpg',
                'organizer'          => 'Yayasan Pariwisata & Budaya Indonesia',
                'start_date'         => '2026-09-01',
                'end_date'           => '2026-10-31',
                'status'             => 'active',
                'price_per_vote'     => 1000,
                'allow_free_vote'    => true,
                'freeze_leaderboard' => false,
                'description'        => 'Ajang pemilihan resmi Duta Pariwisata & Pelestari Budaya Nusantara 2026. Dukung finalis favorit Anda untuk memajukan pesona wisata Indonesia!',
            ]
        );

        $finalistsPariwisata = [
            [
                'name'        => 'Anindya Kusuma Wardhani',
                'photo'       => 'finalists/anindya_kusuma.jpg',
                'description' => 'Perwakilan D.I. Yogyakarta • Mahasiswi Pariwisata & Seni Budaya UGM',
                'bio'         => 'Muda, berbudaya, dan berdaya saing global untuk pariwisata berkelanjutan.',
                'social_ig'   => 'anindyakusuma.w',
                'vote_count'  => 1680,
            ],
            [
                'name'        => 'Dimas Arya Pratama',
                'photo'       => 'finalists/dimas_arya.jpg',
                'description' => 'Perwakilan DKI Jakarta • Abang None Jakarta & Penggiat Heritage',
                'bio'         => 'Melangkah lestarikan adat & pesona bahari Nusantara ke kancah dunia.',
                'social_ig'   => 'dimas_aryapratama',
                'vote_count'  => 1420,
            ],
            [
                'name'        => 'Cantika Putri Maharani',
                'photo'       => 'finalists/anindya_kusuma.jpg',
                'description' => 'Perwakilan Bali • Duta Ekowisata & Pelestari Tari Tradisional',
                'bio'         => 'Harmoni tradisi, seni, dan pariwisata ramah lingkungan pulau Dewata.',
                'social_ig'   => 'cantikaputri_bali',
                'vote_count'  => 1250,
            ],
            [
                'name'        => 'Bryan Christian Tan',
                'photo'       => 'finalists/dimas_arya.jpg',
                'description' => 'Perwakilan Sumatera Utara • Penggiat Promosi Geopark Danau Toba',
                'bio'         => 'Mendorong kearifan lokal Toba menjadi destinasi super prioritas dunia.',
                'social_ig'   => 'bryanchristian',
                'vote_count'  => 980,
            ],
        ];

        foreach ($finalistsPariwisata as $f) {
            Finalist::updateOrCreate(
                ['category_id' => $catPariwisata->id, 'name' => $f['name']],
                $f
            );
        }

        // 2. EVENT 2: Sound of Campus National Band & Vocal Championship 2026
        $eventMusic = Event::updateOrCreate(
            ['name' => 'Sound of Campus National Band & Vocal Championship 2026'],
            [
                'thumbnail'  => 'categories/thumb_festival_musik.jpg',
                'start_date' => '2026-09-10',
                'end_date'   => '2026-11-20',
                'status'     => 'active',
            ]
        );

        $catMusic = Category::updateOrCreate(
            ['slug' => 'sound-of-campus-band-championship-2026'],
            [
                'event_id'           => $eventMusic->id,
                'tier'               => 'premier',
                'sort_order'         => 1,
                'name'               => 'Band Indie Terfavorit Pilihan Publik',
                'thumbnail'          => 'categories/thumb_festival_musik.jpg',
                'organizer'          => 'SoundFest Lab & BEM Se-Indonesia',
                'start_date'         => '2026-09-10',
                'end_date'           => '2026-11-20',
                'status'             => 'active',
                'price_per_vote'     => 2000,
                'allow_free_vote'    => true,
                'freeze_leaderboard' => false,
                'description'        => 'Kompetisi musisi muda dan band kampus terbaik nasional. Berikan vote untuk mengantarkan band indie favoritmu ke panggung festival utama!',
            ]
        );

        $finalistsMusic = [
            [
                'name'        => 'The Velvet Horizon',
                'photo'       => 'finalists/the_velvet_horizon.jpg',
                'description' => 'Universitas Indonesia • Genre: Indie Pop / Britpop Revival',
                'bio'         => 'Nuansa melodi 90-an dengan aransemen modern yang energik dan emosional.',
                'social_ig'   => 'thevelvethorizon',
                'vote_count'  => 2150,
            ],
            [
                'name'        => 'Aruna & The Soundscape',
                'photo'       => 'finalists/the_velvet_horizon.jpg',
                'description' => 'Universitas Gadjah Mada • Genre: Folk Akustik / Etnik Kontemporer',
                'bio'         => 'Menyatukan alat musik tradisional bambu dengan sentuhan folk pop hangat.',
                'social_ig'   => 'arunasoundscape',
                'vote_count'  => 1890,
            ],
            [
                'name'        => 'Midnight Echoes',
                'photo'       => 'finalists/the_velvet_horizon.jpg',
                'description' => 'Institut Teknologi Bandung • Genre: Alternative Rock / Post-Punk',
                'bio'         => 'Rhythm dinamis, petikan distorsi tajam, dan vokal bertenaga tinggi.',
                'social_ig'   => 'midnightechoes_itb',
                'vote_count'  => 1470,
            ],
        ];

        foreach ($finalistsMusic as $f) {
            Finalist::updateOrCreate(
                ['category_id' => $catMusic->id, 'name' => $f['name']],
                $f
            );
        }

        // 3. BANNERS SLIDER (4 Banners: 3 Event Asli + 1 Sebaris Official)
        $bannersData = [
            [
                'title'      => 'Pemilihan Mahasiswa & Pemimpin Berprestasi 2026',
                'image'      => 'banners/banner_student_leader.jpg',
                'link_url'   => '/voting/pemilihan-ketua-bem-fakultas-ilmu-komputer-20262027',
                'sort_order' => 1,
                'is_active'  => true,
            ],
            [
                'title'      => 'Pemilihan Putra Putri Duta Pariwisata Nusantara 2026',
                'image'      => 'banners/banner_duta_pariwisata.jpg',
                'link_url'   => '/voting/putra-putri-pariwisata-nusantara-2026',
                'sort_order' => 2,
                'is_active'  => true,
            ],
            [
                'title'      => 'Sound of Campus National Band & Vocal Championship 2026',
                'image'      => 'banners/banner_festival_musik.jpg',
                'link_url'   => '/voting/sound-of-campus-band-championship-2026',
                'sort_order' => 3,
                'is_active'  => true,
            ],
            [
                'title'      => 'Sebaris.id - Solusi E-Voting Resmi, Aman, & Terpercaya',
                'image'      => 'banners/banner_sebaris_official.jpg',
                'link_url'   => '#voting-section',
                'sort_order' => 4,
                'is_active'  => true,
            ],
        ];

        Banner::truncate();
        foreach ($bannersData as $b) {
            Banner::create($b);
        }
    }
}
