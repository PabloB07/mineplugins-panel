"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/i18n/useTranslation";

interface Transfer {
  id: string;
  from_user_email: string;
  to_user_email: string;
  product_name: string;
  transferred_at: string;
}

interface User {
  id: string;
  email: string;
  name: string | null;
}

export default function AdminTransfersPage() {
  const { t } = useTranslation();
  
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [licenses, setLicenses] = useState<Array<{
    id: string;
    licenseKey: string;
    status: string;
    product: {
      name: string;
      slug: string;
    };
    user: {
      email: string;
      name: string | null;
    };
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [transferForm, setTransferForm] = useState({
    licenseId: "",
    targetUserId: "",
    targetEmail: "",
    durationDays: 365,
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transfersRes, licensesRes] = await Promise.all([
        fetch('/api/admin/transfers'),
        fetch('/api/licenses?limit=100'),
      ]);

      if (transfersRes.ok && licensesRes.ok) {
        const [transfersData, licensesData] = await Promise.all([
          transfersRes.json(),
          licensesRes.json(),
        ]);
        setTransfers(transfersData.transfers || []);
        setLicenses(licensesData.licenses || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query) {
      setUsers([]);
      return;
    }

    try {
      const response = await fetch(`/api/users?search=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferForm),
      });

      if (response.ok) {
        await fetchData();
        setTransferForm({ licenseId: "", targetUserId: "", targetEmail: "", durationDays: 365 });
        setUsers([]);
      } else {
        const error = await response.json();
        alert(error.error || 'Transfer failed');
      }
    } catch (error) {
      console.error('Transfer error:', error);
      alert('Transfer failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = 
      transfer.from_user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.to_user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.product_name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });
  
  const eligibleLicenses = licenses.filter(
    (license) => license.status === "ACTIVE"
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-[#111] border border-[#222] rounded-2xl p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/20 flex items-center justify-center">
              <span className="icon-minecraft icon-minecraft-paper scale-125"></span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                License Transfers
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Transfer licenses between users securely
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] rounded-lg border border-[#222]">
              <span className="icon-minecraft-sm icon-minecraft-paper"></span>
              <span className="text-sm text-gray-400">{filteredTransfers.length} Transfers</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] rounded-lg border border-[#222]">
              <span className="icon-minecraft-sm icon-minecraft-diamond-block"></span>
              <span className="text-sm text-gray-400">{eligibleLicenses.length} Ready</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="pixel-frame pixel-frame-neutral bg-[#111] rounded-xl border border-[#222] p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Transfer History</h2>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 icon-minecraft-sm icon-minecraft-clock" style={{ opacity: 0.5 }}></span>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500/50 w-48"
                />
              </div>
            </div>

            {filteredTransfers.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#181818] border border-[#333] flex items-center justify-center">
                  <span className="icon-minecraft icon-minecraft-paper opacity-50"></span>
                </div>
                <p className="text-gray-400 text-sm">No transfers found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransfers.map((transfer) => (
                  <div
                    key={transfer.id}
                    className="bg-[#0a0a0a]/50 rounded-lg p-4 border border-[#333] hover:border-green-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-white">
                            {transfer.product_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <span className="icon-minecraft-sm icon-minecraft-paper" style={{ opacity: 0.5 }}></span>
                            {transfer.from_user_email} → {transfer.to_user_email}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="icon-minecraft-sm icon-minecraft-clock" style={{ opacity: 0.5 }}></span>
                            {new Date(transfer.transferred_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="icon-minecraft-sm icon-minecraft-diamond-block"></span>
                        <span className="text-xs text-green-400">Done</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="pixel-frame pixel-frame-neutral bg-[#111] rounded-xl border border-[#222] p-5">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="icon-minecraft-sm icon-minecraft-paper"></span>
              New Transfer
            </h2>
            
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target Customer
                </label>
                <input
                  type="text"
                  value={transferForm.targetEmail}
                  onChange={(e) => {
                    setTransferForm({ ...transferForm, targetEmail: e.target.value, targetUserId: "" });
                    searchUsers(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500/50"
                  placeholder="Search by email..."
                  required
                />
                
                {users.length > 0 && (
                  <div className="mt-2 bg-[#0a0a0a] border border-[#333] rounded-lg max-h-40 overflow-y-auto">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setTransferForm({ 
                            ...transferForm, 
                            targetEmail: user.email, 
                            targetUserId: user.id 
                          });
                          setUsers([]);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-[#181818] text-white text-sm transition-colors"
                      >
                        {user.email} {user.name && `(${user.name})`}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t("admin.selectLicenseActive")}
                </label>
                <select
                  value={transferForm.licenseId}
                  onChange={(e) => setTransferForm({ ...transferForm, licenseId: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-green-500/50"
                  required
                >
                  <option value="">{t("admin.chooseLicense")}</option>
                  {eligibleLicenses.map((license) => (
                    <option key={license.id} value={license.id}>
                      {license.product.name} • {license.licenseKey.substring(0, 8)}…
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  {eligibleLicenses.length} active license{eligibleLicenses.length === 1 ? "" : "s"} available
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Duration (days)
                </label>
                <input
                  type="number"
                  value={transferForm.durationDays}
                  onChange={(e) => setTransferForm({ ...transferForm, durationDays: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-green-500/50"
                  min="1"
                  max="1095"
                  required
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <span className="icon-minecraft-sm icon-minecraft-clock" style={{ opacity: 0.5 }}></span>
                  <div className="text-xs text-blue-300">
                    <p className="font-medium mb-1">Notice:</p>
                    <ul className="space-y-1">
                      <li>• Cannot be undone</li>
                      <li>• All activations removed</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !transferForm.licenseId || !transferForm.targetEmail}
                className="w-full bg-green-500 hover:bg-green-600 text-black disabled:bg-[#333] disabled:text-gray-500 py-2.5 px-4 rounded-lg font-medium transition-all"
              >
                {submitting ? 'Transferring...' : 'Transfer License'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}