import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { complaintsApi } from '../api/complaintsApi';
import { Complaint } from '../types';
import { Card, CardHeader, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { formatDate } from '../utils/formatDate';
import { getSeverityInfo } from '../utils/severityColor';
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  ArrowUpRight,
  Database,
  Building2,
  RotateCcw,
  AlertCircle,
  ThumbsUp,
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Roads',
  'Drainage',
  'Electricity',
  'Water Supply',
  'Sanitation',
  'Street Lights',
  'Parks',
  'Other',
];

const STATUSES = ['All', 'pending', 'assigned', 'in-progress', 'resolved', 'rejected'];

const HYDERABAD_ZONES = [
  'All',
  'Banjara Hills',
  'Jubilee Hills',
  'Madhapur',
  'Hitech City',
  'Kukatpally',
  'Secunderabad',
  'Charminar',
  'Begumpet',
  'Ameerpet',
  'LB Nagar',
];

export const ExploreComplaintsPage: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [area, setArea] = useState('All');
  const [provenanceFilter, setProvenanceFilter] = useState<'all' | 'citizen' | 'demo'>('all');
  const [sortBy, setSortBy] = useState('createdAt');

  const fetchComplaints = async (page = 1) => {
    setLoading(true);
    try {
      const data = await complaintsApi.getComplaints({
        category: category !== 'All' ? category : undefined,
        status: status !== 'All' ? status : undefined,
        area: area !== 'All' ? area : undefined,
        search: search.trim() ? search.trim() : undefined,
        page,
        limit: 12,
        sortBy,
        sortOrder: 'desc',
      });

      let items = (data.complaints || []) as Complaint[];

      // Filter by provenance if requested
      if (provenanceFilter === 'citizen') {
        items = items.filter((c: any) => c.dataSource === 'citizen_submitted' || !c.aiAnalysis?.isSimulated);
      } else if (provenanceFilter === 'demo') {
        items = items.filter((c: any) => c.dataSource === 'fictional_demo' || c.aiAnalysis?.isSimulated);
      }

      setComplaints(items);
      setPagination(data.pagination || { total: items.length, page, limit: 12, totalPages: 1 });
    } catch (err) {
      console.error('Failed to query complaints registry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints(1);
  }, [category, status, area, provenanceFilter, sortBy]);

  const handleResetFilters = () => {
    setSearch('');
    setCategory('All');
    setStatus('All');
    setArea('All');
    setProvenanceFilter('all');
    setSortBy('createdAt');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Breadcrumb items={[{ label: 'Explore Complaints Registry' }]} />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-civic-700 uppercase tracking-wider font-mono">
              Public Ledger & Civic Registry
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">Live Database Records</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Explore Civic Grievances
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Search, inspect, and track municipal infrastructure reports across Hyderabad. All records display verified provenance and real-time triage progress.
          </p>
        </div>

        <Link to="/citizen/new">
          <Button variant="primary" size="md">
            Report New Problem
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-slate-50 border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Keyword Search */}
          <div className="lg:col-span-2 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchComplaints(1)}
              placeholder="Search complaint title, street..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-civic-700 bg-white"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs px-2.5 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-civic-700 bg-white font-medium text-slate-700"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>

          {/* Locality Zone */}
          <div>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full text-xs px-2.5 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-civic-700 bg-white font-medium text-slate-700"
            >
              {HYDERABAD_ZONES.map((z) => (
                <option key={z} value={z}>
                  {z === 'All' ? 'All Localities' : z}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full text-xs px-2.5 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-civic-700 bg-white font-medium text-slate-700 capitalize"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All Statuses' : s}
                </option>
              ))}
            </select>
          </div>

          {/* Provenance Filter */}
          <div>
            <select
              value={provenanceFilter}
              onChange={(e) => setProvenanceFilter(e.target.value as any)}
              className="w-full text-xs px-2.5 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-civic-700 bg-white font-medium text-slate-700"
            >
              <option value="all">All Provenances</option>
              <option value="citizen">Citizen Verified</option>
              <option value="demo">Demo Records</option>
            </select>
          </div>
        </div>

        {/* Filter subrow */}
        <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-slate-900 tabular-nums">{complaints.length}</strong> matching records
            </span>
            {provenanceFilter !== 'all' && (
              <Badge variant={provenanceFilter === 'citizen' ? 'verified' : 'neutral'} size="sm">
                {provenanceFilter === 'citizen' ? 'Verified Citizen Only' : 'Demo Test Records'}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-semibold bg-transparent border-0 focus:ring-0 text-slate-800 cursor-pointer"
              >
                <option value="createdAt">Date (Newest)</option>
                <option value="priorityScore">Priority Score</option>
                <option value="upvotes">Community Upvotes</option>
              </select>
            </div>

            <button
              onClick={handleResetFilters}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Grid of Complaints */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-2">
          <div className="w-6 h-6 border-2 border-civic-700 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-medium text-slate-500">Querying MongoDB complaint index...</span>
        </div>
      ) : complaints.length === 0 ? (
        <Card className="py-16 text-center max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900 mb-1">No verified live data available</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            No complaints matched your specific filter combination. Try adjusting the category, locality, or data provenance.
          </p>
          <Button variant="outline" size="sm" onClick={handleResetFilters}>
            Reset Search Filters
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {complaints.map((item) => {
            const score = item.aiAnalysis?.priorityScore || 50;
            const severity = getSeverityInfo(score);
            const isDemo = item.aiAnalysis?.isSimulated;

            return (
              <Card key={item._id} className="flex flex-col justify-between hover:border-slate-300 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {(item as any).complaintId || `CE-HYD-${item._id.slice(-6).toUpperCase()}`}
                    </span>
                    <Badge
                      variant={
                        item.status === 'resolved'
                          ? 'success'
                          : item.status === 'in-progress'
                          ? 'info'
                          : item.status === 'assigned'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {item.status}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                    {item.title}
                  </h3>
                </CardHeader>

                <CardBody className="py-3 space-y-3">
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-700">{item.location?.area}</span>
                      <span className="text-slate-300">•</span>
                      <span className="truncate text-slate-500">{item.location?.address}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formatDate(item.createdAt)}</span>
                      {item.department && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-700 font-medium">{(item.department as any).code}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Priority & Provenance Strip */}
                  <div className="pt-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: severity.hex }}
                      />
                      <span className="font-bold text-slate-800 tabular-nums">
                        Priority: {score}/100
                      </span>
                    </div>

                    {isDemo ? (
                      <Badge variant="neutral" size="sm">
                        Demo Test Seed
                      </Badge>
                    ) : (
                      <Badge variant="verified" size="sm">
                        Citizen Verified
                      </Badge>
                    )}
                  </div>
                </CardBody>

                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-slate-500 font-medium">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span className="tabular-nums">{item.upvotes || 0}</span>
                  </div>

                  <Link
                    to={`/citizen/complaints/${item._id}`}
                    className="font-semibold text-civic-700 hover:text-civic-900 inline-flex items-center gap-1"
                  >
                    <span>View Record & Timeline</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
