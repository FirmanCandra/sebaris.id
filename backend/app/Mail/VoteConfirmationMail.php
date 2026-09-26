<?php

namespace App\Mail;

use App\Models\Vote;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VoteConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $voterName;
    public string $finalistName;
    public string $categoryName;
    public string $referenceId;
    public int    $voteAmount;
    public int    $totalPrice;
    public string $voteType;
    public string $votedAt;
    public string $appUrl;

    public function __construct(Vote $vote)
    {
        $this->voterName    = $vote->voter_name;
        $this->finalistName = $vote->finalist?->name ?? 'Kandidat';
        $this->categoryName = $vote->finalist?->category?->name ?? 'Voting';
        $this->referenceId  = $vote->reference_id ?? ('SVT-' . $vote->id);
        $this->voteAmount   = $vote->vote_amount ?? 1;
        $this->totalPrice   = $vote->total_price ?? 0;
        $this->voteType     = $vote->type === 'free' ? 'Gratis' : 'Berbayar';
        $this->votedAt      = now()->timezone('Asia/Jakarta')->format('d F Y, H:i') . ' WIB';
        $this->appUrl       = config('app.url', 'https://sebaris.id');
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Konfirmasi Vote Berhasil — {$this->categoryName} | Sebaris.id",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.vote_confirmation',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
