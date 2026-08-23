import { Activity } from "@/types";

interface ActivityTimelineProps {
  activities: Activity[];
}

export default function ActivityTimeline({
  activities,
}: ActivityTimelineProps) {
  return (
    <div className="border border-[#d0d7de] bg-white p-4">
      <h3 className="text-xs font-bold text-gray-900 uppercase border-b border-[#d0d7de] pb-2 mb-2">
        Event History
      </h3>
      {activities.length === 0 ? (
        <div className="text-[11px] text-gray-500 py-1">
          No activity logged.
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((act) => (
            <div
              key={act._id}
              className="text-xs border-l-2 border-gray-300 pl-2"
            >
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>
                  <b>{act.performedBy?.name || "System"}</b> ({act.actionType})
                </span>
                <span>{new Date(act.createdAt).toLocaleString()}</span>
              </div>
              <div className="text-gray-800">{act.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
