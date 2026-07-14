"use client";
import React from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Calendar,
  TrendingUp,
  Timer,
  AlertTriangle,
} from "lucide-react";
import { motion } from "motion/react";
import { Task } from "@/types/userTypes";

const INITIAL_TASKS = [
  {
    id: "1",
    title: "Implement responsive dashboard layout",
    status: "working",
    priority: "high",
    dueDate: "Today",
  },
  {
    id: "2",
    title: "Refactor authentication service",
    status: "working",
    priority: "medium",
    dueDate: "Tomorrow",
  },
  {
    id: "3",
    title: "Fix accessibility issues in navigation",
    status: "done",
    priority: "high",
    dueDate: "Yesterday",
    completionStatus: "on-time",
  },
  {
    id: "4",
    title: "Update project documentation",
    status: "done",
    priority: "low",
    dueDate: "2 days ago",
    completionStatus: "delayed",
  },
];

const TaskList = () => {
  const [tasks, setTasks] = React.useState(INITIAL_TASKS);

  const toggleTaskStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          const newStatus = task.status === "working" ? "done" : "working";
          return {
            ...task,
            status: newStatus,
            completionStatus:
              newStatus === "done"
                ? Math.random() > 0.2
                  ? "on-time"
                  : "delayed"
                : undefined,
          };
        }
        return task;
      }),
    );
  };
  const workingTasks = tasks.filter((t) => t.status === "working");
  const doneTasks = tasks.filter((t) => t.status === "done");

  const onTimeCount = doneTasks.filter(
    (t) => t.completionStatus === "on-time",
  ).length;
  const delayedCount = doneTasks.filter(
    (t) => t.completionStatus === "delayed",
  ).length;
  const performanceRate =
    doneTasks.length > 0
      ? Math.round((onTimeCount / doneTasks.length) * 100)
      : 0;

  const TaskItem: React.FC<{ task: Task }> = ({ task }: { task: Task }) => (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
        task.status === "done"
          ? "bg-gray-50 border-gray-100 opacity-75"
          : "bg-white border-gray-100 shadow-sm hover:shadow-md"
      }`}
    >
      <button
        onClick={() => toggleTaskStatus(task.id)}
        className={`shrink-0 transition-colors ${
          task.status === "done"
            ? "text-green-500"
            : "text-gray-300 hover:text-indigo-500"
        }`}
      >
        {task.status === "done" ? (
          <CheckCircle2 className="w-6 h-6" />
        ) : (
          <Circle className="w-6 h-6" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4
            className={`text-sm font-semibold truncate ${task.status === "done" ? "text-gray-400 line-through" : "text-gray-900"}`}
          >
            {task.title}
          </h4>
          {task.status === "done" && task.completionStatus && (
            <span
              className={`shrink-0 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                task.completionStatus === "on-time"
                  ? "bg-green-50 text-green-600 border-green-100"
                  : "bg-red-50 text-red-600 border-red-100"
              }`}
            >
              {task.completionStatus === "on-time" ? "On Time" : "Delayed"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span
            className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              task.priority === "high"
                ? "bg-red-50 text-red-600"
                : task.priority === "medium"
                  ? "bg-amber-50 text-amber-600"
                  : "bg-blue-50 text-blue-600"
            }`}
          >
            <AlertCircle className="w-3 h-3" />
            {task.priority}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
            <Calendar className="w-3 h-3" />
            {task.dueDate}
          </span>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="w-full max-w-2xl space-y-8">
      {/* Performance Summary Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          <h3 className="text-lg font-bold text-gray-900">
            Performance Overview
          </h3>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">
              On-Time Rate
            </p>
            <p className="text-2xl font-black text-indigo-600">
              {performanceRate}%
            </p>
          </div>
          <div className="text-center p-4 rounded-2xl bg-green-50 border border-green-100">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Timer className="w-3 h-3 text-green-400" />
              <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">
                On Time
              </p>
            </div>
            <p className="text-2xl font-black text-green-600">{onTimeCount}</p>
          </div>
          <div className="text-center p-4 rounded-2xl bg-red-50 border border-red-100">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">
                Delayed
              </p>
            </div>
            <p className="text-2xl font-black text-red-600">{delayedCount}</p>
          </div>
        </div>
      </div>

      {/* Working Section */}
      <section>
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-gray-900">Working On</h3>
          </div>
          <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2.5 py-1 rounded-full">
            {workingTasks.length} Active
          </span>
        </div>
        <div className="space-y-3">
          {workingTasks.length > 0 ? (
            workingTasks.map((task) => <TaskItem key={task.id} task={task} />)
          ) : (
            <p className="text-sm text-gray-400 italic text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              No active tasks at the moment.
            </p>
          )}
        </div>
      </section>

      {/* Done Section */}
      <section>
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-bold text-gray-900">Completed</h3>
          </div>
          <span className="bg-green-50 text-green-600 text-xs font-bold px-2.5 py-1 rounded-full">
            {doneTasks.length} Done
          </span>
        </div>
        <div className="space-y-3">
          {doneTasks.length > 0 ? (
            doneTasks.map((task) => <TaskItem key={task.id} task={task} />)
          ) : (
            <p className="text-sm text-gray-400 italic text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              No completed tasks yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default TaskList;
