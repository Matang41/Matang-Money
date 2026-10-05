/**
 * FinDiscipline - Core Business Logic & State Storage (Enhanced v3)
 * Full Integration of:
 * - Real Balance Dashboard (ยอดเงินสดคงเหลือสะสม & Real Bank Balance)
 * - Payday-Centric Calendar with Transaction Sync
 * - 30-Day Wishlist Cooling-off with Opportunity Cost Calculator
 * - Project Vault (งบโปรเจกต์ก้อนใหญ่ที่ขอพ่อแม่ แยกอิสระ)
 * - Automated Slip Batch Scanner & Date Parser
 * - Multi-Device Sync & Persistence
 */

const INITIAL_STATE = {
  user: {
    name: "คุณครู (ข้าราชการครู)",
    salary: 19690,
    salaryPayday: 25,
    lastRaisePercentage: 0,
    // เงินสดเริ่มต้นในบัญชี (Initial Cash Balance)
    startingBalance: 12500,
    emergencyPot: 0
  },
  salarySchedule: [
    { month: 1, monthName: "ม.ค.", day: 26, yearBE: 2570, yearCE: 2027 },
    { month: 2, monthName: "ก.พ.", day: 23, yearBE: 2570, yearCE: 2027 },
    { month: 3, monthName: "มี.ค.", day: 26, yearBE: 2570, yearCE: 2027 },
    { month: 4, monthName: "เม.ย.", day: 27, yearBE: 2570, yearCE: 2027 },
    { month: 5, monthName: "พ.ค.", day: 26, yearBE: 2570, yearCE: 2027 },
    { month: 6, monthName: "มิ.ย.", day: 25, yearBE: 2570, yearCE: 2027 },
    { month: 7, monthName: "ก.ค.", day: 24, yearBE: 2570, yearCE: 2027 },
    { month: 8, monthName: "ส.ค.", day: 26, yearBE: 2570, yearCE: 2027 },
    { month: 9, monthName: "ก.ย.", day: 27, yearBE: 2570, yearCE: 2027 },
    { month: 10, monthName: "ต.ค.", day: 26, yearBE: 2569, yearCE: 2026 },
    { month: 11, monthName: "พ.ย.", day: 25, yearBE: 2569, yearCE: 2026 },
    { month: 12, monthName: "ธ.ค.", day: 24, yearBE: 2569, yearCE: 2026 }
  ],
  debts: [
    {
      id: "debt-gsb",
      name: "สินเชื่อธนาคารออมสิน",
      type: "NCB",
      calcMethod: "AMORTIZED",
      balance: 48000,
      monthlyInstallment: 2200,
      remainingMonths: 24,
      payerType: "PARENTS_DIRECT", // พ่อแม่ใช้เครดิตเรากู้ และพ่อแม่จ่ายให้
      advancePayDay: 25,
      reimburseDueDay: 5,
      isPendingReimbursement: false,
      reimbursementAmount: 2200,
      isClosed: false,
      closedReason: null
    },
    {
      id: "debt-iphone",
      name: "สินเชื่อผ่อนชำระ iPhone",
      type: "NCB",
      calcMethod: "FLAT",
      balance: 50000,
      monthlyInstallment: 2300,
      remainingMonths: 22,
      payerType: "SELF",
      advancePayDay: null,
      reimburseDueDay: null,
      isPendingReimbursement: false,
      reimbursementAmount: 0,
      isClosed: false,
      closedReason: null
    },
    {
      id: "debt-laptop",
      name: "ผ่อนโน้ตบุ๊ก (0% 10 เดือน)",
      type: "NON_NCB",
      calcMethod: "FLAT",
      balance: 8970,
      monthlyInstallment: 2990,
      remainingMonths: 3, // จะหมดใน 3 เดือน
      payerType: "SELF",
      advancePayDay: null,
      reimburseDueDay: null,
      isPendingReimbursement: false,
      reimbursementAmount: 0,
      isClosed: false,
      closedReason: null
    },
    {
      id: "debt-fiddle",
      name: "ผ่อนซอดนตรีไทย (ลดต้นลดดอก)",
      type: "NON_NCB",
      calcMethod: "AMORTIZED",
      balance: 22000,
      monthlyInstallment: 1200,
      remainingMonths: 20,
      payerType: "SELF",
      advancePayDay: null,
      reimburseDueDay: null,
      isPendingReimbursement: false,
      reimbursementAmount: 0,
      isClosed: false,
      closedReason: null
    },
    {
      id: "debt-aunt",
      name: "หนี้ยืมคุณป้า",
      type: "NON_NCB",
      calcMethod: "FLAT",
      balance: 2000,
      monthlyInstallment: 1000,
      remainingMonths: 2, // จะหมดใน 2 เดือน
      payerType: "SELF",
      advancePayDay: null,
      reimburseDueDay: null,
      isPendingReimbursement: false,
      reimbursementAmount: 0,
      isClosed: false,
      closedReason: null
    },
    {
      id: "debt-ac",
      name: "ผ่อนเครื่องปรับอากาศ (แอร์)",
      type: "NON_NCB",
      calcMethod: "FLAT",
      balance: 3520,
      monthlyInstallment: 880,
      remainingMonths: 4, // จะหมดใน 4 เดือน
      payerType: "SELF",
      advancePayDay: null,
      reimburseDueDay: null,
      isPendingReimbursement: false,
      reimbursementAmount: 0,
      isClosed: false,
      closedReason: null
    }
  ],
  fixedExpenses: [
    { id: "exp-dorm", name: "ค่าน้ำ-ค่าไฟบ้านพัก", amount: 500, isPaid: false },
    { id: "exp-net", name: "ค่าอินเทอร์เน็ตมือถือ", amount: 600, isPaid: false }
  ],
  transactions: [
    { id: "tx-1", date: "2026-10-04", amount: 60, category: "FOOD", note: "ข้าวเช้า" },
    { id: "tx-2", date: "2026-10-04", amount: 45, category: "DRINK", note: "กาแฟสด" },
    { id: "tx-3", date: "2026-10-04", amount: 80, category: "FOOD", note: "ข้าวเย็น" }
  ],
  bailouts: [
    // ประวัติการขอเงินพ่อแม่รายวัน
    { id: "bl-1", date: "2026-10-02", amount: 200, note: "ค่าอาหารช่วงตึงตัว", type: "DAILY" }
  ],
  extraIncomes: [
    // รายได้พิเศษ เช่น ค่าวิทยากร
  ],
  projects: [
    // โปรเจกต์เงินก้อนที่ขอพ่อแม่
    {
      id: "proj-1",
      name: "ทำสื่อการสอน & ปรับปรุงห้องเรียนดนตรีไทย",
      targetBudget: 15000,
      fundedByParents: 15000,
      spent: 4200,
      startDate: "2026-10-01",
      status: "IN_PROGRESS"
    }
  ],
  wishlist: [
    // กฎชะลอการซื้อ 30 วัน
    {
      id: "wish-1",
      name: "หูฟังตัดเสียงรบกวน AirPods Pro",
      price: 8900,
      addedDate: "2026-09-20",
      coolOffDays: 30,
      unlockDate: "2026-10-20",
      status: "COOLING" // COOLING, PASSED, BOUGHT, DISCARDED
    }
  ],
  modules: {
    safeToSpend: true,
    realBalanceDashboard: true,
    calendarView: true,
    dailyBailoutPad: true,
    debtCountdown: true,
    earlyDebtPayoff: true,
    ghbDsrSimulator: true,
    slipScanner: true,
    advanceTracker: true,
    extraIncome: true,
    projectVault: true,
    wishlistCooling: true
  }
};

class Store {
  constructor() {
    const saved = localStorage.getItem("findiscipline_store");
    if (saved) {
      try {
        this.state = JSON.parse(saved);
        // Ensure new module keys & projects/wishlist exist
        this.state.modules = { ...INITIAL_STATE.modules, ...(this.state.modules || {}) };
        if (!this.state.projects) this.state.projects = INITIAL_STATE.projects;
        if (!this.state.wishlist) this.state.wishlist = INITIAL_STATE.wishlist;
        if (this.state.user.startingBalance === undefined) this.state.user.startingBalance = 12500;
      } catch (e) {
        this.state = JSON.parse(JSON.stringify(INITIAL_STATE));
      }
    } else {
      this.state = JSON.parse(JSON.stringify(INITIAL_STATE));
      this.save();
    }
  }

  save() {
    localStorage.setItem("findiscipline_store", JSON.stringify(this.state));
    window.dispatchEvent(new CustomEvent("state-changed", { detail: this.state }));
  }

  resetToDefault() {
    this.state = JSON.parse(JSON.stringify(INITIAL_STATE));
    this.save();
  }

  // Safe-to-Spend & Cycle Calculations
  getCurrentBillingCycle() {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentYearCE = today.getFullYear();
    const currentDate = today.getDate();

    // Look for payday schedule in state
    const currentSchedule = this.state.salarySchedule.find(s => s.month === currentMonth && (s.yearCE === currentYearCE || !s.yearCE));
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextSchedule = this.state.salarySchedule.find(s => s.month === nextMonth);

    const paydayThisMonth = currentSchedule ? currentSchedule.day : (this.state.user.salaryPayday || 25);
    const paydayNextMonth = nextSchedule ? nextSchedule.day : (this.state.user.salaryPayday || 25);

    let cycleStartDate, cycleEndDate;

    if (currentDate >= paydayThisMonth) {
      cycleStartDate = new Date(currentYearCE, currentMonth - 1, paydayThisMonth);
      cycleEndDate = new Date(nextMonth === 1 ? currentYearCE + 1 : currentYearCE, nextMonth - 1, paydayNextMonth - 1, 23, 59, 59);
    } else {
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevSchedule = this.state.salarySchedule.find(s => s.month === prevMonth);
      const paydayPrevMonth = prevSchedule ? prevSchedule.day : (this.state.user.salaryPayday || 25);
      cycleStartDate = new Date(prevMonth === 12 ? currentYearCE - 1 : currentYearCE, prevMonth - 1, paydayPrevMonth);
      cycleEndDate = new Date(currentYearCE, currentMonth - 1, paydayThisMonth - 1, 23, 59, 59);
    }

    const diffTime = cycleEndDate.getTime() - today.getTime();
    const daysRemaining = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const totalDays = Math.round((cycleEndDate.getTime() - cycleStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return {
      cycleStartDate,
      cycleEndDate,
      daysRemaining,
      totalDays,
      currentDayIndex: totalDays - daysRemaining + 1,
      paydayThisMonth,
      paydayNextMonth
    };
  }

  calculateMetrics() {
    const cycle = this.getCurrentBillingCycle();
    const todayStr = new Date().toISOString().split("T")[0];

    // Total monthly obligations
    // 1. Debts paid by user (not closed, and payerType is not PARENTS_DIRECT)
    const activeDebtsPaidBySelf = this.state.debts.filter(d => !d.isClosed && d.payerType !== "PARENTS_DIRECT");
    const totalDebtInstallmentPaidBySelf = activeDebtsPaidBySelf.reduce((sum, d) => sum + d.monthlyInstallment, 0);

    // 2. Fixed expenses
    const totalFixedExpenses = this.state.fixedExpenses.reduce((sum, e) => sum + e.amount, 0);

    // 3. Extra Incomes in this cycle
    const totalExtraIncomes = this.state.extraIncomes.reduce((sum, i) => sum + i.amount, 0);

    // Discretionary pool from pure salary
    const pureSalaryPool = this.state.user.salary + totalExtraIncomes - (totalDebtInstallmentPaidBySelf + totalFixedExpenses);

    // Discretionary spent to date
    const totalSpentInCycle = this.state.transactions.reduce((sum, t) => sum + t.amount, 0);
    const todaySpent = this.state.transactions
      .filter(t => t.date === todayStr)
      .reduce((sum, t) => sum + t.amount, 0);

    // Bailout received today and total cycle
    const todayBailout = this.state.bailouts
      .filter(b => b.date === todayStr && b.type === "DAILY")
      .reduce((sum, b) => sum + b.amount, 0);

    const totalBailoutInCycle = this.state.bailouts
      .filter(b => b.type === "DAILY")
      .reduce((sum, b) => sum + b.amount, 0);

    // Remaining Pure Salary Pool
    const remainingPurePool = Math.max(0, pureSalaryPool - totalSpentInCycle);
    const dailyPureSafeSpend = Math.max(0, Math.floor(remainingPurePool / cycle.daysRemaining));

    // Dynamic Safe to Spend Today
    const totalDailyAllowanceWithBailout = dailyPureSafeSpend + todayBailout;
    const remainingForToday = totalDailyAllowanceWithBailout - todaySpent;

    // REAL CASH BALANCE CALCULATION (แดชบอร์ดเงินคงเหลือจริง)
    // Starting Balance + Salary + Extra Incomes + All Bailouts - Debts Paid by Self - Fixed Expenses - Actual Daily Expenses
    const allBailoutsTotal = this.state.bailouts.reduce((sum, b) => sum + b.amount, 0);
    const realCashBalance = (this.state.user.startingBalance || 0) 
      + this.state.user.salary 
      + totalExtraIncomes 
      + allBailoutsTotal 
      - totalDebtInstallmentPaidBySelf 
      - totalFixedExpenses 
      - totalSpentInCycle;

    // DSR Calculations (Official NCB vs Real)
    // NCB debts: GSB loan (2,200) + iPhone (2,300) = 4,500 THB
    const activeNCBDebts = this.state.debts.filter(d => !d.isClosed && d.type === "NCB");
    const totalNCBMonthly = activeNCBDebts.reduce((sum, d) => sum + d.monthlyInstallment, 0);

    const officialDSR = (totalNCBMonthly / this.state.user.salary) * 100;

    // Real DSR (all active debts)
    const allActiveDebts = this.state.debts.filter(d => !d.isClosed);
    const totalAllDebtsMonthly = allActiveDebts.reduce((sum, d) => sum + d.monthlyInstallment, 0);
    const realInternalDSR = (totalAllDebtsMonthly / this.state.user.salary) * 100;

    // GHB Mortgage Simulator (2.0M House + 380K Land Redeem = ~10,900 THB/month)
    const ghbTargetMortgage = 10900;
    const projectedOfficialDSRWithGHB = ((totalNCBMonthly + ghbTargetMortgage) / this.state.user.salary) * 100;
    const isGHBEligible = projectedOfficialDSRWithGHB <= 70.0; // ธอส. สวัสดิการครู Max 70%

    // Advance Reimbursement Status (e.g. GSB Loan)
    const pendingAdvances = this.state.debts.filter(d => d.payerType === "PARENTS_REIMBURSE" && d.isPendingReimbursement);
    const totalPendingAdvanceAmount = pendingAdvances.reduce((sum, d) => sum + d.reimbursementAmount, 0);

    return {
      cycle,
      pureSalaryPool,
      totalSpentInCycle,
      remainingPurePool,
      dailyPureSafeSpend,
      todaySpent,
      todayBailout,
      totalBailoutInCycle,
      remainingForToday,
      totalDailyAllowanceWithBailout,
      totalDebtInstallmentPaidBySelf,
      totalNCBMonthly,
      officialDSR: Math.round(officialDSR * 100) / 100,
      realInternalDSR: Math.round(realInternalDSR * 100) / 100,
      ghbTargetMortgage,
      projectedOfficialDSRWithGHB: Math.round(projectedOfficialDSRWithGHB * 100) / 100,
      isGHBEligible,
      pendingAdvances,
      totalPendingAdvanceAmount,
      realCashBalance
    };
  }

  // Actions
  addTransaction(amount, category, note, dateStr = null) {
    const targetDate = dateStr || new Date().toISOString().split("T")[0];
    this.state.transactions.unshift({
      id: "tx-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      date: targetDate,
      amount: parseFloat(amount),
      category: category || "FOOD",
      note: note || ""
    });
    this.save();
  }

  addBailout(amount, note, type = "DAILY", dateStr = null) {
    const targetDate = dateStr || new Date().toISOString().split("T")[0];
    this.state.bailouts.unshift({
      id: "bl-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      date: targetDate,
      amount: parseFloat(amount),
      note: note || "ขอเงินพ่อแม่",
      type: type
    });
    this.save();
  }

  addExtraIncome(amount, note, dateStr = null) {
    const targetDate = dateStr || new Date().toISOString().split("T")[0];
    this.state.extraIncomes.unshift({
      id: "inc-" + Date.now(),
      date: targetDate,
      amount: parseFloat(amount),
      note: note || "รายได้พิเศษ/ค่าวิทยากร"
    });
    this.save();
  }

  addWishlistItem(name, price) {
    const now = new Date();
    const unlock = new Date();
    unlock.setDate(now.getDate() + 30);

    this.state.wishlist.unshift({
      id: "wish-" + Date.now(),
      name: name,
      price: parseFloat(price),
      addedDate: now.toISOString().split("T")[0],
      coolOffDays: 30,
      unlockDate: unlock.toISOString().split("T")[0],
      status: "COOLING"
    });
    this.save();
  }

  addProject(name, budget, parentSupport) {
    this.state.projects.unshift({
      id: "proj-" + Date.now(),
      name: name,
      targetBudget: parseFloat(budget),
      fundedByParents: parseFloat(parentSupport || budget),
      spent: 0,
      startDate: new Date().toISOString().split("T")[0],
      status: "IN_PROGRESS"
    });
    this.save();
  }

  earlyPayoffDebt(debtId, payer = "PARENTS", actualAmount) {
    const debt = this.state.debts.find(d => d.id === debtId);
    if (!debt) return;

    debt.isClosed = true;
    debt.closedReason = payer === "PARENTS" ? "พ่อแม่ช่วยปิดยอดให้" : "ปิดหนี้ด้วยเงินเก็บตัวเอง";
    debt.balance = 0;
    debt.remainingMonths = 0;

    if (payer === "SELF") {
      this.addTransaction(actualAmount || debt.balance, "DEBT_PAYOFF", `ปิดหนี้: ${debt.name}`);
    } else {
      this.state.bailouts.unshift({
        id: "bl-payoff-" + Date.now(),
        date: new Date().toISOString().split("T")[0],
        amount: parseFloat(actualAmount || debt.balance),
        note: `พ่อแม่ช่วยปิดหนี้: ${debt.name}`,
        type: "PROJECT_LUMP_SUM"
      });
    }

    this.save();
  }

  toggleDebtPayer(debtId, payerType) {
    const debt = this.state.debts.find(d => d.id === debtId);
    if (debt) {
      debt.payerType = payerType;
      this.save();
    }
  }

  settleAdvanceReimbursement(debtId) {
    const debt = this.state.debts.find(d => d.id === debtId);
    if (debt) {
      debt.isPendingReimbursement = false;
      this.save();
    }
  }

  applySalaryRaisePercentage(percentage) {
    const pct = parseFloat(percentage);
    if (isNaN(pct)) return;
    const currentSalary = this.state.user.salary;
    const newSalary = Math.round(currentSalary * (1 + pct / 100));
    this.state.user.salary = newSalary;
    this.state.user.lastRaisePercentage = pct;
    this.save();
  }

  updatePaydayCalendarFromText(text) {
    const lines = text.split("\n");
    const THAI_MONTHS = {
      "มกราคม": 1, "ม.ค.": 1, "กุมภาพันธ์": 2, "ก.พ.": 2,
      "มีนาคม": 3, "มี.ค.": 3, "เมษายน": 4, "เม.ย.": 4,
      "พฤษภาคม": 5, "พ.ค.": 5, "มิถุนายน": 6, "มิ.ย.": 6,
      "กรกฎาคม": 7, "ก.ค.": 7, "สิงหาคม": 8, "ส.ค.": 8,
      "กันยายน": 9, "ก.ย.": 9, "ตุลาคม": 10, "ต.ค.": 10,
      "พฤศจิกายน": 11, "พ.ย.": 11, "ธันวาคม": 12, "ธ.ค.": 12
    };

    const parsed = [];
    const yearMatch = text.match(/(?:ปี\s*|พ\.ศ\.\s*)?(25[6-7][0-9])/);
    const resolvedYearBE = yearMatch ? parseInt(yearMatch[1], 10) : 2570;
    const resolvedYearCE = resolvedYearBE - 543;

    for (const line of lines) {
      if (!line.trim()) continue;
      for (const [mName, mNum] of Object.entries(THAI_MONTHS)) {
        if (line.includes(mName)) {
          const dayMatches = [...line.matchAll(/(?:วันที่\s*|:\s*|\s+)([0-3]?[0-9])(?!\d)/g)];
          if (dayMatches.length > 0) {
            const validDays = dayMatches.map(m => parseInt(m[1], 10)).filter(d => d >= 1 && d <= 31);
            if (validDays.length > 0) {
              const selectedDay = Math.max(...validDays);
              parsed.push({
                month: mNum,
                monthName: mName,
                day: selectedDay,
                yearBE: resolvedYearBE,
                yearCE: resolvedYearCE
              });
            }
          }
          break;
        }
      }
    }

    if (parsed.length > 0) {
      parsed.forEach(p => {
        const idx = this.state.salarySchedule.findIndex(s => s.month === p.month);
        if (idx !== -1) {
          this.state.salarySchedule[idx] = p;
        } else {
          this.state.salarySchedule.push(p);
        }
      });
      this.state.salarySchedule.sort((a, b) => a.month - b.month);
      this.save();
      return { success: true, count: parsed.length };
    }
    return { success: false, message: "ไม่พบรูปแบบวันที่ในข้อความ" };
  }

  toggleModule(moduleKey, value) {
    if (this.state.modules[moduleKey] !== undefined) {
      this.state.modules[moduleKey] = value !== undefined ? value : !this.state.modules[moduleKey];
      this.save();
    }
  }

  setStartingBalance(amount) {
    this.state.user.startingBalance = parseFloat(amount) || 0;
    this.save();
  }
}

// Global store instance
window.appStore = new Store();
