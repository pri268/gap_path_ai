/**
 * GAPPath AI - Synthetic Dataset Insights Engine (N=10,000)
 * 
 * CRITICAL DISCLOSURE:
 * The 10,000 records are synthetically generated for benchmark calibration,
 * psychometric difficulty estimation, and cascade error distribution analysis.
 * They are NOT real human student records.
 */

class DatasetInsightsEngine {
  constructor() {
    this.stats = null;
    this.syntheticRecords = [];
    this.currentPage = 1;
    this.pageSize = 25;
  }

  async loadStats() {
    try {
      const resp = await fetch("data/dataset_stats.json");
      this.stats = await resp.json();
      this.renderOverview();
    } catch (e) {
      console.error("Failed to load dataset_stats.json:", e);
    }
  }

  async loadSampleCsv() {
    try {
      const resp = await fetch("data/computer_networks_diagnostic_10000.csv");
      const text = await resp.text();
      const lines = text.split("\n");
      const headers = lines[0].split(",");
      
      // Parse first 200 rows for fast in-browser preview
      const rows = [];
      for (let i = 1; i < Math.min(lines.length, 250); i++) {
        if (!lines[i].trim()) continue;
        const vals = lines[i].split(",");
        const obj = {};
        headers.forEach((h, idx) => {
          obj[h.trim()] = vals[idx] ? vals[idx].trim() : "";
        });
        rows.push(obj);
      }
      this.syntheticRecords = rows;
      this.renderTablePage();
    } catch (e) {
      console.error("Failed to load sample CSV:", e);
    }
  }

  renderOverview() {
    if (!this.stats) return;

    // Metrics Cards
    const totalEl = document.getElementById("syn-total-records");
    const meanEl = document.getElementById("syn-mean-score");
    const stdEl = document.getElementById("syn-std-dev");
    const cascadeEl = document.getElementById("syn-cascade-rate");

    if (totalEl) totalEl.textContent = this.stats.aggregate_metrics.total_records.toLocaleString();
    if (meanEl) meanEl.textContent = `${this.stats.aggregate_metrics.mean_score} / 10`;
    if (stdEl) stdEl.textContent = `± ${this.stats.aggregate_metrics.std_deviation}`;
    if (cascadeEl) cascadeEl.textContent = `${this.stats.aggregate_metrics.prereq_cascade_rate_pct}% (${this.stats.aggregate_metrics.prereq_cascade_incidents.toLocaleString()} incidents)`;

    // Render Score Distribution Histogram
    this.renderScoreHistogram();

    // Render Concept Difficulty Ranking
    this.renderConceptDifficulty();

    // Render Department Benchmarks
    this.renderDeptBenchmarks();
  }

  renderScoreHistogram() {
    const container = document.getElementById("syn-score-histogram");
    if (!container || !this.stats) return;

    const dist = this.stats.score_distribution;
    const maxVal = Math.max(...Object.values(dist));

    let barsHtml = "";
    for (let score = 0; score <= 10; score++) {
      const count = dist[score] || 0;
      const heightPct = Math.round((count / maxVal) * 100);
      const isPass = score >= 6;
      barsHtml += `
        <div class="histogram-col">
          <div class="hist-count">${count}</div>
          <div class="hist-bar-track">
            <div class="hist-bar-fill ${isPass ? 'bar-pass' : 'bar-fail'}" style="height: ${heightPct}%;"></div>
          </div>
          <div class="hist-label">Score ${score}</div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="histogram-wrapper">
        <div class="histogram-bars-row">
          ${barsHtml}
        </div>
      </div>
    `;
  }

  renderConceptDifficulty() {
    const container = document.getElementById("syn-concept-difficulty");
    if (!container || !this.stats) return;

    const rankings = this.stats.concept_difficulty_ranking || [];
    container.innerHTML = rankings.map((c, idx) => {
      const errPct = c.synthetic_error_rate_pct;
      const barColor = errPct >= 45 ? "#EF4444" : (errPct >= 35 ? "#F59E0B" : "#10B981");

      return `
        <div class="difficulty-row">
          <div class="diff-rank">#${idx + 1}</div>
          <div class="diff-meta">
            <div class="diff-title">${c.concept_name} <span class="diff-id">(${c.concept_id})</span></div>
            <div class="diff-stats">${c.synthetic_error_count.toLocaleString()} errors · ${errPct}% failure rate in synthetic cohort</div>
          </div>
          <div class="diff-bar-box">
            <div class="diff-bar-fill" style="width: ${errPct}%; background-color: ${barColor};"></div>
          </div>
        </div>
      `;
    }).join("");
  }

  renderDeptBenchmarks() {
    const container = document.getElementById("syn-dept-benchmarks");
    if (!container || !this.stats) return;

    const depts = this.stats.department_benchmarks;
    container.innerHTML = Object.keys(depts).map(code => {
      const d = depts[code];
      const deptConfig = CONFIG.DEPARTMENTS[code] || { name: code };
      return `
        <div class="dept-benchmark-card">
          <div class="dept-benchmark-title">${code} - ${deptConfig.name}</div>
          <div class="dept-benchmark-grid">
            <div>
              <span class="label">Cohort Sample:</span>
              <strong>${d.count.toLocaleString()} students</strong>
            </div>
            <div>
              <span class="label">Benchmark Mean:</span>
              <strong>${d.mean_score} / 10 (${d.mean_percentage}%)</strong>
            </div>
            <div>
              <span class="label">Pass Rate (>=6):</span>
              <strong class="text-cyan">${d.pass_rate_6_plus}%</strong>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  renderTablePage() {
    const tbody = document.getElementById("syn-table-body");
    const pageIndicator = document.getElementById("syn-page-indicator");
    if (!tbody) return;

    const start = (this.currentPage - 1) * this.pageSize;
    const pageRecords = this.syntheticRecords.slice(start, start + this.pageSize);

    if (pageIndicator) {
      const maxPages = Math.ceil(this.syntheticRecords.length / this.pageSize) || 1;
      pageIndicator.textContent = `Page ${this.currentPage} of ${maxPages} (Showing 25 of 10,000 synthetic records)`;
    }

    tbody.innerHTML = pageRecords.map(r => `
      <tr>
        <td><code>${r.synthetic_record_id}</code></td>
        <td>${r.student_id}</td>
        <td><span class="badge badge-secondary">${r.department}</span></td>
        <td>${r.course}</td>
        <td><strong>${r.score}/10</strong></td>
        <td><span class="badge ${r.primary_likely_gap !== 'NONE' ? 'badge-danger' : 'badge-success'}">${r.primary_likely_gap}</span></td>
        <td>${r.retest_status || 'Secure (3/3)'}</td>
        <td><small class="text-muted">${r.timestamp}</small></td>
      </tr>
    `).join("");
  }

  nextPage() {
    const maxPages = Math.ceil(this.syntheticRecords.length / this.pageSize);
    if (this.currentPage < maxPages) {
      this.currentPage++;
      this.renderTablePage();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.renderTablePage();
    }
  }
}
