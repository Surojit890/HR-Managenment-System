import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Clean slate ────────────────────────────────────────────────────────────
  await prisma.payroll.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.document.deleteMany();
  await prisma.employeeProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('Old data cleared.');

  const password = await bcrypt.hash('Password123', 12);

  // ─── Users + Profiles ───────────────────────────────────────────────────────
  const adminData = {
    employeeId: 'EMP-001',
    email: 'admin@hrms.com',
    password,
    role: 'ADMIN' as const,
    isVerified: true,
    profile: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+1 555-0100',
      department: 'Human Resources',
      designation: 'HR Director',
    },
  };

  const employeeDataList = [
    {
      employeeId: 'EMP-002',
      email: 'alice@hrms.com',
      firstName: 'Alice',
      lastName: 'Williams',
      phone: '+1 555-0101',
      department: 'Engineering',
      designation: 'Senior Developer',
    },
    {
      employeeId: 'EMP-003',
      email: 'bob@hrms.com',
      firstName: 'Bob',
      lastName: 'Brown',
      phone: '+1 555-0102',
      department: 'Engineering',
      designation: 'Frontend Developer',
    },
    {
      employeeId: 'EMP-004',
      email: 'carol@hrms.com',
      firstName: 'Carol',
      lastName: 'Davis',
      phone: '+1 555-0103',
      department: 'Marketing',
      designation: 'Marketing Manager',
    },
    {
      employeeId: 'EMP-005',
      email: 'david@hrms.com',
      firstName: 'David',
      lastName: 'Miller',
      phone: '+1 555-0104',
      department: 'Sales',
      designation: 'Sales Executive',
    },
    {
      employeeId: 'EMP-006',
      email: 'eve@hrms.com',
      firstName: 'Eve',
      lastName: 'Wilson',
      phone: '+1 555-0105',
      department: 'Finance',
      designation: 'Financial Analyst',
    },
    {
      employeeId: 'EMP-007',
      email: 'frank@hrms.com',
      firstName: 'Frank',
      lastName: 'Taylor',
      phone: '+1 555-0106',
      department: 'Engineering',
      designation: 'DevOps Engineer',
    },
  ];

  const admin = await prisma.user.create({
    data: {
      employeeId: adminData.employeeId,
      email: adminData.email,
      password: adminData.password,
      role: adminData.role,
      isVerified: adminData.isVerified,
      profile: { create: adminData.profile },
    },
  });

  const employees: { id: string; email: string; employeeId: string }[] = [];
  for (const emp of employeeDataList) {
    const { employeeId, email, ...profileData } = emp;
    const user = await prisma.user.create({
      data: {
        employeeId,
        email,
        password,
        role: 'EMPLOYEE',
        isVerified: true,
        profile: { create: profileData },
      },
    });
    employees.push({ id: user.id, email: user.email, employeeId: user.employeeId });
  }

  const allUsers = [admin, ...employees];
  console.log(`Created ${allUsers.length} users with profiles.`);

  // ─── Attendance (today + past 5 days) ───────────────────────────────────────
  for (let dayOffset = 5; dayOffset >= 0; dayOffset--) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - dayOffset);
    // Skip weekends
    const weekday = day.getDay();
    if (weekday === 0 || weekday === 6) continue;

    for (const user of allUsers) {
      const checkInTime = new Date(day);
      checkInTime.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);

      // Today: only some people have checked out
      const shouldCheckOut = dayOffset === 0 ? Math.random() > 0.5 : true;
      const checkOutTime = new Date(checkInTime);
      checkOutTime.setHours(checkInTime.getHours() + 8, Math.floor(Math.random() * 60), 0, 0);

      await prisma.attendance.create({
        data: {
          userId: user.id,
          date: day,
          checkIn: checkInTime,
          checkOut: shouldCheckOut ? checkOutTime : null,
        },
      });
    }
  }
  console.log('Attendance seeded (6 weekdays).');

  // ─── Leave Requests (varied types, statuses, attachments) ───────────────────
  const emp1 = employees[0]; // Alice
  const emp2 = employees[1]; // Bob
  const emp3 = employees[2]; // Carol
  const emp4 = employees[3]; // David
  const emp5 = employees[4]; // Eve
  const emp6 = employees[5]; // Frank

  const futureDate = (offset: number) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    return d;
  };

  await prisma.leaveRequest.createMany({
    data: [
      // Pending
      {
        userId: emp1.id,
        type: 'CASUAL',
        from: futureDate(3),
        to: futureDate(5),
        remarks: 'Family vacation to the coast',
        attachment: 'vacation_plan.pdf',
        status: 'PENDING',
      },
      {
        userId: emp2.id,
        type: 'SICK',
        from: futureDate(1),
        to: futureDate(2),
        remarks: 'Medical appointment',
        attachment: 'medical_cert.pdf',
        status: 'PENDING',
      },
      // Approved (past)
      {
        userId: emp3.id,
        type: 'EARNED',
        from: futureDate(-10),
        to: futureDate(-6),
        remarks: 'Annual trip to mountains',
        status: 'APPROVED',
        comments: 'Enjoy your trip!',
      },
      {
        userId: emp1.id,
        type: 'CASUAL',
        from: futureDate(-20),
        to: futureDate(-18),
        remarks: 'Personal errands',
        status: 'APPROVED',
        comments: 'Approved. Please coordinate with team.',
      },
      {
        userId: emp5.id,
        type: 'SICK',
        from: futureDate(-5),
        to: futureDate(-4),
        remarks: 'Fever and cold',
        attachment: 'prescription.jpg',
        status: 'APPROVED',
        comments: 'Get well soon!',
      },
      // Rejected
      {
        userId: emp4.id,
        type: 'UNPAID',
        from: futureDate(-10),
        to: futureDate(-6),
        remarks: 'Personal work',
        status: 'REJECTED',
        comments: 'Please reschedule after month-end.',
      },
      {
        userId: emp6.id,
        type: 'CASUAL',
        from: futureDate(10),
        to: futureDate(12),
        remarks: 'Friend wedding',
        status: 'PENDING',
      },
    ],
  });
  console.log('Leave requests seeded (7 requests).');

  // ─── Payroll (current month with named components) ──────────────────────────
  const currentMonth = new Date().toISOString().slice(0, 7);

  const salaryConfig: Record<string, { basic: number; hra: number; otherAllow: number; pf: number; tax: number; otherDeduct: number }> = {
    [admin.id]:  { basic: 8000, hra: 3200, otherAllow: 1500, pf: 960, tax: 1200, otherDeduct: 200 },
    [emp1.id]:   { basic: 6500, hra: 2600, otherAllow: 1200, pf: 780, tax: 900, otherDeduct: 100 },
    [emp2.id]:   { basic: 5500, hra: 2200, otherAllow: 1000, pf: 660, tax: 700, otherDeduct: 100 },
    [emp3.id]:   { basic: 5000, hra: 2000, otherAllow: 900, pf: 600, tax: 600, otherDeduct: 50 },
    [emp4.id]:   { basic: 4800, hra: 1920, otherAllow: 800, pf: 576, tax: 500, otherDeduct: 50 },
    [emp5.id]:   { basic: 5200, hra: 2080, otherAllow: 1000, pf: 624, tax: 650, otherDeduct: 100 },
    [emp6.id]:   { basic: 5800, hra: 2320, otherAllow: 1100, pf: 696, tax: 750, otherDeduct: 100 },
  };

  for (const user of allUsers) {
    const cfg = salaryConfig[user.id];
    if (!cfg) continue;

    const allowances = cfg.hra + cfg.otherAllow;
    const deductions = cfg.pf + cfg.tax + cfg.otherDeduct;
    const netSalary = cfg.basic + allowances - deductions;

    await prisma.payroll.create({
      data: {
        userId: user.id,
        month: currentMonth,
        basicSalary: cfg.basic,
        hra: cfg.hra,
        otherAllowances: cfg.otherAllow,
        allowances,
        pf: cfg.pf,
        tax: cfg.tax,
        otherDeductions: cfg.otherDeduct,
        deductions,
        netSalary,
      },
    });
  }
  console.log('Payroll seeded with named components (7 employees).');

  // ─── Documents ──────────────────────────────────────────────────────────────
  await prisma.document.createMany({
    data: [
      { userId: emp1.id, name: 'Resume_Alice.pdf', url: '/docs/resume_alice.pdf' },
      { userId: emp2.id, name: 'Resume_Bob.pdf', url: '/docs/resume_bob.pdf' },
      { userId: emp3.id, name: 'Offer_Letter_Carol.pdf', url: '/docs/offer_carol.pdf' },
    ],
  });
  console.log('Documents seeded.');

  console.log('──────────────────────────────────');
  console.log('Seed completed successfully!');
  console.log('Admin login:    admin@hrms.com / Password123');
  console.log('Employee login: alice@hrms.com / Password123');
  console.log('──────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
