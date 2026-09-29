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
        // =========================================================================
        // 1. EVENT 1: Pemilihan Putra Putri Duta Pariwisata Nusantara 2026 (1 Kategori)
        // =========================================================================
        $eventPariwisata = Event::updateOrCreate(
            ['name' => 'Pemilihan Putra Putri Duta Pariwisata Nusantara 2026'],
            [
                'thumbnail'   => 'categories/thumb_duta_pariwisata.jpg',
                'theme_color' => '#EAB308',
                'start_date'  => '2026-09-01',
                'end_date'    => '2026-10-31',
                'status'      => 'active',
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
                'theme_color'        => '#EAB308',
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
                'vote_count'  => 1880,
            ],
            [
                'name'        => 'Dimas Arya Pratama',
                'photo'       => 'finalists/dimas_arya.jpg',
                'description' => 'Perwakilan DKI Jakarta • Abang None Jakarta & Penggiat Heritage',
                'bio'         => 'Melangkah lestarikan adat & pesona bahari Nusantara ke kancah dunia.',
                'social_ig'   => 'dimas_aryapratama',
                'vote_count'  => 1620,
            ],
            [
                'name'        => 'Cantika Putri Maharani',
                'photo'       => 'finalists/anindya_kusuma.jpg',
                'description' => 'Perwakilan Bali • Duta Ekowisata & Pelestari Tari Tradisional',
                'bio'         => 'Harmoni tradisi, seni, dan pariwisata ramah lingkungan pulau Dewata.',
                'social_ig'   => 'cantikaputri_bali',
                'vote_count'  => 1350,
            ],
            [
                'name'        => 'Bryan Christian Tan',
                'photo'       => 'finalists/dimas_arya.jpg',
                'description' => 'Perwakilan Sumatera Utara • Penggiat Promosi Geopark Danau Toba',
                'bio'         => 'Mendorong kearifan lokal Toba menjadi destinasi super prioritas dunia.',
                'social_ig'   => 'bryanchristian',
                'vote_count'  => 1080,
            ],
        ];

        foreach ($finalistsPariwisata as $f) {
            Finalist::updateOrCreate(
                ['category_id' => $catPariwisata->id, 'name' => $f['name']],
                $f
            );
        }

        // =========================================================================
        // 2. EVENT 2: Sound of Campus National Band & Vocal Championship 2026 (1 Kategori)
        // =========================================================================
        $eventMusic = Event::updateOrCreate(
            ['name' => 'Sound of Campus National Band & Vocal Championship 2026'],
            [
                'thumbnail'   => 'categories/thumb_festival_musik.jpg',
                'theme_color' => '#8B5CF6',
                'start_date'  => '2026-09-10',
                'end_date'    => '2026-11-20',
                'status'      => 'active',
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
                'theme_color'        => '#8B5CF6',
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

        // =========================================================================
        // 3. EVENT 3: National Youth Innovator & Startup Arena 2026 (2 Kategori)
        // =========================================================================
        $eventStartup = Event::updateOrCreate(
            ['name' => 'National Youth Innovator & Startup Arena 2026'],
            [
                'thumbnail'   => 'categories/thumb_startup_innovator.jpg',
                'theme_color' => '#0284C7',
                'start_date'  => '2026-09-15',
                'end_date'    => '2026-11-30',
                'status'      => 'active',
            ]
        );

        // Kategori 1: Early-Stage Tech Startup
        $catTech = Category::updateOrCreate(
            ['slug' => 'early-stage-tech-startup-2026'],
            [
                'event_id'           => $eventStartup->id,
                'tier'               => 'premier',
                'sort_order'         => 1,
                'name'               => 'Early-Stage Tech Startup Terfavorit 2026',
                'thumbnail'          => 'categories/thumb_tech_startup.jpg',
                'theme_color'        => '#0284C7',
                'organizer'          => 'Indonesia Innovation & Tech Hub',
                'start_date'         => '2026-09-15',
                'end_date'           => '2026-11-30',
                'status'             => 'active',
                'price_per_vote'     => 1000,
                'allow_free_vote'    => true,
                'freeze_leaderboard' => false,
                'description'        => 'Kompetisi startup teknologi rintisan mahasiswa dan pemuda paling inovatif se-Indonesia dalam bidang AI, SaaS, dan Green Technology.',
            ]
        );

        $finalistsTech = [
            [
                'name'        => 'NexaHealth AI',
                'photo'       => 'finalists/nexahealth_ai.jpg',
                'description' => 'Founder: Adrian Setiawan • Solusi Skrining Kesehatan AI Telemedicine 3T',
                'bio'         => 'Demokratisasi akses diagnosa dini kesehatan untuk jutaan masyarakat di pelosok nusantara.',
                'social_ig'   => 'nexahealth.id',
                'vote_count'  => 2310,
            ],
            [
                'name'        => 'WasteWise Zero Waste Tech',
                'photo'       => 'finalists/wastewise_tech.jpg',
                'description' => 'Founder: Sabrina Anggraini • Platform Integrasi Sampah Cerdas & IoT',
                'bio'         => 'Ubah timbulan sampah kota menjadi komoditas energi terbarukan bernilai ekonomi tinggi.',
                'social_ig'   => 'wastewise.eco',
                'vote_count'  => 1940,
            ],
            [
                'name'        => 'EduPintar Learning Studio',
                'photo'       => 'finalists/edupintar_studio.jpg',
                'description' => 'Founder: Fikri Ramadhan • Modul Gamifikasi Sains Interaktif Anak',
                'bio'         => 'Menjadikan belajar sains dan logika semenyenangkan bermain game digital interaktif.',
                'social_ig'   => 'edupintar.app',
                'vote_count'  => 1520,
            ],
        ];

        foreach ($finalistsTech as $f) {
            Finalist::updateOrCreate(
                ['category_id' => $catTech->id, 'name' => $f['name']],
                $f
            );
        }

        // Kategori 2: Social Impact & Sustainable Initiative
        $catImpact = Category::updateOrCreate(
            ['slug' => 'social-impact-sustainable-2026'],
            [
                'event_id'           => $eventStartup->id,
                'tier'               => 'standard',
                'sort_order'         => 2,
                'name'               => 'Social Impact & Sustainable Initiative 2026',
                'thumbnail'          => 'categories/thumb_social_impact.jpg',
                'theme_color'        => '#059669',
                'organizer'          => 'Yayasan Penggerak Dampak Sosial Indonesia',
                'start_date'         => '2026-09-15',
                'end_date'           => '2026-11-30',
                'status'             => 'active',
                'price_per_vote'     => 1000,
                'allow_free_vote'    => true,
                'freeze_leaderboard' => false,
                'description'        => 'Apresiasi gerakan sosial dan inisiatif pemberdayaan masyarakat akar rumput berkelanjutan di bidang kelestarian alam dan pendidikan.',
            ]
        );

        $finalistsImpact = [
            [
                'name'        => 'MangroveGuard Coastal Action',
                'photo'       => 'finalists/mangrove_guard.jpg',
                'description' => 'Inisiator: Ilham Kurniawan • Restorasi Pesisir & Digital Tracker Mangrove',
                'bio'         => 'Menjaga benteng pesisir nusantara dari bahaya abrasi melalui kolaborasi pentahelix pemuda.',
                'social_ig'   => 'mangroveguard.id',
                'vote_count'  => 1840,
            ],
            [
                'name'        => 'Pena Nusantara Edu-Movement',
                'photo'       => 'finalists/pena_nusantara.jpg',
                'description' => 'Inisiator: Nadia Safira • 50+ Rumah Baca & Guru Relawan Pulau 3T',
                'bio'         => 'Satu buku, seribu senyuman harapan untuk masa depan adik-adik generasi penerus bangsa.',
                'social_ig'   => 'penanusantara.or.id',
                'vote_count'  => 1610,
            ],
            [
                'name'        => 'Bina Tani Muda Indonesia',
                'photo'       => 'finalists/bina_tani_muda.jpg',
                'description' => 'Inisiator: Bayu Wicaksono • Modernisasi Agrikultur Presisi & Hidroponik',
                'bio'         => 'Pemuda bangga bertani, menjaga kedaulatan dan ketahanan pangan nusantara masa depan.',
                'social_ig'   => 'binatanimuda',
                'vote_count'  => 1230,
            ],
        ];

        foreach ($finalistsImpact as $f) {
            Finalist::updateOrCreate(
                ['category_id' => $catImpact->id, 'name' => $f['name']],
                $f
            );
        }

        // =========================================================================
        // 4. EVENT 4: Festival Film Pendek & Kreator Sinema Nusantara 2026 (3 Kategori)
        // =========================================================================
        $eventFilm = Event::updateOrCreate(
            ['name' => 'Festival Film Pendek & Kreator Sinema Nusantara 2026'],
            [
                'thumbnail'   => 'categories/thumb_festival_film.jpg',
                'theme_color' => '#EA580C',
                'start_date'  => '2026-09-20',
                'end_date'    => '2026-12-15',
                'status'      => 'active',
            ]
        );

        // Kategori 1: Film Pendek Fiksi
        $catFilmFiksi = Category::updateOrCreate(
            ['slug' => 'film-pendek-fiksi-nusantara-2026'],
            [
                'event_id'           => $eventFilm->id,
                'tier'               => 'premier',
                'sort_order'         => 1,
                'name'               => 'Film Pendek Fiksi Terfavorit 2026',
                'thumbnail'          => 'categories/thumb_film_fiksi.jpg',
                'theme_color'        => '#EA580C',
                'organizer'          => 'Dewan Sinema Muda Indonesia',
                'start_date'         => '2026-09-20',
                'end_date'           => '2026-12-15',
                'status'             => 'active',
                'price_per_vote'     => 1500,
                'allow_free_vote'    => true,
                'freeze_leaderboard' => false,
                'description'        => 'Kompetisi karya film pendek naratif fiksi terbaik karya sineas muda Indonesia dengan narasi lokal yang menggugah emosi.',
            ]
        );

        $finalistsFilmFiksi = [
            [
                'name'        => 'Di Balik Kabut Merapi',
                'photo'       => 'finalists/film_merapi.jpg',
                'description' => 'Sutradara: Farhan Alamsyah • Durasi: 19 Menit • Drama Kearifan Lokal',
                'bio'         => 'Kisah tentang janji seorang anak lereng gunung menjaga warisan doa sang kakek.',
                'social_ig'   => 'dibalikkabut.film',
                'vote_count'  => 2580,
            ],
            [
                'name'        => 'Surat Terakhir Untuk Ibu',
                'photo'       => 'finalists/film_surat_ibu.jpg',
                'description' => 'Sutradara: Nadira Ramadhani • Durasi: 15 Menit • Drama Keluarga Mengharukan',
                'bio'         => 'Refleksi kerinduan anak rantau di hiruk-pikuk metropolitan terhadap kehangatan ibu.',
                'social_ig'   => 'suratuntukibu.movie',
                'vote_count'  => 2140,
            ],
            [
                'name'        => 'Langkah di Bawah Gerimis',
                'photo'       => 'finalists/film_langkah_gerimis.jpg',
                'description' => 'Sutradara: Rizky Aditya • Durasi: 18 Menit • Romansa Realis Stasiun Tua',
                'bio'         => 'Pertemuan tak terduga dua jiwa di halte stasiun tua kota hujan.',
                'social_ig'   => 'langkahgerimis.film',
                'vote_count'  => 1790,
            ],
        ];

        foreach ($finalistsFilmFiksi as $f) {
            Finalist::updateOrCreate(
                ['category_id' => $catFilmFiksi->id, 'name' => $f['name']],
                $f
            );
        }

        // Kategori 2: Dokumenter Budaya & Sejarah
        $catDokumenter = Category::updateOrCreate(
            ['slug' => 'dokumenter-budaya-sejarah-2026'],
            [
                'event_id'           => $eventFilm->id,
                'tier'               => 'standard',
                'sort_order'         => 2,
                'name'               => 'Dokumenter Budaya & Sejarah 2026',
                'thumbnail'          => 'categories/thumb_film_dokumenter.jpg',
                'theme_color'        => '#D97706',
                'organizer'          => 'Lembaga Dokumenter Kebudayaan Nasional',
                'start_date'         => '2026-09-20',
                'end_date'           => '2026-12-15',
                'status'             => 'active',
                'price_per_vote'     => 1500,
                'allow_free_vote'    => true,
                'freeze_leaderboard' => false,
                'description'        => 'Eksplorasi visual merekam jejak tradisi leluhur, maestro kesenian tradisional, dan kearifan masa lampau Indonesia.',
            ]
        );

        $finalistsDokumenter = [
            [
                'name'        => 'Melodi Tenun Sumba',
                'photo'       => 'finalists/dok_tenun_sumba.jpg',
                'description' => 'Dokumenter Etnografi • Ketekunan mama penenun motif sakral di Sumba Timur',
                'bio'         => 'Setiap helai benang bukan sekadar warna, melainkan doa dan filosofi kehidupan purba.',
                'social_ig'   => 'meloditenunsumba',
                'vote_count'  => 1920,
            ],
            [
                'name'        => 'Sang Penjaga Wayang Kulit',
                'photo'       => 'finalists/dok_wayang_kulit.jpg',
                'description' => 'Dokumenter Maestro • Dedikasi dalang sepuh 78 tahun melestarikan pakem wayang',
                'bio'         => 'Menolak punah, melestarikan bayang-bayang filosofi leluhur di era modernisasi.',
                'social_ig'   => 'penjagawayang.id',
                'vote_count'  => 1630,
            ],
            [
                'name'        => 'Garam Laut Karangasem',
                'photo'       => 'finalists/dok_garam_bali.jpg',
                'description' => 'Dokumenter Kearifan Bahari • Tradisi garam organik kuno di pesisir Kusamba',
                'bio'         => 'Menguapkan air laut di batang kelapa warisan leluhur menghasilkan kristal garam termurni.',
                'social_ig'   => 'garambalikarasem',
                'vote_count'  => 1310,
            ],
        ];

        foreach ($finalistsDokumenter as $f) {
            Finalist::updateOrCreate(
                ['category_id' => $catDokumenter->id, 'name' => $f['name']],
                $f
            );
        }

        // Kategori 3: Kreator Sinematografi Visual
        $catSinematografi = Category::updateOrCreate(
            ['slug' => 'sinematografi-visual-kreator-2026'],
            [
                'event_id'           => $eventFilm->id,
                'tier'               => 'standard',
                'sort_order'         => 3,
                'name'               => 'Kreator Sinematografi Visual Terfavorit',
                'thumbnail'          => 'categories/thumb_sinematografi.jpg',
                'theme_color'        => '#C2410C',
                'organizer'          => 'Asosiasi Kreator Visual Digital',
                'start_date'         => '2026-09-20',
                'end_date'           => '2026-12-15',
                'status'             => 'active',
                'price_per_vote'     => 1000,
                'allow_free_vote'    => true,
                'freeze_leaderboard' => false,
                'description'        => 'Penghargaan sinematografi terbaik untuk pencahayaan, grading warna sinematik, dan estetika visual yang memanjakan mata.',
            ]
        );

        $finalistsSinematografi = [
            [
                'name'        => 'Bagus Arya Cinematography',
                'photo'       => 'finalists/kreator_bagus_arya.jpg',
                'description' => 'Director of Photography • Karya: Lembah Bromo dalam Cahaya Emas',
                'bio'         => 'Menangkap magis lanskap nusantara dengan komposisi visual dramatis dan sinematik.',
                'social_ig'   => 'bagusarya.dp',
                'vote_count'  => 1850,
            ],
            [
                'name'        => 'Citra Visual Studio',
                'photo'       => 'finalists/kreator_citra_visual.jpg',
                'description' => 'Kolektif Sinematik Yogyakarta • Karya: Symphony of Borobudur Sunrise',
                'bio'         => 'Menghadirkan storytelling visual puitis lewat perpaduan cahaya alami dan komposisi klasik.',
                'social_ig'   => 'citravisual.lab',
                'vote_count'  => 1680,
            ],
            [
                'name'        => 'Devan Yudhistira Reel',
                'photo'       => 'finalists/kreator_devan_yudha.jpg',
                'description' => 'Drone Specialist • Karya: Nusantara dari Sudut Cakrawala',
                'bio'         => 'Mengeksplorasi estetika arsitektur dan alam Indonesia dari sudut pandang udara megah.',
                'social_ig'   => 'devanyudha.cine',
                'vote_count'  => 1420,
            ],
        ];

        foreach ($finalistsSinematografi as $f) {
            Finalist::updateOrCreate(
                ['category_id' => $catSinematografi->id, 'name' => $f['name']],
                $f
            );
        }

        // =========================================================================
        // 5. EVENT 5: Pemilihan Putra Putri Busana Etnik & Kebaya Modis Indonesia 2026 (2 Kategori)
        // =========================================================================
        $eventFashion = Event::updateOrCreate(
            ['name' => 'Pemilihan Putra Putri Busana Etnik & Kebaya Modis Indonesia 2026'],
            [
                'thumbnail'   => 'categories/thumb_fashion_etnik.jpg',
                'theme_color' => '#16A34A',
                'start_date'  => '2026-09-25',
                'end_date'    => '2026-11-28',
                'status'      => 'active',
            ]
        );

        // Kategori 1: Putra Busana Etnik
        $catPutraEtnik = Category::updateOrCreate(
            ['slug' => 'putra-busana-etnik-2026'],
            [
                'event_id'           => $eventFashion->id,
                'tier'               => 'premier',
                'sort_order'         => 1,
                'name'               => 'Putra Busana Etnik Kontemporer 2026',
                'thumbnail'          => 'categories/thumb_putra_etnik.jpg',
                'theme_color'        => '#16A34A',
                'organizer'          => 'Dewan Mode & Kriya Tradisi Indonesia',
                'start_date'         => '2026-09-25',
                'end_date'           => '2026-11-28',
                'status'             => 'active',
                'price_per_vote'     => 1000,
                'allow_free_vote'    => true,
                'freeze_leaderboard' => false,
                'description'        => 'Ajang unjuk karya busana pria memadukan tenun, batik, dan lurik tradisional dengan potongan jas dan streetwear modern.',
            ]
        );

        $finalistsPutraEtnik = [
            [
                'name'        => 'Reza Bagus Wicaksono',
                'photo'       => 'finalists/reza_bagus.jpg',
                'description' => 'Perwakilan Surakarta • Busana: Lurik Modern Warrior Runway Look',
                'bio'         => 'Membuktikan bahwa kain lurik tradisional sangat berkelas dan elegan di runway dunia.',
                'social_ig'   => 'rezabagus.w',
                'vote_count'  => 2240,
            ],
            [
                'name'        => 'Rafi Ahmad Syauqi',
                'photo'       => 'finalists/rafi_syauqi.jpg',
                'description' => 'Perwakilan Bandung • Busana: Batik Garutan Blazer Siluet Kasual',
                'bio'         => 'Menginspirasi generasi muda bangga berbatik dalam gaya formal maupun santai kekinian.',
                'social_ig'   => 'rafisyauqi_',
                'vote_count'  => 1890,
            ],
            [
                'name'        => 'Kevin Sanjaya Manoppo',
                'photo'       => 'finalists/kevin_sanjaya.jpg',
                'description' => 'Perwakilan Manado • Busana: Tenun Bentenan Formal Vest Minahasa',
                'bio'         => 'Menghidupkan kemegahan wastra Sulawesi Utara dalam gaya busana pria metropolitan.',
                'social_ig'   => 'kevinsanjaya_m',
                'vote_count'  => 1530,
            ],
        ];

        foreach ($finalistsPutraEtnik as $f) {
            Finalist::updateOrCreate(
                ['category_id' => $catPutraEtnik->id, 'name' => $f['name']],
                $f
            );
        }

        // Kategori 2: Putri Kebaya Modis
        $catPutriKebaya = Category::updateOrCreate(
            ['slug' => 'putri-kebaya-modis-2026'],
            [
                'event_id'           => $eventFashion->id,
                'tier'               => 'premier',
                'sort_order'         => 2,
                'name'               => 'Putri Kebaya Modis & Wastra Anggun 2026',
                'thumbnail'          => 'categories/thumb_putri_kebaya.jpg',
                'theme_color'        => '#15803D',
                'organizer'          => 'Komunitas Kebaya & Wastra Sahabat Kartini',
                'start_date'         => '2026-09-25',
                'end_date'           => '2026-11-28',
                'status'             => 'active',
                'price_per_vote'     => 1000,
                'allow_free_vote'    => true,
                'freeze_leaderboard' => false,
                'description'        => 'Pemilihan putri duta kebaya modern dan pelestari wastra Nusantara dengan pesona keanggunan wanita Indonesia.',
            ]
        );

        $finalistsPutriKebaya = [
            [
                'name'        => 'Alya Zahra Maharani',
                'photo'       => 'finalists/alya_zahra.jpg',
                'description' => 'Perwakilan Jakarta Selatan • Kebaya Encim Bordir Gradasi Hijau Emas',
                'bio'         => 'Keanggunan kebaya adalah cerminan martabat, ketulusan, dan kekuatan wanita Indonesia.',
                'social_ig'   => 'alyazahra.m',
                'vote_count'  => 2640,
            ],
            [
                'name'        => 'Nadia Clarissa Larasati',
                'photo'       => 'finalists/nadia_clarissa.jpg',
                'description' => 'Perwakilan D.I. Yogyakarta • Kebaya Kutubaru Beludru Klasik & Batik Sido Asih',
                'bio'         => 'Mewarisi keanggunan keraton dengan wawasan global untuk pemuda masa depan.',
                'social_ig'   => 'nadiaclarissa.l',
                'vote_count'  => 2280,
            ],
            [
                'name'        => 'Sherly Amanda Putri',
                'photo'       => 'finalists/sherly_amanda.jpg',
                'description' => 'Perwakilan Surabaya • Kebaya Modern Asimetris Songket Palembang',
                'bio'         => 'Harmonisasi ragam wastra daerah dalam satu gaun kebaya adibusana Indonesia.',
                'social_ig'   => 'sherlyamandap',
                'vote_count'  => 1810,
            ],
        ];

        foreach ($finalistsPutriKebaya as $f) {
            Finalist::updateOrCreate(
                ['category_id' => $catPutriKebaya->id, 'name' => $f['name']],
                $f
            );
        }

        // =========================================================================
        // BANNERS SLIDER (4 Banners Utama)
        // =========================================================================
        $bannersData = [
            [
                'title'      => 'Pemilihan Mahasiswa & Pemimpin Berprestasi 2026',
                'image'      => 'banners/banner_student_leader.jpg',
                'link_url'   => '/voting/putra-putri-pariwisata-nusantara-2026',
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
