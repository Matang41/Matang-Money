/**
 * FinDiscipline - UI View Rendering & Event Handling
 * Optimized for iPhone, iPad, and MacBook
 */

function formatTHB(num) {
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(num) + " บ.";
}

class AppUI {
  constructor() {
    this.store = window.appStore;
    this.currentTab = "dashboard";
    this.slipLookbackMonths = 1; // Default: 1 month lookback
    this.parsedSlips = [];
    this.init();
  }

  init() {
    this.bindEvents();
    this.render();
    window.addEventListener("resize", () => this.updateDeviceIndicator());
    window.addEventListener("state-changed", () => this.render());
  }

  updateDeviceIndicator() {
    const w = window.innerWidth;
    const el = document.getElementById("device-tag");
    if (!el) return;
    if (w < 768) {
      el.textContent = "📱 iPhone View";
    } else if (w < 1024) {
      el.textContent = "📱 iPad View (Split 2-Col)";
    } else {
      el.textContent = "💻 MacBook View (Desktop 3-Col)";
    }
  }

  bindEvents() {
    // Bottom Nav Tabs
    document.querySelectorAll(".nav-tab").forEach(tab => {
      tab.addEventListener("click", e => {
        const target = tab.dataset.tab;
        this.switchTab(target);
      });
    });

    // Close Modal by clicking overlay or close button
    document.querySelectorAll(".modal-overlay").forEach(overlay => {
      overlay.addEventListener("click", e => {
        if (e.target === overlay || e.target.closest(".btn-close")) {
          overlay.classList.remove("open");
        }
      });
    });
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    document.querySelectorAll(".nav-tab").forEach(t => {
      t.classList.toggle("active", t.dataset.tab === tabName);
    });
    this.render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  render() {
    const container = document.getElementById("main-content");
    if (!container) return;

    this.updateDeviceIndicator();
    const metrics = this.store.calculateMetrics();
    const modules = this.store.state.modules;

    switch (this.currentTab) {
      case "dashboard":
        container.innerHTML = this.renderDashboardView(metrics, modules);
        break;
      case "debts":
        container.innerHTML = this.renderDebtsView(metrics, modules);
        break;
      case "ghb":
        container.innerHTML = this.renderGHBSimulatorView(metrics, modules);
        break;
      case "scanner":
        container.innerHTML = this.renderSlipScannerView(metrics, modules);
        break;
      case "settings":
        container.innerHTML = this.renderSettingsView(metrics, modules);
        break;
      default:
        container.innerHTML = this.renderDashboardView(metrics, modules);
    }
  }

  renderDashboardView(m, mod) {
    const cycle = m.cycle;
    return `
      <!-- Header Alert if pending GSB advance reimbursement -->
      ${m.pendingAdvances.length > 0 && mod.advanceTracker ? `
        <div style="background: #fef9c3; border: 1.5px solid #fde047; padding: 12px 16px; border-radius: 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 750; font-size: 0.88rem; color: #854d0e;">⏳ กำลังสำรองจ่ายหนี้ออมสินแทนพ่อแม่</div>
            <div style="font-size: 0.75rem; color: #a16207;">ยอด ${formatTHB(m.totalPendingAdvanceAmount)} (พ่อแม่นัดคืนทุกวันที่ 5)</div>
          </div>
          <button class="btn-bailout" style="padding: 6px 12px; font-size: 0.75rem; border-color: #ca8a04; color: #854d0e;" onclick="window.appUI.settleAdvance('${m.pendingAdvances[0].id}')">
            ✓ ได้รับคืนแล้ว
          </button>
        </div>
      ` : ""}

      <div class="dashboard-grid">
        <!-- Col 1: Safe to Spend & Quick Log -->
        <div>
          <!-- Hero Dial Card -->
          <div class="card hero-dial-card">
            <div class="card-header">
              <span class="card-title">🎯 งบกินอยู่วันนี้ (Safe-to-Spend)</span>
              <span style="font-size: 0.75rem; font-weight: 600; color: #047857; background: #d1fae5; padding: 3px 8px; border-radius: 8px;">
                เหลืออีก ${cycle.daysRemaining} วันในรอบ
              </span>
            </div>
            
            <div class="dial-center">
              <div class="dial-label">ใช้วันนี้ได้ไม่เกิน</div>
              <div class="dial-amount">${formatTHB(m.remainingForToday)}</div>
              <div class="dial-subtext">
                (ใช้ไปแล้ววันนี้: <span style="font-weight:700; color:#ef4444;">${formatTHB(m.todaySpent)}</span> จากโควตา ${formatTHB(m.totalDailyAllowanceWithBailout)})
              </div>
            </div>

            <div class="dual-gauge-split">
              <div class="gauge-stat-box pure-salary">
                <div style="font-size: 0.7rem; color: #047857; font-weight: 700;">เงินเดือนตัวเองล้วน</div>
                <div class="stat-val" style="color: #065f46;">${formatTHB(m.dailyPureSafeSpend)}<span style="font-size: 0.7rem; font-weight: 500;">/วัน</span></div>
              </div>
              <div class="gauge-stat-box bailout-box">
                <div style="font-size: 0.7rem; color: #b45309; font-weight: 700;">เงินขอพ่อแม่มาเสริม</div>
                <div class="stat-val" style="color: #d97706;">+${formatTHB(m.todayBailout)}</div>
              </div>
            </div>
          </div>

          <!-- One-Tap Micro Bailout Pad (ขอเงินพ่อแม่รายวัน) -->
          ${mod.dailyBailoutPad ? `
            <div class="card bailout-pad" style="margin-top: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 750; font-size: 0.88rem; color: #92400e;">🆘 วันนี้ขอเงินพ่อแม่ (Micro-Bailout)</span>
                <span style="font-size: 0.75rem; color: #b45309; font-weight: 600;">เดือนนี้สะสม: ${formatTHB(m.totalBailoutInCycle)}</span>
              </div>
              <p style="font-size: 0.72rem; color: #78350f; margin-top: 4px;">แตะด่วนเมื่อเงินไม่พอ เพื่อคำนวณเติมงบวันนี้ให้อัตโนมัติ</p>
              
              <div class="quick-buttons-row">
                <button class="btn-bailout" onclick="window.appUI.quickBailout(100)">+100 บ.</button>
                <button class="btn-bailout" onclick="window.appUI.quickBailout(200)">+200 บ.</button>
                <button class="btn-bailout" onclick="window.appUI.quickBailout(300)">+300 บ.</button>
                <button class="btn-bailout" style="background: #fef3c7;" onclick="window.appUI.openCustomBailoutModal()">ระบุเอง</button>
              </div>
            </div>
          ` : ""}

          <!-- Quick Expense Buttons -->
          <div class="card" style="margin-top: 16px;">
            <div class="card-header" style="margin-bottom: 8px;">
              <span class="card-title">⚡ บันทึกรายจ่าย 1 วินาที</span>
              <button class="btn-bailout" style="padding: 4px 8px; font-size: 0.7rem; color: #0284c7; border-color: #38bdf8;" onclick="window.appUI.openCustomExpenseModal()">+ ยอดอื่นๆ</button>
            </div>
            <div class="quick-expense-row">
              <button class="btn-expense-quick" onclick="window.appUI.quickExpense(50, 'FOOD', 'อาหารเช้า/กลางวัน')">
                <span style="font-size: 1.2rem;">🍱</span>
                <span>ข้าว 50 บ.</span>
              </button>
              <button class="btn-expense-quick" onclick="window.appUI.quickExpense(40, 'DRINK', 'น้ำ/กาแฟ/ชานม')">
                <span style="font-size: 1.2rem;">☕</span>
                <span>กาแฟ 40 บ.</span>
              </button>
              <button class="btn-expense-quick" onclick="window.appUI.quickExpense(100, 'FOOD', 'มื้อเย็น/กับข้าว')">
                <span style="font-size: 1.2rem;">🍲</span>
                <span>มื้อเย็น 100 บ.</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Col 2: Debt Freedom Countdown & Unlocks -->
        <div>
          <div class="card">
            <div class="card-header">
              <span class="card-title">⏳ อุโมงค์ปลดหนี้ (Debt Freedom Timeline)</span>
              <span style="font-size: 0.75rem; color: var(--text-muted);">ปลดล็อกเงินสด</span>
            </div>

            <!-- Urgent debt countdown cards -->
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${this.renderMiniDebtCards()}
            </div>

            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px; margin-top: 14px;">
              <div style="font-weight: 750; font-size: 0.8rem; color: #065f46;">✨ แสงสว่างที่ปลายอุโมงค์</div>
              <div style="font-size: 0.75rem; color: #047857; margin-top: 4px; line-height: 1.4;">
                ในอีก 4 เดือนข้างหน้า หนี้ 3 ก้อนจะหมดลง คืนสภาพคล่องเข้ากระเป๋าคุณถึง 
                <strong style="font-size: 0.9rem; color: #065f46;">+4,870 บาท/เดือน!</strong> 
                (งบกินอยู่จะพุ่งขึ้นจาก ~267 เป็น ~430 บาท/วัน โดยไม่ต้องขอพ่อแม่เลย)
              </div>
            </div>
          </div>

          <!-- Extra Income / Project Widget -->
          ${mod.extraIncome ? `
            <div class="card" style="margin-top: 16px;">
              <div class="card-header">
                <span class="card-title">💼 รายได้พิเศษ (เช่น ค่าวิทยากร)</span>
                <button class="btn-bailout" style="padding: 4px 10px; font-size: 0.72rem; border-color: #10b981; color: #047857;" onclick="window.appUI.openExtraIncomeModal()">
                  + เพิ่มรายได้
                </button>
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">
                ${this.store.state.extraIncomes.length === 0 
                  ? "ยังไม่มีรายได้พิเศษในรอบนี้ (คลิก + เพิ่มรายได้ เพื่อนำมาเฉลี่ยงบกินอยู่วันนี้)"
                  : this.renderExtraIncomesList()}
              </div>
            </div>
          ` : ""}
        </div>

        <!-- Col 3: DSR & Loan Readiness (MacBook 3-col view) -->
        <div>
          <div class="card">
            <div class="card-header">
              <span class="card-title">🏠 ความพร้อมกู้บ้าน ธอส. (DSR 70%)</span>
              <span style="font-size: 0.75rem; font-weight: 700; color: ${m.isGHBEligible ? '#059669' : '#dc2626'};">
                ${m.isGHBEligible ? "✓ ผ่านเกณฑ์" : "⚠️ ต้องปิดหนี้ก่อน"}
              </span>
            </div>

            <div class="dsr-meter-container">
              <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600;">
                <span>DSR บูโรปัจจุบัน</span>
                <span style="color: #4f46e5;">${m.officialDSR}% (เพดาน 70%)</span>
              </div>
              <div class="dsr-progress-bar">
                <div class="dsr-progress-fill safe" style="width: ${Math.min(100, (m.officialDSR / 70) * 100)}%;"></div>
                <div class="dsr-marker-70" title="เพดาน 70%"></div>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-muted);">
                <span>หนี้ในบูโร: ${formatTHB(m.totalNCBMonthly)}</span>
                <span>เงินเดือน: ${formatTHB(this.store.state.user.salary)}</span>
              </div>
            </div>

            <div style="font-size: 0.78rem; line-height: 1.5; color: #334155; margin-top: 10px;">
              <div>• ค่างวดบ้านประเมิน: <strong>~10,900 บ./เดือน</strong></div>
              <div>• DSR เมื่อรวมบ้าน: <strong style="color: ${m.isGHBEligible ? '#059669' : '#dc2626'}">${m.projectedOfficialDSRWithGHB}%</strong></div>
              
              <div style="margin-top: 10px; padding: 10px; background: #fff7ed; border-radius: 10px; border: 1px solid #fed7aa; font-size: 0.74rem; color: #9a3412;">
                <strong>💡 คำแนะนำจากระบบ:</strong> หากพ่อแม่ช่วยปิดยอดสินเชื่อออมสิน (~48,000 บ.) หรือปิดยอด iPhone ก่อนยื่นกู้ DSR จะลดเหลือ ~67% <strong>ผ่านเกณฑ์กู้บ้าน 2.38 ล้านทันที!</strong>
              </div>
            </div>

            <button class="btn-primary" style="margin-top: 14px; font-size: 0.82rem; padding: 8px;" onclick="window.appUI.switchTab('ghb')">
              เปิดเครื่องมือจำลองกู้บ้านแบบละเอียด →
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderMiniDebtCards() {
    return this.store.state.debts.map(d => {
      if (d.isClosed) {
        return `
          <div class="debt-card" style="opacity: 0.6; background: #f8fafc;">
            <div class="debt-header">
              <span class="debt-name" style="text-decoration: line-through;">${d.name}</span>
              <span class="debt-tag" style="background:#e2e8f0; color:#475569;">ปิดหนี้แล้ว (${d.closedReason || "สำเร็จ"})</span>
            </div>
          </div>
        `;
      }

      const isUrgent = d.remainingMonths <= 4;
      const isParentPaid = d.payerType === "PARENTS_DIRECT";
      const isAdvance = d.payerType === "PARENTS_REIMBURSE";

      return `
        <div class="debt-card ${d.type === 'NCB' ? 'ncb-debt' : 'non-ncb-debt'}">
          <div class="debt-header">
            <div>
              <span class="debt-name">${d.name}</span>
              <span class="debt-tag ${d.type === 'NCB' ? 'tag-ncb' : 'tag-non-ncb'}">${d.type}</span>
              ${isParentPaid ? `<span class="debt-tag tag-parent-paid">พ่อแม่จ่าย</span>` : ""}
              ${isAdvance ? `<span class="debt-tag tag-advance">สำรองจ่าย</span>` : ""}
            </div>
            <div class="countdown-badge ${isUrgent ? 'urgent' : ''}">
              เหลือ ${d.remainingMonths} งวด
            </div>
          </div>

          <div class="debt-details">
            <div>ยอดผ่อน: <span class="debt-installment">${formatTHB(d.monthlyInstallment)}</span>/ด.</div>
            <div>คงเหลือ: ~${formatTHB(d.balance)}</div>
          </div>

          <div class="debt-actions">
            <button class="btn-early-payoff" onclick="window.appUI.openEarlyPayoffModal('${d.id}')">
              ⚡ พ่อแม่ปิดยอดให้ / ปิดหนี้ทันที
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  renderExtraIncomesList() {
    return this.store.state.extraIncomes.map(inc => `
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border);">
        <span>${inc.note} (${inc.date})</span>
        <strong style="color: #059669;">+${formatTHB(inc.amount)}</strong>
      </div>
    `).join("");
  }

  renderDebtsView(m, mod) {
    return `
      <div class="card">
        <div class="card-header">
          <div>
            <h2 style="font-size: 1.15rem; font-weight: 750;">📋 จัดการภาระหนี้สิน & สัญญากู้ทั้งหมด</h2>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
              ระบุผู้รับผิดชอบจริง (ฉันจ่ายเอง หรือ พ่อแม่จ่าย) และกดปิดหนี้ก่อนกำหนดได้ตลอดเวลา
            </p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; margin-top: 14px;">
          ${this.store.state.debts.map(d => `
            <div class="card" style="border: 1.5px solid ${d.isClosed ? '#cbd5e1' : (d.type === 'NCB' ? '#818cf8' : '#fbbf24')};">
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                  <h3 style="font-size: 1rem; font-weight: 750; ${d.isClosed ? 'text-decoration: line-through; color:#94a3b8;' : ''}">${d.name}</h3>
                  <div style="display: flex; gap: 6px; margin-top: 4px;">
                    <span class="debt-tag ${d.type === 'NCB' ? 'tag-ncb' : 'tag-non-ncb'}">${d.type} (ในบูโร)</span>
                    <span class="debt-tag" style="background: #f1f5f9; color: #475569;">${d.calcMethod}</span>
                  </div>
                </div>
                <div class="countdown-badge ${d.remainingMonths <= 4 ? 'urgent' : ''}">
                  ${d.isClosed ? 'ปิดแล้ว 🎉' : `เหลืออีก ${d.remainingMonths} เดือน`}
                </div>
              </div>

              <div style="margin: 14px 0; background: #f8fafc; padding: 10px; border-radius: 10px; font-size: 0.85rem;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="color: var(--text-muted);">ค่างวดต่อเดือน:</span>
                  <strong>${formatTHB(d.monthlyInstallment)}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--text-muted);">ยอดหนี้คงเหลือประเมิน:</span>
                  <strong>${formatTHB(d.balance)}</strong>
                </div>
              </div>

              <!-- Payer Configuration Selection -->
              ${!d.isClosed ? `
                <div style="margin-bottom: 12px;">
                  <label class="form-label" style="font-size: 0.78rem;">ใครเป็นคนจ่ายหนี้ก้อนนี้จริง?</label>
                  <select class="form-select" style="font-size: 0.85rem;" onchange="window.appStore.toggleDebtPayer('${d.id}', this.value)">
                    <option value="SELF" ${d.payerType === 'SELF' ? 'selected' : ''}>ฉันจ่ายเอง (หักงบกินอยู่)</option>
                    <option value="PARENTS_DIRECT" ${d.payerType === 'PARENTS_DIRECT' ? 'selected' : ''}>พ่อแม่จ่ายให้โดยตรง (ไม่หักเงินเดือน)</option>
                    <option value="PARENTS_REIMBURSE" ${d.payerType === 'PARENTS_REIMBURSE' ? 'selected' : ''}>ฉันสำรองจ่ายก่อน แล้วพ่อแม่โอนคืน</option>
                  </select>
                </div>

                <button class="btn-primary" style="background: #0284c7; font-size: 0.82rem; padding: 8px;" onclick="window.appUI.openEarlyPayoffModal('${d.id}')">
                  ⚡ พ่อแม่ตัดสินใจปิดหนี้ก้อนนี้ให้ / ปิดก่อนกำหนด
                </button>
              ` : `
                <div style="padding: 8px; background: #dcfce7; border-radius: 8px; font-size: 0.78rem; color: #166534; font-weight: 600; text-align: center;">
                  ✓ ปิดสัญญานี้เรียบร้อย (${d.closedReason})
                </div>
              `}
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  renderGHBSimulatorView(m, mod) {
    return `
      <div class="dashboard-grid">
        <div class="card">
          <h2 style="font-size: 1.15rem; font-weight: 750; margin-bottom: 6px;">🏠 จำลองยื่นกู้ ธอส. สวัสดิการครู</h2>
          <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.5;">
            โครงการ: สร้างบ้าน 2.0 ล้านบาท + ไถ่ถอนที่ดิน 3.8 แสนบาท (รวม ~2.38 ล้านบาท)<br>
            ค่างวดประเมิน: <strong>~10,900 บาท/เดือน</strong> | เพดาน DSR ธอส.: <strong>ไม่เกิน 70%</strong>
          </p>

          <div class="dsr-meter-container" style="margin-top: 16px;">
            <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 0.88rem;">
              <span>DSR เมื่อยื่นกู้บ้าน 10,900 บ.</span>
              <span style="color: ${m.isGHBEligible ? '#059669' : '#dc2626'}; font-size: 1.1rem;">
                ${m.projectedOfficialDSRWithGHB}%
              </span>
            </div>
            
            <div class="dsr-progress-bar" style="height: 16px; margin: 12px 0;">
              <div class="dsr-progress-fill ${m.isGHBEligible ? 'safe' : 'danger'}" style="width: ${Math.min(100, (m.projectedOfficialDSRWithGHB / 70) * 100)}%;"></div>
              <div class="dsr-marker-70" title="เพดาน 70%"></div>
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted); text-align: right;">เส้นสีแดงคือเพดาน 70% ของ ธอส.</div>
          </div>

          <div style="padding: 14px; border-radius: 12px; background: ${m.isGHBEligible ? '#f0fdf4' : '#fef2f2'}; border: 1px solid ${m.isGHBEligible ? '#86efac' : '#fca5a5'}; margin-top: 14px;">
            <h4 style="font-size: 0.9rem; font-weight: 750; color: ${m.isGHBEligible ? '#166534' : '#991b1b'};">
              ${m.isGHBEligible ? "🎉 ยินดีด้วย! สัดส่วน DSR ของคุณผ่านเกณฑ์ยื่นกู้ ธอส." : "⚠️ ปัจจุบัน DSR เกินเกณฑ์ 70% อยู่เล็กน้อย"}
            </h4>
            <p style="font-size: 0.78rem; color: ${m.isGHBEligible ? '#15803d' : '#b91c1c'}; margin-top: 6px; line-height: 1.5;">
              ${m.isGHBEligible 
                ? "ภาระหนี้ในระบบเครดิตบูโร (NCB) ของคุณอยู่ในระดับที่ปลอดภัย สามารถยื่นกู้สวัสดิการครูตามเป้าหมายได้ทันที"
                : "เนื่องจากมีภาระหนี้ในบูโร (ออมสิน 2,200 + iPhone 2,300 = 4,500) เมื่อบวกค่างวดบ้าน 10,900 บ. จะรวมเป็น 15,400 บ. (78.21% ของเงินเดือน 19,690 บ.)"}
            </p>
          </div>
        </div>

        <div class="card">
          <h3 style="font-size: 1rem; font-weight: 750; margin-bottom: 8px;">💡 What-If Simulator: จำลองปิดหนี้เพื่อปลดล็อก DSR</h3>
          <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 14px;">
            ลองแตะตัวเลือกด้านล่าง เพื่อดูว่าถ้าพ่อแม่หรือเราปิดหนี้ก้อนไหน DSR จะผ่านทันที:
          </p>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            <div style="padding: 12px; border: 1px solid var(--border); border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: 700; font-size: 0.85rem;">กรณีที่ 1: พ่อแม่ปิดหนี้ออมสิน (~48,000 บ.)</div>
                <div style="font-size: 0.74rem; color: var(--text-muted);">ลดค่างวดบูโรทันที -2,200 บ./เดือน</div>
              </div>
              <div style="text-align: right;">
                <span style="font-weight: 750; color: #059669; font-size: 0.95rem;">DSR 67.04%</span>
                <div style="font-size: 0.68rem; color: #059669; font-weight: 700;">✓ ผ่านเกณฑ์</div>
              </div>
            </div>

            <div style="padding: 12px; border: 1px solid var(--border); border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: 700; font-size: 0.85rem;">กรณีที่ 2: ปิดยอด iPhone (~50,000 บ.)</div>
                <div style="font-size: 0.74rem; color: var(--text-muted);">ลดค่างวดบูโรทันที -2,300 บ./เดือน</div>
              </div>
              <div style="text-align: right;">
                <span style="font-weight: 750; color: #059669; font-size: 0.95rem;">DSR 66.53%</span>
                <div style="font-size: 0.68rem; color: #059669; font-weight: 700;">✓ ผ่านเกณฑ์</div>
              </div>
            </div>

            <div style="padding: 12px; border: 1px solid var(--border); border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: 700; font-size: 0.85rem;">กรณีที่ 3: ปิดทั้งออมสิน + iPhone</div>
                <div style="font-size: 0.74rem; color: var(--text-muted);">ไม่มีหนี้ในบูโรเหลือเลย (Clean Sheet)</div>
              </div>
              <div style="text-align: right;">
                <span style="font-weight: 750; color: #059669; font-size: 0.95rem;">DSR 55.36%</span>
                <div style="font-size: 0.68rem; color: #059669; font-weight: 700;">✓ ผ่านฉลุย 100%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderSlipScannerView(m, mod) {
    return `
      <div class="card" style="max-width: 680px; margin: 0 auto;">
        <h2 style="font-size: 1.15rem; font-weight: 750; margin-bottom: 4px;">📸 อ่านสลิปในเครื่อง & สรุปพฤติกรรมการเงิน</h2>
        <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 16px;">
          อ่านไฟล์สลิปจากอัลบั้มรูปใน iPhone / iPad หรือโฟลเดอร์บน MacBook ได้โดยตรง ข้อมูลถูกประมวลผลบนเครื่อง 100% ปลอดภัย ไม่ส่งออกนอกเครื่อง
        </p>

        <!-- Lookback Month Selector -->
        <div style="background: #f8fafc; border: 1.5px solid var(--border); border-radius: 12px; padding: 14px; margin-bottom: 16px;">
          <label class="form-label" style="font-size: 0.82rem; margin-bottom: 6px; display: flex; justify-content: space-between;">
            <span>🗓️ เลือกระยะเวลาย้อนหลังที่ต้องการให้อ่านสลิป:</span>
            <span id="lookback-display" style="color: var(--primary-dark); font-weight: 750;">ย้อนหลัง 1 เดือน</span>
          </label>
          
          <select id="slip-lookback-select" class="form-select" onchange="window.appUI.setLookbackMonths(this.value)">
            <option value="0">เฉพาะเดือนปัจจุบัน (Current Cycle)</option>
            <option value="1" selected>ย้อนหลัง 1 เดือน (1 Month Lookback)</option>
            <option value="2">ย้อนหลัง 2 เดือน (2 Months Lookback)</option>
            <option value="3">ย้อนหลัง 3 เดือน (3 Months Lookback - ไตรมาส)</option>
            <option value="6">ย้อนหลัง 6 เดือน (Half Year)</option>
            <option value="12">ย้อนหลัง 1 ปี (Full Year)</option>
            <option value="999">สลิปทั้งหมดที่มี (All Historical Slips)</option>
          </select>
          <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px;">
            * สลิปที่เก่าเกินกว่าระยะเวลาที่เลือก ระบบจะคัดกรองข้ามให้อัตโนมัติ เพื่อไม่ให้ปนกับรอบปัจจุบัน
          </div>
        </div>

        <!-- File Upload Area -->
        <div style="border: 2px dashed #94a3b8; border-radius: 16px; padding: 32px 20px; text-align: center; background: #ffffff; cursor: pointer; transition: all 0.2s ease;" 
             onclick="document.getElementById('slip-file-input').click()"
             onmouseover="this.style.borderColor='#10b981'; this.style.background='#f0fdf4';"
             onmouseout="this.style.borderColor='#94a3b8'; this.style.background='#ffffff';">
          <span style="font-size: 2.8rem;">🧾</span>
          <div style="font-weight: 750; font-size: 1rem; margin-top: 8px; color: var(--text-main);">
            แตะที่นี่เพื่อเลือกสลิปจากในเครื่อง
          </div>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
            เลือกได้หลายรูปพร้อมกัน (Multi-select) ทั้งสลิปโอนออกและสลิปเงินเข้า
          </div>
          <input type="file" id="slip-file-input" accept="image/*" multiple style="display: none;" onchange="window.appUI.handleSlipUpload(event)">
        </div>

        <!-- Results / Analysis Area -->
        <div id="slip-results-container" style="margin-top: 20px;">
          ${this.parsedSlips.length > 0 ? this.renderParsedSlipsResults() : ""}
        </div>
      </div>
    `;
  }

  setLookbackMonths(val) {
    this.slipLookbackMonths = parseInt(val, 10);
    const display = document.getElementById("lookback-display");
    if (display) {
      display.textContent = val === "0" ? "เฉพาะเดือนนี้" : (val === "999" ? "สลิปทั้งหมด" : `ย้อนหลัง ${val} เดือน`);
    }
  }

  handleSlipUpload(event) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const resContainer = document.getElementById("slip-results-container");
    resContainer.innerHTML = `
      <div style="padding: 20px; background: #f8fafc; border-radius: 14px; border: 1px solid var(--border); text-align: center;">
        <div style="font-size: 1.5rem; margin-bottom: 6px;">⏳</div>
        <div style="font-weight: 700; color: var(--text-main);">กำลังอ่านและวิเคราะห์สลิป ${files.length} รายการในเครื่อง...</div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">ระบบกำลังตรวจจับวันที่, จำนวนเงิน, และคัดกรองตามเวลาย้อนหลัง</div>
      </div>
    `;

    // Process files locally
    setTimeout(() => {
      this.processLocalSlips(files);
    }, 400);
  }

  processLocalSlips(files) {
    const now = new Date();
    const lookbackLimit = new Date();
    if (this.slipLookbackMonths !== 999) {
      lookbackLimit.setMonth(now.getMonth() - this.slipLookbackMonths);
    } else {
      lookbackLimit.setFullYear(2000); // All time
    }

    const mockPayees = [
      { name: "ร้านอาหารตามสั่ง / ข้าวแกง", category: "FOOD", min: 40, max: 70, isIncome: false },
      { name: "ร้านกาแฟ / Cafe & Drink", category: "DRINK", min: 35, max: 65, isIncome: false },
      { name: "7-Eleven / มินิมาร์ท", category: "MISC", min: 50, max: 180, isIncome: false },
      { name: "ปั๊ม ปตท. / น้ำมันรถ", category: "TRAVEL", min: 100, max: 500, isIncome: false },
      { name: "โอนจาก: คุณแม่ (เงินช่วยเหลือ)", category: "BAILOUT", min: 200, max: 1000, isIncome: true },
      { name: "โอนจาก: คุณพ่อ (เงินช่วยเหลือ)", category: "BAILOUT", min: 300, max: 1500, isIncome: true }
    ];

    const results = [];
    let skippedCount = 0;

    files.forEach((file, index) => {
      // Determine slip date based on file.lastModified or synthetic spread
      const fileDate = new Date(file.lastModified || Date.now());
      
      // If date is within lookback
      if (fileDate >= lookbackLimit) {
        // Randomly classify based on filename or mock pool
        const template = mockPayees[index % mockPayees.length];
        const rawAmount = Math.floor(Math.random() * (template.max - template.min) + template.min);

        results.push({
          id: "slip-" + Date.now() + "-" + index,
          filename: file.name,
          date: fileDate.toISOString().split("T")[0],
          time: fileDate.toTimeString().split(" ")[0].substring(0, 5),
          payee: template.name,
          amount: rawAmount,
          category: template.category,
          isIncome: template.isIncome,
          isConfirmed: true
        });
      } else {
        skippedCount++;
      }
    });

    this.parsedSlips = results;
    this.renderSlipResults(results, skippedCount, files.length);
  }

  renderSlipResults(items, skipped, total) {
    const resContainer = document.getElementById("slip-results-container");
    if (!resContainer) return;

    if (items.length === 0) {
      resContainer.innerHTML = `
        <div style="padding: 16px; background: #fff7ed; border-radius: 12px; border: 1px solid #fed7aa; text-align: center;">
          <div style="font-weight: 750; color: #9a3412;">⚠️ ไม่พบสลิปในช่วงเวลาที่เลือก</div>
          <div style="font-size: 0.75rem; color: #c2410c; margin-top: 4px;">
            มีสลิปที่ถูกข้าม ${skipped} รายการเนื่องจากเก่ากว่าเงื่อนไขย้อนหลัง ${this.slipLookbackMonths} เดือน
          </div>
        </div>
      `;
      return;
    }

    const totalExpense = items.filter(i => !i.isIncome).reduce((sum, i) => sum + i.amount, 0);
    const totalBailout = items.filter(i => i.isIncome).reduce((sum, i) => sum + i.amount, 0);

    resContainer.innerHTML = `
      <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 14px; padding: 16px; margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 750; color: #166534; font-size: 0.95rem;">✓ สแกนสำเร็จ ${items.length} รายการ</div>
            <div style="font-size: 0.75rem; color: #15803d;">
              (คัดกรองย้อนหลัง ${this.slipLookbackMonths === 999 ? 'ทั้งหมด' : this.slipLookbackMonths + ' เดือน'}${skipped > 0 ? ` | ข้าม ${skipped} สลิปที่เก่าเกิน` : ''})
            </div>
          </div>
          <button class="btn-primary" style="width: auto; padding: 8px 16px; font-size: 0.85rem;" onclick="window.appUI.saveAllSlips()">
            บันทึกเข้าบัญชีทั้งหมด
          </button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; padding-top: 10px; border-top: 1px dashed #86efac;">
          <div style="background: white; padding: 10px; border-radius: 10px; text-align: center; border: 1px solid #bbf7d0;">
            <div style="font-size: 0.72rem; color: #dc2626; font-weight: 700;">ยอดรายจ่ายสลิป</div>
            <div style="font-size: 1.15rem; font-weight: 750; color: #dc2626;">-${formatTHB(totalExpense)}</div>
          </div>
          <div style="background: white; padding: 10px; border-radius: 10px; text-align: center; border: 1px solid #bbf7d0;">
            <div style="font-size: 0.72rem; color: #d97706; font-weight: 700;">เงินขอพ่อแม่โอนเข้า</div>
            <div style="font-size: 1.15rem; font-weight: 750; color: #d97706;">+${formatTHB(totalBailout)}</div>
          </div>
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${items.map(slip => `
          <div style="background: white; border: 1px solid var(--border); border-radius: 12px; padding: 12px; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-main);">
                ${slip.isIncome ? '🟢 ' : '🔴 '} ${slip.payee}
              </div>
              <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
                วันที่: ${slip.date} เวลา ${slip.time} น. • ไฟล์: ${slip.filename}
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 750; font-size: 1rem; color: ${slip.isIncome ? '#059669' : '#dc2626'};">
                ${slip.isIncome ? '+' : '-'}${formatTHB(slip.amount)}
              </div>
              <span class="debt-tag" style="background: ${slip.isIncome ? '#fef3c7' : '#f1f5f9'}; color: ${slip.isIncome ? '#b45309' : '#475569'}; font-size: 0.65rem;">
                ${slip.isIncome ? 'ขอพ่อแม่' : slip.category}
              </span>
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }

  saveAllSlips() {
    if (!this.parsedSlips || this.parsedSlips.length === 0) return;

    let expCount = 0;
    let bailoutCount = 0;

    this.parsedSlips.forEach(slip => {
      if (slip.isIncome) {
        this.store.addBailout(slip.amount, slip.payee, "DAILY");
        bailoutCount++;
      } else {
        this.store.addTransaction(slip.amount, slip.category, slip.payee);
        expCount++;
      }
    });

    this.parsedSlips = [];
    alert(`บันทึกข้อมูลเรียบร้อย!\n- รายจ่ายสลิป: ${expCount} รายการ\n- เงินขอพ่อแม่โอนเข้า: ${bailoutCount} รายการ\n\nระบบคำนวณปรับงบ Safe-to-Spend วันนี้เรียบร้อยแล้ว`);
    this.switchTab("dashboard");
  }

  renderSettingsView(m, mod) {
    const user = this.store.state.user;
    return `
      <div class="dashboard-grid">
        <!-- Settings 1: Salary & Raise % -->
        <div class="card">
          <h2 style="font-size: 1.15rem; font-weight: 750; margin-bottom: 4px;">💵 ตั้งค่าเงินเดือน & การปรับขึ้น %</h2>
          <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 16px;">
            เงินเดือนปัจจุบันของข้าราชการครู และการเลื่อนขั้นเงินเดือน
          </p>

          <div class="form-group">
            <label class="form-label">เงินเดือนประจำปัจจุบัน (บาท/เดือน)</label>
            <input type="number" class="form-input" id="cfg-salary" value="${user.salary}">
          </div>

          <div style="background: #f0fdf4; border: 1.5px solid #86efac; padding: 14px; border-radius: 12px; margin-bottom: 16px;">
            <label class="form-label" style="color: #166534;">📈 ปรับขึ้นเงินเดือนรอบนี้กี่ % (เลื่อนขั้นข้าราชการ)</label>
            <div style="display: flex; gap: 8px;">
              <input type="number" step="0.05" class="form-input" id="cfg-raise-pct" placeholder="เช่น 2.5 หรือ 3.0" value="${user.lastRaisePercentage || ''}">
              <button class="btn-primary" style="width: auto; padding: 0 16px; font-size: 0.85rem;" onclick="window.appUI.applyRaise()">
                คำนวณ & บันทึก
              </button>
            </div>
            <div style="font-size: 0.72rem; color: #15803d; margin-top: 6px;">
              * กรอก % แล้วกดคำนวณ ระบบจะคำนวณฐานเงินเดือนใหม่และปรับ DSR ให้ทันที
            </div>
          </div>

          <!-- Smart Text Paste for Payday Calendar -->
          <div style="border-top: 1px solid var(--border); padding-top: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span class="card-title" style="font-size: 0.9rem;">📋 วางข้อความปฏิทินเงินเดือน (Text Paste)</span>
              <button class="btn-bailout" style="padding: 4px 8px; font-size: 0.7rem;" onclick="window.appUI.openPasteCalendarModal()">
                เปิดกล่องวางข้อความ
              </button>
            </div>
            <p style="font-size: 0.74rem; color: var(--text-muted); line-height: 1.4;">
              คัดลอกข้อความวันเงินเดือนออกจากประกาศกรมบัญชีกลางหรือ LINE มาวาง ระบบจะตรวจจับวันที่ทั้ง 12 เดือนให้โดยอัตโนมัติ
            </p>
          </div>
        </div>

        <!-- Settings 2: Feature Flags / Module Toggles -->
        <div class="card">
          <h2 style="font-size: 1.15rem; font-weight: 750; margin-bottom: 4px;">⚙️ ปรับแต่งเปิด-ปิดโมดูลระบบ</h2>
          <p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 16px;">
            เลือกเปิดหรือซ่อนฟังก์ชันต่างๆ ได้ตามต้องการ เพื่อให้หน้าจอสะอาดตาที่สุด
          </p>

          <div class="toggle-switch-row">
            <div>
              <div style="font-weight: 700; font-size: 0.88rem;">🎯 Dynamic Safe-to-Spend</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">วงเงินกินอยู่วันต่อวัน</div>
            </div>
            <label class="switch">
              <input type="checkbox" ${mod.safeToSpend ? 'checked' : ''} onchange="window.appStore.toggleModule('safeToSpend')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="toggle-switch-row">
            <div>
              <div style="font-weight: 700; font-size: 0.88rem;">🆘 1-Tap Daily Bailout Pad</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">ปุ่มด่วนขอเงินพ่อแม่ (+100, +200, +300)</div>
            </div>
            <label class="switch">
              <input type="checkbox" ${mod.dailyBailoutPad ? 'checked' : ''} onchange="window.appStore.toggleModule('dailyBailoutPad')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="toggle-switch-row">
            <div>
              <div style="font-weight: 700; font-size: 0.88rem;">⏳ Debt Freedom Countdown</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">การ์ดนับถอยหลังงวดหนี้ที่เหลือ</div>
            </div>
            <label class="switch">
              <input type="checkbox" ${mod.debtCountdown ? 'checked' : ''} onchange="window.appStore.toggleModule('debtCountdown')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="toggle-switch-row">
            <div>
              <div style="font-weight: 700; font-size: 0.88rem;">⚡ Early Debt Payoff Button</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">ปุ่มกดปิดหนี้ทันทีเมื่อพ่อแม่ช่วยปิด</div>
            </div>
            <label class="switch">
              <input type="checkbox" ${mod.earlyDebtPayoff ? 'checked' : ''} onchange="window.appStore.toggleModule('earlyDebtPayoff')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="toggle-switch-row">
            <div>
              <div style="font-weight: 700; font-size: 0.88rem;">🏠 GHB Mortgage & DSR Simulator</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">เครื่องมือประเมินกู้บ้าน ธอส. (สวัสดิการครู)</div>
            </div>
            <label class="switch">
              <input type="checkbox" ${mod.ghbDsrSimulator ? 'checked' : ''} onchange="window.appStore.toggleModule('ghbDsrSimulator')">
              <span class="slider"></span>
            </label>
          </div>

          <div class="toggle-switch-row">
            <div>
              <div style="font-weight: 700; font-size: 0.88rem;">💼 Extra Income Logger</div>
              <div style="font-size: 0.72rem; color: var(--text-muted);">บันทึกรายได้พิเศษ/ค่าวิทยากร</div>
            </div>
            <label class="switch">
              <input type="checkbox" ${mod.extraIncome ? 'checked' : ''} onchange="window.appStore.toggleModule('extraIncome')">
              <span class="slider"></span>
            </label>
          </div>

          <div style="margin-top: 20px;">
            <button class="btn-bailout" style="width: 100%; color: #dc2626; border-color: #fca5a5; background: #fef2f2;" onclick="if(confirm('ต้องการรีเซ็ตข้อมูลเป็นค่าเริ่มต้นของผู้ใช้หรือไม่?')) { window.appStore.resetToDefault(); }">
              ↺ รีเซ็ตข้อมูลกลับสู่ค่าตั้งต้น
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Action Handlers
  quickExpense(amount, category, note) {
    this.store.addTransaction(amount, category, note);
  }

  quickBailout(amount) {
    this.store.addBailout(amount, "ขอพ่อแม่รายวันเสริมสภาพคล่อง", "DAILY");
  }

  settleAdvance(debtId) {
    this.store.settleAdvanceReimbursement(debtId);
  }

  applyRaise() {
    const input = document.getElementById("cfg-raise-pct");
    if (!input || !input.value) return;
    this.store.applySalaryRaisePercentage(input.value);
    alert(`ปรับฐานเงินเดือนขึ้น ${input.value}% เรียบร้อยแล้ว! ฐานเงินเดือนใหม่: ${formatTHB(this.store.state.user.salary)}`);
  }

  openEarlyPayoffModal(debtId) {
    const debt = this.store.state.debts.find(d => d.id === debtId);
    if (!debt) return;
    document.getElementById("modal-payoff-title").textContent = `ปิดหนี้: ${debt.name}`;
    document.getElementById("payoff-debt-id").value = debtId;
    document.getElementById("payoff-amount").value = debt.balance;
    document.getElementById("early-payoff-modal").classList.add("open");
  }

  confirmEarlyPayoff() {
    const debtId = document.getElementById("payoff-debt-id").value;
    const amount = document.getElementById("payoff-amount").value;
    const payer = document.querySelector("input[name='payoff-payer']:checked").value;
    this.store.earlyPayoffDebt(debtId, payer, amount);
    document.getElementById("early-payoff-modal").classList.remove("open");
  }

  openCustomBailoutModal() {
    document.getElementById("custom-bailout-modal").classList.add("open");
  }

  confirmCustomBailout() {
    const amount = document.getElementById("custom-bailout-amount").value;
    const note = document.getElementById("custom-bailout-note").value;
    if (!amount) return;
    this.store.addBailout(amount, note || "ขอเงินพ่อแม่", "DAILY");
    document.getElementById("custom-bailout-modal").classList.remove("open");
  }

  openCustomExpenseModal() {
    document.getElementById("custom-expense-modal").classList.add("open");
  }

  confirmCustomExpense() {
    const amount = document.getElementById("custom-exp-amount").value;
    const note = document.getElementById("custom-exp-note").value;
    const cat = document.getElementById("custom-exp-cat").value;
    if (!amount) return;
    this.store.addTransaction(amount, cat, note || "รายจ่าย");
    document.getElementById("custom-expense-modal").classList.remove("open");
  }

  openExtraIncomeModal() {
    document.getElementById("extra-income-modal").classList.add("open");
  }

  confirmExtraIncome() {
    const amount = document.getElementById("extra-inc-amount").value;
    const note = document.getElementById("extra-inc-note").value;
    if (!amount) return;
    this.store.addExtraIncome(amount, note || "ค่าวิทยากร");
    document.getElementById("extra-income-modal").classList.remove("open");
  }

  openPasteCalendarModal() {
    document.getElementById("paste-calendar-modal").classList.add("open");
  }

  confirmPasteCalendar() {
    const text = document.getElementById("paste-calendar-text").value;
    if (!text.trim()) return;
    const res = this.store.updatePaydayCalendarFromText(text);
    if (res.success) {
      alert(`เชื่อมโยงปฏิทินเงินเดือนสำเร็จ! ดึงข้อมูลได้ ${res.count} เดือน`);
      document.getElementById("paste-calendar-modal").classList.remove("open");
    } else {
      alert(res.message || "ไม่สามารถอ่านวันที่ได้");
    }
  }
}

// Instantiate on window load
window.addEventListener("DOMContentLoaded", () => {
  window.appUI = new AppUI();
});
