"use client";

import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { apiClient } from "@/lib/fetchClient";
import { useDebounce } from "@/hooks/useDebounce";
import { TableRowSkeleton, DetailSkeleton } from "@/components/Skeleton";
import ApplicationList from "@/components/ApplicationList";
import DocketHeader from "@/components/DocketHeader";
import WorkItemList from "@/components/WorkItemList";
import ActivityTimeline from "@/components/ActivityTimeline";
import CreateApplicationModal from "@/components/CreateApplicationModal";
import Pagination from "@/components/Pagination";
import SearchBar from "@/components/SearchBar";
import {
  CustomerApplication,
  Workflow,
  WorkItem,
  Activity,
  User,
} from "@/types";

export default function ApplicationClient() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [applications, setApplications] = useState<CustomerApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<CustomerApplication | null>(
    null,
  );
  const [activities, setActivities] = useState<Activity[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  // Search & Pagination Controls
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Debounced Search Hook (300ms delay)
  const debouncedSearch = useDebounce(search, 300);

  // Loading & Modal States
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const latestRequestId = useRef(0);

  // Load user from Cookie
  useEffect(() => {
    const rawUser = Cookies.get("user");
    if (rawUser) {
      try {
        setCurrentUser(JSON.parse(rawUser));
      } catch (e) {
        console.error("Failed to parse user cookie", e);
      }
    }
  }, []);

  // Fetch Application List
  const fetchApplications = async (
    targetPage = page,
    searchTerm = debouncedSearch,
  ) => {
    const requestId = ++latestRequestId.current;
    setLoadingList(true);
    try {
      const res = await apiClient(
        `/applications?page=${targetPage}&limit=8&search=${encodeURIComponent(searchTerm)}`,
      );

      if (requestId !== latestRequestId.current) return;

      setApplications(res.data);
      setTotalPages(res.pagination?.pages || 1);
      setTotalCount(res.pagination?.total || 0);

      if (res.data.length > 0) {
        loadDetail(res.data[0]._id);
      } else {
        setSelectedApp(null);
        setActivities([]);
        setWorkItems([]);
      }
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      if (requestId === latestRequestId.current) {
        setLoadingList(false);
      }
    }
  };

  // Re-fetch whenever debounced search query changes
  useEffect(() => {
    setPage(1);
    fetchApplications(1, debouncedSearch);
  }, [debouncedSearch]);

  // Load Application Details
  const loadDetail = async (id: string) => {
    setLoadingDetail(true);
    try {
      const [appData, actData, itemData, wfData] = await Promise.all([
        apiClient(`/applications/${id}`),
        apiClient(`/applications/${id}/activities`),
        apiClient(`/applications/${id}/work-items`),
        workflows.length === 0
          ? apiClient("/workflows")
          : Promise.resolve({ data: workflows }),
      ]);
      setSelectedApp(appData.data);
      setActivities(actData.data);
      setWorkItems(itemData.data);
      if (workflows.length === 0) setWorkflows(wfData.data);
    } catch (err) {
      console.error("Failed to load application detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Stage Transitions
  const handleStageChange = async (newStage: string, remarks?: string) => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      await apiClient(`/applications/${selectedApp._id}/stage`, {
        method: "PATCH",
        body: JSON.stringify({
          newStage,
          version: selectedApp.version,
          remarks: remarks || undefined,
        }),
      });
      await loadDetail(selectedApp._id);
      await fetchApplications(page, debouncedSearch);
    } catch (err: any) {
      alert(err.message || "Failed to update stage");
    } finally {
      setActionLoading(false);
    }
  };

  // Operational Status Changes
  const handleStatusChange = async (status: string) => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      await apiClient(`/applications/${selectedApp._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, version: selectedApp.version }),
      });
      await loadDetail(selectedApp._id);
      await fetchApplications(page, debouncedSearch);
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Work Item Complete / Incomplete
  const toggleWorkItem = async (itemId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED";
    try {
      await apiClient(`/work-items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      if (selectedApp) loadDetail(selectedApp._id);
    } catch (err: any) {
      alert(err.message || "Failed to update work item");
    }
  };

  // Calculate Allowed Transitions
  const activeWf = workflows.find(
    (w) =>
      w._id ===
      (typeof selectedApp?.workflowId === "string"
        ? selectedApp.workflowId
        : selectedApp?.workflowId?._id),
  );
  const activeStageConfig = activeWf?.stages?.find(
    (s) => s.name.toUpperCase() === selectedApp?.currentStage?.toUpperCase(),
  );
  const allowedTransitions: string[] =
    activeStageConfig?.allowedTransitions || [];

  const currentStageTasks = workItems.filter(
    (item) =>
      item.stageName.trim().toUpperCase() ===
      selectedApp?.currentStage?.trim().toUpperCase(),
  );
  const pendingCurrentStageTasks = currentStageTasks.filter(
    (item) => item.status !== "COMPLETED",
  );
  const hasPendingCurrentStageTasks = pendingCurrentStageTasks.length > 0;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Top Action, Search & Modular Pagination Toolbar */}
      <div className="border-b border-[#d0d7de] bg-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="border border-[#2da44e] bg-[#2da44e] text-white px-2.5 py-1 text-xs font-semibold hover:bg-[#2c974b] active:bg-[#298e46]"
          >
            + New Docket
          </button>
          <SearchBar
            value={search}
            placeholder="Search applicants, title, email..."
            onChange={setSearch}
            width="w-64"
          />
          <button
            onClick={() => fetchApplications(page, debouncedSearch)}
            className="border border-[#d0d7de] bg-[#f6f8fa] px-2.5 py-1 text-xs hover:bg-[#eaeef2]"
          >
            Refresh
          </button>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          limit={8}
          loading={loadingList}
          onPageChange={(newPage) => {
            setPage(newPage);
            fetchApplications(newPage, debouncedSearch);
          }}
        />
      </div>

      {/* Split-Pane Main View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Applications List */}
        <div className="w-1/3 border-r border-[#d0d7de] bg-white overflow-y-auto max-h-[calc(100vh-85px)]">
          {loadingList ? (
            <div className="p-2 space-y-2">
              <TableRowSkeleton />
              <TableRowSkeleton />
              <TableRowSkeleton />
            </div>
          ) : (
            <ApplicationList
              applications={applications}
              selectedAppId={selectedApp?._id}
              onSelect={loadDetail}
            />
          )}
        </div>

        {/* Right Side: Inspector & Workspace */}
        <div className="w-2/3 bg-[#fafbfc] overflow-y-auto max-h-[calc(100vh-85px)] p-4">
          {loadingDetail ? (
            <DetailSkeleton />
          ) : selectedApp ? (
            <div className="space-y-4">
              <DocketHeader
                app={selectedApp}
                currentUser={currentUser}
                allowedTransitions={allowedTransitions}
                actionLoading={actionLoading}
                hasPendingCurrentStageTasks={hasPendingCurrentStageTasks}
                pendingCount={pendingCurrentStageTasks.length}
                onStatusChange={handleStatusChange}
                onStageChange={handleStageChange}
              />
              <WorkItemList
                workItems={workItems}
                customerId={selectedApp.customerId?._id}
                onToggle={toggleWorkItem}
                onRefresh={() => loadDetail(selectedApp._id)}
              />
              <ActivityTimeline activities={activities} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-xs">
              Select an application docket from the list to inspect.
            </div>
          )}
        </div>
      </div>

      {/* Create Application Modal */}
      <CreateApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchApplications(1, debouncedSearch)}
      />
    </div>
  );
}
