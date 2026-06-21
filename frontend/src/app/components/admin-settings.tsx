"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AdminLayout } from "./admin-sidebar";
import { apiGetSettings, apiSaveSettings } from "./api";

export function AdminSettings() {
  const [form, setForm] = useState({
    platformName: "Quizzify",
    maxTabSwitches: 3,
    negativeMarking: false,
    autoSubmit: true,
    allowRetakes: false,
    questionShuffle: true,
    emailNotifications: true,
    maintenanceMode: false,
  });

  const [saving, setSaving] = useState(false);

  // Load saved settings from backend on component mount
  useEffect(() => {
    async function load() {
      try {
        const data = await apiGetSettings();
        if (data && Object.keys(data).length > 0) {
          setForm(data);
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      }
    }
    load();
  }, []);

  const toggle = (key: keyof typeof form) =>
    setForm((f) => ({ ...f, [key]: !f[key] }));

  const Toggle = ({ id, value }: { id: keyof typeof form; value: boolean }) => (
    <button
      type="button"
      onClick={() => toggle(id)}
      className={`relative inline-flex items-center w-12 h-7 rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${value ? "bg-black" : "bg-gray-200"}`}
    >
      <span
        className={`inline-block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${value ? "translate-x-6" : "translate-x-1"}`}
      />
    </button>
  );

  const saveSettings = async () => {
    setSaving(true);
    try {
      await apiSaveSettings(form);
      toast.success("Settings saved successfully");
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-black">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Configure platform preferences</p>
      </div>

      <div className="max-w-xl space-y-4">
        {/* General */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-black mb-4">General</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-gray-700">Platform Name <span className="text-red-500">*</span></label>
                <span className="text-[10px] text-gray-400">{form.platformName.length}/50</span>
              </div>
              <input
                required
                maxLength={50}
                value={form.platformName}
                onChange={(e) => setForm({ ...form, platformName: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Max Tab Switches Allowed <span className="text-red-500">*</span></label>
              <input
                type="number"
                required
                value={form.maxTabSwitches}
                onChange={(e) => setForm({ ...form, maxTabSwitches: +e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black"
                min={0}
                max={10}
              />
            </div>
          </div>
        </div>

        {/* Quiz settings */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-black mb-4">Quiz Configuration</h3>
          <div className="space-y-4">
            {[{ key: "negativeMarking" as const, label: "Enable Negative Marking", desc: "Deduct marks for wrong answers" },
              { key: "autoSubmit" as const, label: "Auto-Submit on Timeout", desc: "Automatically submit when timer ends" },
              { key: "allowRetakes" as const, label: "Allow Retakes", desc: "Users can retake the same quiz" },
              { key: "questionShuffle" as const, label: "Shuffle Questions", desc: "Randomize question order for each attempt" }].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-black">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                  <Toggle id={key} value={form[key] as boolean} />
                </div>
              ))}
          </div>
        </div>

        {/* System */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-black mb-4">System</h3>
          <div className="space-y-4">
            {[{ key: "emailNotifications" as const, label: "Email Notifications", desc: "Send result emails to users" },
              { key: "maintenanceMode" as const, label: "Maintenance Mode", desc: "Temporarily disable the platform for users" }].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-black">{label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                  </div>
                  <Toggle id={key} value={form[key] as boolean} />
                </div>
              ))}
          </div>
        </div>

        <button
          onClick={saveSettings}
          disabled={saving}
          className={`w-full bg-black text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors ${saving ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </AdminLayout>
  );
}
