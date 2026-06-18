<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PasswordChangedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $userName;

    public function __construct(string $userName)
    {
        $this->userName = $userName;
    }

    public function build()
    {
        return $this->subject('Your password was changed')
            ->view('emails.password_changed')
            ->with([
                'userName' => $this->userName,
            ]);
    }
}


