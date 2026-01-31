"use client";

import { useState, useEffect } from "react";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";
// import { prisma } from "@/lib/prisma";
// import Link from "next/link";
import { 
  ArrowRight, 
  Mail, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Search,
  // Filter
} from "lucide-react";

interface License {
  id: string;
  licenseKey: string;
  status: string;
  createdAt: Date;
  expiresAt: Date;
  lastValidatedAt: Date | null;
  maxActivations: number;
  product: {
    name: string;
    slug: string;
  };
}

interface Transfer {
  id: string;
  fromUser: { name: string | null; email: string };
  toUser: { name: string | null; email: string };
  originalLicense: { product: { name: string } };
  newLicense: { product: { name: string } };
  transferredAt: string;
}

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferForm, setTransferForm] = useState({
    licenseId: "",
    targetEmail: "",
    durationDays: 365,
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "sent" | "received">("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transfersRes, licensesRes] = await Promise.all([
        fetch('/api/dashboard/transfers'),
        fetch('/api/licenses'),
      ]);

      if (transfersRes.ok && licensesRes.ok) {
        const [transfersData, licensesData] = await Promise.all([
          transfersRes.json(),
          licensesRes.json(),
        ]);
        setTransfers(transfersData.transfers || []);
        setLicenses(licensesData.licenses || []);
      } else {
        console.error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/dashboard/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferForm),
      });

      if (response.ok) {
        await fetchData();
        setTransferForm({ licenseId: "", targetEmail: "", durationDays: 365 });
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
      transfer.fromUser.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.toUser.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.originalLicense.product.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filter === "all" ||
      (filter === "sent" && transfer.fromUser.email.includes("current")) ||
      (filter === "received" && transfer.toUser.email.includes("current"));

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-green-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading transfer history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">License Transfers</h1>
        <p className="text-gray-400">Transfer your licenses to other users securely</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-[#111] rounded-xl border border-[#222] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Transfer History</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search transfers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:border-green-500"
                  />
                </div>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as "all" | "sent" | "received")}
                  className="px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
                >
                  <option value="all">All Transfers</option>
                  <option value="sent">Sent</option>
                  <option value="received">Received</option>
                </select>
              </div>
            </div>

            {filteredTransfers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowRight className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-gray-400">No transfers found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransfers.map((transfer) => (
                  <div
                    key={transfer.id}
                    className="bg-[#0a0a0a]/50 rounded-lg p-4 border border-[#333] hover:border-green-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-white">
                            {transfer.originalLicense.product.name}
                          </span>
                          <ArrowRight className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium text-green-400">
                            {transfer.newLicense.product.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {transfer.fromUser.email} → {transfer.toUser.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(transfer.transferredAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-400">Completed</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-[#111] rounded-xl border border-[#222] p-6">
            <h2 className="text-xl font-semibold text-white mb-4">New Transfer</h2>
            
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select License
                </label>
                <select
                  value={transferForm.licenseId}
                  onChange={(e) => setTransferForm({ ...transferForm, licenseId: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-green-500"
                  required
                >
                  <option value="">Choose a license...</option>
                  {licenses.filter(license => license.licenseKey.startsWith('eyJ')).map((license: License) => (
                    <option key={license.id} value={license.id}>
                      {license.product.name} - {license.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={transferForm.targetEmail}
                  onChange={(e) => setTransferForm({ ...transferForm, targetEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  License Duration (days)
                </label>
                <input
                  type="number"
                  value={transferForm.durationDays}
                  onChange={(e) => setTransferForm({ ...transferForm, durationDays: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded-lg text-white focus:outline-none focus:border-green-500"
                  min="1"
                  max="1095"
                  required
                />
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-300">
                    <p className="font-semibold mb-1">Transfer Notice:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• This action cannot be undone</li>
                      <li>• All current activations will be removed</li>
                      <li>• Only JWT licenses can be transferred</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !transferForm.licenseId || !transferForm.targetEmail}
                className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-green-600/20"
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