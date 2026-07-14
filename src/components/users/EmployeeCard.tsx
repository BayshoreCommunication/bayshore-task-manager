"use client";
import React, { useState } from "react";
import {
  Mail,
  User,
  Briefcase,
  BadgeCheck,
  BadgeX,
  Hash,
  AtSign,
  Info,
  ShieldAlert,
  KeyRound,
  UserMinus,
  UserPlus,
  CheckCircle2,
} from "lucide-react";
import { motion } from "motion/react";
import { Employee } from "@/types/userTypes";
import { toast } from "sonner";

interface EmployeeCardProps {
  employee: Employee;
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee }) => {
  const [isTerminating, setIsTerminating] = useState(employee.isActive);
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  console.log(employee);

  const handlePasswordSubmit = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    try {
      const res = await fetch(`/api/users/update/${employee.id}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) throw new Error();
      setNewPassword("");
      setShowPasswordInput(false);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
      toast.success("User created successfully");
    } catch (error) {
      toast.error("Failed to create user");
    }
  };

  const handleTermination = async () => {
    try {
      const res = await fetch(`/api/users/update/${employee.id}/terminate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(data.message);
      setIsTerminating(!isTerminating);
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-shadow duration-300"
    >
      {/* Header / Image Section */}
      <div className="relative h-48 bg-gradient-to-br from-indigo-600 to-violet-700">
        <div className="absolute -bottom-12 left-8">
          <div className="relative">
            <img
              src={employee.image ? employee.image : undefined}
              alt={employee.name}
              className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg bg-gray-200"
              referrerPolicy="no-referrer"
            />
            <div
              className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${employee.isActive ? "bg-green-500" : "bg-gray-400"}`}
            >
              {employee.isActive ? (
                <BadgeCheck className="w-4 h-4 text-white" />
              ) : (
                <BadgeX className="w-4 h-4 text-white" />
              )}
            </div>
          </div>
        </div>
        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
          <span className="text-xs font-semibold text-white uppercase tracking-wider flex justify-center items-center">
            {employee.type}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="pt-16 pb-6 px-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {employee.name}
          </h2>
          <p className="text-indigo-600 font-medium flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            {employee.jobTitle}
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-4 text-gray-600 group">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
              <AtSign className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">
                Username
              </p>
              <p className="text-sm font-medium">@{employee.userName}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-gray-600 group">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
              <Mail className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">
                Email Address
              </p>
              <p className="text-sm font-medium">{employee.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-gray-600 group">
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
              <Hash className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">
                Employee ID
              </p>
              <p className="text-sm font-medium font-mono">
                {employee.employeeId}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-6">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <Info className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Job Description
            </span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {employee.jobDescription}
          </p>
        </div>

        {/* Admin Actions Section */}
        <div className="border-t border-gray-100 pt-6 mt-6">
          <div className="flex items-center gap-2 mb-4 text-red-500">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Admin Control Panel
            </span>
          </div>

          <div className="space-y-3">
            {/* Password Action */}
            <div className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
              {!showPasswordInput ? (
                <button
                  onClick={() => setShowPasswordInput(true)}
                  className="w-full flex items-center justify-between text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-gray-400" />
                    Change Password
                  </div>
                  {isSuccess && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-green-500 flex items-center gap-1 text-xs"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Updated
                    </motion.span>
                  )}
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-2"
                >
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handlePasswordSubmit}
                      className="flex-1 bg-indigo-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-indigo-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setShowPasswordInput(false)}
                      className="px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Termination Action */}
            <button
              onClick={handleTermination} // Replace with actual termination logic
              className={`w-full flex items-center gap-2 px-4 py-3 cursor-pointer rounded-xl text-sm font-bold transition-all active:scale-95 ${
                isTerminating
                  ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"
                  : "bg-green-50 text-green-600 hover:bg-green-100 border border-green-100"
              }`}
            >
              {isTerminating ? (
                <>
                  <UserMinus className="w-4 h-4" />
                  Terminate Employee Access
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Reactivate Employee Access
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EmployeeCard;
