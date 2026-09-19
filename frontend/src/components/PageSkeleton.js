import React from "react";
import { Skeleton } from "./ui/skeleton";

export function SkeletonHeader({ titleWidth = "w-48", subtitleWidth = "w-80" }) {
  return (
    <div className="space-y-2 pb-2 border-b border-[#E2E8F0]/70">
      <Skeleton className={`h-8 ${titleWidth} rounded-lg`} />
      <Skeleton className={`h-4 ${subtitleWidth} rounded-md`} />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <SkeletonHeader titleWidth="w-64" subtitleWidth="w-96" />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 space-y-4 shadow-xs">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
            <Skeleton className="h-9 w-32 rounded-lg" />
            <Skeleton className="h-3 w-40 rounded" />
          </div>
        ))}
      </div>

      {/* Quick Action Grid */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-36 rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 flex flex-col items-center justify-center gap-3 min-h-[104px] shadow-xs">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton className="w-20 h-3 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E2E8F0]">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-32 h-5 rounded" />
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center p-1.5">
                <Skeleton className="h-4 w-36 rounded" />
                <Skeleton className="h-4 w-8 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-[#E2E8F0] bg-white p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#E2E8F0]">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-40 h-5 rounded" />
          </div>
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3.5 p-2.5 rounded-xl border border-[#F1F5F9]">
                <Skeleton className="w-2 h-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-44 rounded" />
                  <Skeleton className="h-3 w-32 rounded" />
                </div>
                <div className="space-y-1 text-right">
                  <Skeleton className="h-4 w-16 ml-auto rounded" />
                  <Skeleton className="h-2.5 w-12 ml-auto rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <SkeletonHeader titleWidth="w-56" subtitleWidth="w-80" />
      <Skeleton className="h-11 w-full max-w-md rounded-lg" />

      <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-xs overflow-hidden divide-y divide-[#F1F5F9]">
        <div className="p-4 bg-[#F8FAFC]">
          <Skeleton className="h-4 w-full max-w-lg rounded" />
        </div>
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 flex-1">
              <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-48 rounded" />
                <Skeleton className="h-3 w-32 rounded" />
              </div>
            </div>
            <Skeleton className="h-8 w-20 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BoardroomSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <SkeletonHeader titleWidth="w-72" subtitleWidth="w-96" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-[#E2E8F0] bg-white p-6 space-y-3 shadow-xs">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <Skeleton className="h-10 w-36 rounded-lg" />
            <Skeleton className="h-3.5 w-44 rounded" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-[#E2E8F0] bg-white p-6 space-y-4 shadow-xs">
            <Skeleton className="h-5 w-48 rounded" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function MasterDataSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <SkeletonHeader titleWidth="w-64" subtitleWidth="w-80" />
      <Skeleton className="h-12 w-full max-w-xl rounded-xl" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 space-y-4 shadow-xs">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-3.5 w-20 rounded" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in duration-300">
      <SkeletonHeader titleWidth="w-64" subtitleWidth="w-96" />

      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-[#E2E8F0] bg-white p-6 space-y-4 shadow-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-[#E2E8F0]">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="w-48 h-5 rounded" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Skeleton className="h-11 rounded-lg" />
              <Skeleton className="h-11 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
