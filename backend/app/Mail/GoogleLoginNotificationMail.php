<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class GoogleLoginNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $name;
    public string $email;
    public string $time;
    public ?string $ip;
    public string $appUrl;

    /**
     * Create a new message instance.
     */
    public function __construct(string $name, string $email, ?string $ip = null)
    {
        $this->name = $name;
        $this->email = $email;
        $this->ip = $ip;
        $this->time = now()->timezone('Asia/Jakarta')->format('d F Y, H:i') . ' WIB';
        $this->appUrl = config('app.url', 'http://localhost:5173');
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Notifikasi Masuk Akun Google — Sebaris.id',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.google_login',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
