"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserCircle, Shield, Landmark, Building2, Camera, Loader2 } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useMyPayroll, useMyProfile, useUpdateProfile, useUploadAvatar } from "@/lib/hooks/useEmployee";
import { formatCurrency, initials, avatarUrl } from "@/lib/format";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const resumeSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  phone: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
});
type ResumeValues = z.infer<typeof resumeSchema>;

const privateSchema = z.object({
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  gender: z.string().optional(),
  maritalStatus: z.string().optional(),
  personalEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
});
type PrivateValues = z.infer<typeof privateSchema>;

const securitySchema = z.object({
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  ifscCode: z.string().optional(),
  panNumber: z.string().optional(),
  uanNumber: z.string().optional(),
});
type SecurityValues = z.infer<typeof securitySchema>;

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function EmployeeProfilePage() {
  const { data, isLoading } = useMyProfile();
  const { mutate, isPending, error, isSuccess } = useUpdateProfile();
  const { mutateAsync: uploadAvatar, isPending: uploading, error: uploadError } = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | undefined>();
  const [savedTab, setSavedTab] = useState<string | null>(null);
  const currentMonth = new Date().toISOString().slice(0, 7);
  const { data: payroll = [], isLoading: payrollLoading } = useMyPayroll(currentMonth);
  const profile = data?.profile;
  const user = data?.user;
  const latestPayroll = payroll[payroll.length - 1];
  const showSalaryTab = user?.role === "ADMIN" || user?.role === "HR";

  const resumeForm = useForm<ResumeValues>({ resolver: zodResolver(resumeSchema) });
  const privateForm = useForm<PrivateValues>({ resolver: zodResolver(privateSchema) });
  const securityForm = useForm<SecurityValues>({ resolver: zodResolver(securitySchema) });

  useEffect(() => {
    if (profile) {
      resumeForm.reset({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone ?? "",
        department: profile.department ?? "",
        designation: profile.designation ?? "",
      });
      privateForm.reset({
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split("T")[0] : "",
        nationality: profile.nationality ?? "",
        gender: profile.gender ?? "",
        maritalStatus: profile.maritalStatus ?? "",
        personalEmail: profile.personalEmail ?? "",
        address: profile.address ?? "",
      });
      securityForm.reset({
        accountNumber: profile.accountNumber ?? "",
        bankName: profile.bankName ?? "",
        ifscCode: profile.ifscCode ?? "",
        panNumber: profile.panNumber ?? "",
        uanNumber: profile.uanNumber ?? "",
      });
      setAvatarSrc(avatarUrl(profile.avatarUrl));
    }
  }, [profile, resumeForm, privateForm, securityForm]);

  const onResumeSubmit = (values: ResumeValues) => {
    mutate(values, { onSuccess: () => setSavedTab("resume") });
  };
  const onPrivateSubmit = (values: PrivateValues) => {
    mutate(values, { onSuccess: () => setSavedTab("private") });
  };
  const onSecuritySubmit = (values: SecurityValues) => {
    mutate(values, { onSuccess: () => setSavedTab("security") });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAvatar(file);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
      setAvatarSrc(`${baseUrl}/uploads/avatars/${file.name}`);
    } catch {
      // error handled by uploadError state
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const field = (form: any, id: string, label: string, placeholder = "") => (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} placeholder={placeholder} {...form.register(id)} />
      {form.formState.errors[id] && (
        <p className="text-xs text-red-500">{form.formState.errors[id]?.message as string}</p>
      )}
    </div>
  );

  const SaveButton = ({ tab }: { tab: string }) => (
    <>
      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
          Failed to update profile. Please try again.
        </p>
      )}
      {isSuccess && savedTab === tab && (
        <p className="rounded bg-green-50 px-3 py-2 text-sm text-green-700">
          Profile updated successfully.
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving…" : "Save Changes"}
      </Button>
    </>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>

      <SectionCard title="Profile Summary">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col items-center gap-4 rounded-lg border bg-slate-50 p-5">
            <div className="group relative">
              <Avatar className="h-24 w-24 ring-2 ring-slate-200">
                <AvatarImage src={avatarSrc ?? ""} />
                <AvatarFallback className="text-2xl">
                  {isLoading ? (
                    <UserCircle className="h-10 w-10" />
                  ) : (
                    initials(profile?.firstName, profile?.lastName)
                  )}
                </AvatarFallback>
              </Avatar>
              {!isLoading && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 flex h-24 w-24 items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  ) : (
                    <Camera className="h-6 w-6 text-white" />
                  )}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {uploadError && (
              <p className="text-xs text-red-500">Failed to upload image</p>
            )}
            {!isLoading && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "Change Photo"}
              </button>
            )}

            {isLoading ? (
              <Skeleton className="h-5 w-40" />
            ) : (
              <div className="text-center">
                <p className="font-semibold text-slate-900">
                  {profile?.firstName} {profile?.lastName}
                </p>
                <p className="text-sm text-slate-500">{user?.employeeId}</p>
                <p className="text-sm text-slate-500">{user?.email}</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 grid gap-3 sm:grid-cols-2">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))
            ) : (
              <>
                <InfoTile label="Designation" value={profile?.designation ?? "—"} icon={UserCircle} />
                <InfoTile label="Department" value={profile?.department ?? "—"} icon={Building2} />
                <InfoTile label="Phone" value={profile?.phone ?? "—"} icon={Shield} />
                <InfoTile label="Employment Type" value="Full-time" icon={Landmark} />
                <InfoTile label="Employee ID" value={user?.employeeId ?? "—"} icon={UserCircle} />
                <InfoTile label="Status" value={user?.isVerified ? "Verified" : "Pending"} icon={Shield} />
              </>
            )}
          </div>
        </div>
      </SectionCard>

      <Tabs defaultValue="resume" className="w-full">
        <TabsList className="flex w-full justify-start overflow-x-auto rounded-lg bg-slate-100 p-1">
          <TabsTrigger value="resume">Resume</TabsTrigger>
          <TabsTrigger value="private">Private Info</TabsTrigger>
          {showSalaryTab && <TabsTrigger value="salary">Salary Info</TabsTrigger>}
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* ─── Resume Tab ─────────────────────────────────────────────── */}
        <TabsContent value="resume">
          <SectionCard title="Resume / Basic Information">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : (
              <form onSubmit={resumeForm.handleSubmit(onResumeSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {field(resumeForm, "firstName", "First Name", "John")}
                  {field(resumeForm, "lastName", "Last Name", "Doe")}
                </div>
                {field(resumeForm, "phone", "Phone", "+1 234 567 890")}
                {field(resumeForm, "department", "Department", "Engineering")}
                {field(resumeForm, "designation", "Designation", "Software Engineer")}
                <div className="space-y-2">
                  <SaveButton tab="resume" />
                </div>
              </form>
            )}
          </SectionCard>
        </TabsContent>

        {/* ─── Private Info Tab ──────────────────────────────────────── */}
        <TabsContent value="private">
          <SectionCard title="Private Information">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : (
              <form onSubmit={privateForm.handleSubmit(onPrivateSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {field(privateForm, "dateOfBirth", "Date of Birth", "1995-08-15")}
                  {field(privateForm, "nationality", "Nationality", "American")}
                  {field(privateForm, "gender", "Gender", "Male / Female / Other")}
                  {field(privateForm, "maritalStatus", "Marital Status", "Single / Married")}
                  {field(privateForm, "personalEmail", "Personal Email", "john.personal@gmail.com")}
                </div>
                {field(privateForm, "address", "Residing Address", "123 Main St, Springfield, IL")}
                <div className="space-y-2">
                  <SaveButton tab="private" />
                </div>
              </form>
            )}
          </SectionCard>
        </TabsContent>

        {/* ─── Salary Info Tab (Admin only) ──────────────────────────── */}
        {showSalaryTab && (
          <TabsContent value="salary">
            <SectionCard title="Salary Information (Admin View)">
              {payrollLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : !latestPayroll ? (
                <p className="text-sm text-slate-500">No salary record available for this month.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <ReadOnlyInput label="Month Wage" value={formatCurrency(latestPayroll.basicSalary)} />
                  <ReadOnlyInput label="Net Salary" value={formatCurrency(latestPayroll.netSalary)} />
                  <ReadOnlyInput label="Allowances" value={formatCurrency(latestPayroll.allowances)} />
                  <ReadOnlyInput label="Deductions" value={formatCurrency(latestPayroll.deductions)} />
                </div>
              )}
            </SectionCard>
          </TabsContent>
        )}

        {/* ─── Security Tab ──────────────────────────────────────────── */}
        <TabsContent value="security">
          <SectionCard title="Security & Bank Details">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : (
              <form onSubmit={securityForm.handleSubmit(onSecuritySubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {field(securityForm, "accountNumber", "Account Number", "1234567890")}
                  {field(securityForm, "bankName", "Bank Name", "Chase Bank")}
                  {field(securityForm, "ifscCode", "IFSC Code", "CHASUS33")}
                  {field(securityForm, "panNumber", "PAN Number", "ABCDE1234F")}
                  {field(securityForm, "uanNumber", "UAN Number", "101234567890")}
                </div>
                <div className="space-y-2">
                  <SaveButton tab="security" />
                </div>
              </form>
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function ReadOnlyInput({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input value={value} disabled readOnly />
    </div>
  );
}
