<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AllowBearerFromQuery
{
    /**
     * Handle an incoming request.
     * Allows authenticated endpoints (such as CSV/Excel exports) to receive
     * the Sanctum Bearer token via the `?token=` query parameter when triggered
     * via window.open, <a> tags, or direct downloads.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->bearerToken() && $request->has('token')) {
            $token = $request->query('token');
            if (is_string($token) && !empty($token)) {
                $request->headers->set('Authorization', 'Bearer ' . $token);
            }
        }

        return $next($request);
    }
}
