"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AdminLayout } from "./admin-sidebar";
import { apiGetSettings, apiSaveSettings } from "./api";

export function AdminSettings() {
  const [form, setForm] = useState({
    // platformName intentionally excluded from UI – stored in DB, read by Navbar
    // autoSubmit intentionally excluded from UI – stored in DB, read by quiz engine
    // negativeMarking intentionally excluded from UI – stored in DB, read by scoring engine
    maxTabSwitches: 3,
    allowRetakes: false,
    questionShuffle: true,
    maintenanceMode: false,
  });

  const [saving, setSaving] = useState(false);

  // Load saved settings from backend on component mount
  useEffect(() => {
    async function load() {
      try {
        const data = await apiGetSettings();
        if (data && Object.keys(data).length > 0) {
          // Only update the fields this UI manages.
          // platformName, autoSubmit, and negativeMarking are preserved in the
          // DB via the merge-patch in SettingsService but not exposed here.
          setForm((prev) => ({
            ...prev,
            maxTabSwitches: data.maxTabSwitches ?? prev.maxTabSwitches,
            allowRetakes: data.allowRetakes ?? prev.allowRetakes,
            questionShuffle: data.questionShuffle ?? prev.questionShuffle,
            maintenanceMode: data.maintenanceMode ?? prev.maintenanceMode,
          }));
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
        {/* General – Platform Name removed (stored in DB, displayed in Navbar) */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-black mb-4">General</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Max Tab Switches Allowed <span className="text-red-500">*</span>
              </label>
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

        {/* Quiz Configuration
            – negativeMarking removed (handled by quiz engine)
            – autoSubmit removed (stored in DB, read by quiz-page & instructions-page) */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-black mb-4">Quiz Configuration</h3>
          <div className="space-y-4">
            {([
              { key: "allowRetakes" as const, label: "Allow Retakes", desc: "Users can retake the same quiz" },
              { key: "questionShuffle" as const, label: "Shuffle Questions", desc: "Randomize question order for each attempt" },
            ]).map(({ key, label, desc }) => (
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
            {([
              { key: "maintenanceMode" as const, label: "Maintenance Mode", desc: "Temporarily disable the platform for users" },
            ]).map(({ key, label, desc }) => (
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
