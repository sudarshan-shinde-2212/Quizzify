import { useState } from "react";
import { AdminLayout } from "./admin-sidebar";

export function AdminSettings() {
  const [form, setForm] = useState({
    platformName: "Quizzify",
    maxTabSwitches: 3,
    negativeMarking: false,
    autoSubmit: true,
    allowRetakes: false,
    emailNotifications: true,
    maintenanceMode: false,
  });

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
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Platform Name</label>
              <input
                value={form.platformName}
                onChange={(e) => setForm({ ...form, platformName: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Max Tab Switches Allowed</label>
              <input
                type="number"
                value={form.maxTabSwitches}
                onChange={(e) => setForm({ ...form, maxTabSwitches: +e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black"
                min={1}
                max={10}
              />
            </div>
          </div>
        </div>

        {/* Quiz settings */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-black mb-4">Quiz Configuration</h3>
          <div className="space-y-4">
            {[
              { key: "negativeMarking" as const, label: "Enable Negative Marking", desc: "Deduct marks for wrong answers" },
              { key: "autoSubmit" as const, label: "Auto-Submit on Timeout", desc: "Automatically submit when timer ends" },
              { key: "allowRetakes" as const, label: "Allow Retakes", desc: "Users can retake the same quiz" },
            ].map(({ key, label, desc }) => (
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
            {[
              { key: "emailNotifications" as const, label: "Email Notifications", desc: "Send result emails to users" },
              { key: "maintenanceMode" as const, label: "Maintenance Mode", desc: "Temporarily disable the platform for users" },
            ].map(({ key, label, desc }) => (
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

        <button className="w-full bg-black text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors">
          Save Settings
        </button>
      </div>
    </AdminLayout>
  );
}
