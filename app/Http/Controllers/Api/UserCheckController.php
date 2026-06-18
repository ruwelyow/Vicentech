<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;

class UserCheckController extends Controller
{
    /**
     * Normalize a name by:
     * - lowercasing
     * - removing punctuation
     * - removing common suffixes (jr, jr., junior, sr, sr., senior, ii, iii, iv, v)
     * - collapsing extra whitespace
     * Returns an array of tokens (words) for comparison.
     */
    private function normalizeNameTokens(string $name, bool $removeSuffixes = true): array
    {
        $suffixes = [
            'jr', 'jr.', 'junior',
            'sr', 'sr.', 'senior',
            'ii', 'iii', 'iv', 'v'
        ];

        // Lowercase & remove punctuation except spaces
        $clean = strtolower($name);
        $clean = preg_replace('/[\.,]/', ' ', $clean); // replace . and , with spaces
        $clean = preg_replace('/\s+/', ' ', $clean ?? '');
        $clean = trim($clean);

        // Tokenize
        $tokens = $clean === '' ? [] : explode(' ', $clean);

        // Optionally remove suffix tokens when comparing "base" names
        if ($removeSuffixes) {
            $tokens = array_values(array_filter($tokens, function ($t) use ($suffixes) {
                return !in_array($t, $suffixes, true);
            }));
        }

        return $tokens;
    }

    private function fullNameFromParts(?string $first, ?string $middle, ?string $last, ?string $suffix): string
    {
        $parts = [];
        if ($first) $parts[] = trim($first);
        if ($middle) $parts[] = trim($middle);
        if ($last) $parts[] = trim($last);
        if ($suffix) $parts[] = trim($suffix);
        return trim(implode(' ', array_filter($parts, fn($p) => $p !== '')));
    }

    /**
     * Advanced name existence check supporting both single `name` and separated fields.
     */
    public function checkName(Request $request)
    {
        $data = $request->validate([
            'name' => 'sometimes|nullable|string|max:255',
            'first_name' => 'sometimes|nullable|string|max:100',
            'middle_name' => 'sometimes|nullable|string|max:100',
            'last_name' => 'sometimes|nullable|string|max:100',
            'suffix' => 'sometimes|nullable|string|max:20',
        ]);

        // Prefer separated parts when either first_name or last_name provided; otherwise use single name
        $usingParts = !empty($data['first_name']) || !empty($data['last_name']);
        $inputName = $usingParts
            ? $this->fullNameFromParts(
                $data['first_name'] ?? null,
                $data['middle_name'] ?? null,
                $data['last_name'] ?? null,
                $data['suffix'] ?? null
              )
            : ($data['name'] ?? '');

    // Determine whether the request explicitly provided a suffix.
    // If the client provided a separate `suffix` field, keep the suffix token
    // in the requested tokens so that it can distinguish names (e.g. "Jr").
    $explicitSuffixProvided = !empty($data['suffix']);
    $requestedTokens = $this->normalizeNameTokens($inputName, $explicitSuffixProvided ? false : true);

        if (empty($requestedTokens)) {
            return response()->json(['exists' => false]);
        }

        // Load all user names (only the name column) and compare using normalization
        // Compare tokens. If the request included an explicit suffix we only
        // match against existing names that also include that suffix. If the
        // request did NOT include a suffix we fall back to the base-name
        // comparison (suffixes on existing names are ignored).
        $exists = User::query()
            ->select('name')
            ->get()
            ->contains(function ($user) use ($requestedTokens, $explicitSuffixProvided) {
                if ($explicitSuffixProvided) {
                    // Compare against existing name tokens while keeping suffixes
                    $existingWithSuffix = $this->normalizeNameTokens($user->name ?? '', false);
                    return $existingWithSuffix === $requestedTokens;
                }

                // No explicit suffix in request: compare base tokens (suffixes ignored)
                $existingBase = $this->normalizeNameTokens($user->name ?? '', true);
                return $existingBase === $requestedTokens;
            });

        return response()->json(['exists' => $exists]);
    }
}
