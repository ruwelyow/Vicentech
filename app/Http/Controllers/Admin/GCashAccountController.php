<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GCashAccountSetting;
use Illuminate\Http\Request;

class GCashAccountController extends Controller
{
    public function index()
    {
        $settings = GCashAccountSetting::orderBy('created_at', 'desc')->get();
        return response()->json($settings);
    }

    public function store(Request $request)
    {
        $request->validate([
            'account_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:20',
        ]);

        $setting = GCashAccountSetting::create([
            'account_name' => $request->account_name,
            'account_number' => $request->account_number,
            'enabled' => true
        ]);

        return response()->json($setting, 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'account_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:20',
        ]);

        $setting = GCashAccountSetting::findOrFail($id);
        $setting->update([
            'account_name' => $request->account_name,
            'account_number' => $request->account_number,
        ]);

        return response()->json($setting);
    }

    public function toggle($id)
    {
        $setting = GCashAccountSetting::findOrFail($id);
        $setting->update(['enabled' => !$setting->enabled]);
        
        return response()->json($setting);
    }

    public function destroy($id)
    {
        $setting = GCashAccountSetting::findOrFail($id);
        $setting->delete();
        
        return response()->json(['message' => 'GCash account setting deleted successfully']);
    }
}
