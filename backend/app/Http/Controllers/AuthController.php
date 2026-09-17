<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function applicantLogin(Request $request): JsonResponse
    {
        return $this->login($request, 'applicant');
    }

    public function reviewerLogin(Request $request): JsonResponse
    {
        return $this->login($request, 'reviewer');
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'ログアウトしました。']);
    }

    private function login(Request $request, string $role): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()
            ->where('email', $credentials['email'])
            ->where('role', $role)
            ->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => 'メールアドレスまたはパスワードが正しくありません。',
            ]);
        }

        $user->tokens()->where('name', "{$role}-web")->delete();

        return response()->json([
            'token' => $user->createToken("{$role}-web")->plainTextToken,
            'user' => $user,
        ]);
    }
}
