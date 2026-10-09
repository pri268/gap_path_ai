/**
 * GAPPath AI - Interactive Concept Status Map
 * Renders an interactive DAG (Directed Acyclic Graph) showing the 10 CN concepts,
 * prerequisite arrows, and real-time student diagnostic evidence states.
 */

class ConceptMap {
  constructor(containerId, onSelectConceptCallback) {
    this.container = document.getElementById(containerId);
    this.onSelectConcept = onSelectConceptCallback;
    this.currentRecord = null;
    this.concepts = [];
  }

  // Node coordinates for 10 Computer Networks concepts across 5 tiers
  getNodeLayout() {
    return {
      CN_01_OSI_LAYERS: { x: 500, y: 55, tier: 1, label: "1. OSI & TCP/IP Reference Model", short: "OSI Models" },
      
      CN_02_FRAMING_CRC: { x: 260, y: 160, tier: 2, label: "2. Framing & CRC Error Check", short: "Framing & CRC" },
      CN_04_SUBNETTING_IP: { x: 740, y: 160, tier: 2, label: "4. IPv4 Subnetting & CIDR", short: "IPv4 & CIDR" },
      
      CN_03_FLOW_CONTROL: { x: 180, y: 275, tier: 3, label: "3. Sliding Window Flow Control", short: "Flow Control" },
      CN_05_ROUTING_ALGO: { x: 620, y: 275, tier: 3, label: "5. Routing (Dijkstra vs Bellman-Ford)", short: "Routing Algo" },
      CN_06_TCP_UDP_TRANSPORT: { x: 860, y: 275, tier: 3, label: "6. TCP Handshake & Ports", short: "TCP / UDP" },
      
      CN_07_TCP_CONGESTION: { x: 340, y: 390, tier: 4, label: "7. TCP Congestion Control (AIMD)", short: "Congestion Ctrl" },
      CN_08_DNS_SYSTEM: { x: 720, y: 390, tier: 4, label: "8. Domain Name System (DNS)", short: "DNS Hierarchy" },
      CN_09_HTTP_APPLICATION: { x: 920, y: 390, tier: 4, label: "9. HTTP/1.1 vs HTTP/2", short: "HTTP / Web" },
      
      CN_10_NETWORK_SECURITY: { x: 820, y: 505, tier: 5, label: "10. TLS Hybrid Cryptography", short: "Network Security" }
    };
  }

  // Connections (Prerequisite edges: source -> target)
  getPrerequisiteEdges() {
    return [
      { from: "CN_01_OSI_LAYERS", to: "CN_02_FRAMING_CRC" },
      { from: "CN_01_OSI_LAYERS", to: "CN_04_SUBNETTING_IP" },
      { from: "CN_02_FRAMING_CRC", to: "CN_03_FLOW_CONTROL" },
      { from: "CN_04_SUBNETTING_IP", to: "CN_05_ROUTING_ALGO" },
      { from: "CN_04_SUBNETTING_IP", to: "CN_06_TCP_UDP_TRANSPORT" },
      { from: "CN_06_TCP_UDP_TRANSPORT", to: "CN_07_TCP_CONGESTION" },
      { from: "CN_03_FLOW_CONTROL", to: "CN_07_TCP_CONGESTION" },
      { from: "CN_06_TCP_UDP_TRANSPORT", to: "CN_08_DNS_SYSTEM" },
      { from: "CN_06_TCP_UDP_TRANSPORT", to: "CN_09_HTTP_APPLICATION" },
      { from: "CN_09_HTTP_APPLICATION", to: "CN_10_NETWORK_SECURITY" },
      { from: "CN_06_TCP_UDP_TRANSPORT", to: "CN_10_NETWORK_SECURITY" }
    ];
  }

  render(record, questionBank) {
    this.currentRecord = record;
    this.concepts = questionBank.concepts || [];
    if (!this.container) return;

    const layout = this.getNodeLayout();
    const edges = this.getPrerequisiteEdges();
    const responses = record ? record.item_responses || {} : {};

    let svgLines = "";
    edges.forEach(edge => {
      const src = layout[edge.from];
      const tgt = layout[edge.to];
      if (src && tgt) {
        // Curve path
        const midY = (src.y + tgt.y) / 2;
        const d = `M ${src.x} ${src.y + 24} C ${src.x} ${midY}, ${tgt.x} ${midY}, ${tgt.x} ${tgt.y - 24}`;
        
        // Edge styling: check if there's a cascade error along this edge
        const srcResp = responses[edge.from];
        const tgtResp = responses[edge.to];
        const isCascade = srcResp && !srcResp.is_correct && tgtResp && !tgtResp.is_correct;
        const strokeColor = isCascade ? "#EF4444" : "#4B5563";
        const strokeDash = isCascade ? "4,4" : "none";
        const strokeWidth = isCascade ? "2.5" : "1.8";

        svgLines += `<path d="${d}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" stroke-dasharray="${strokeDash}" marker-end="url(#arrow-${isCascade ? 'red' : 'gray'})" opacity="0.85" />`;
      }
    });

    let nodeCards = "";
    Object.keys(layout).forEach(cid => {
      const pos = layout[cid];
      const resp = responses[cid];
      
      let statusClass = "status-untested";
      let statusBadge = "Untested";
      let statusIcon = "○";
      let statusDesc = "Not evaluated";

      if (resp) {
        if (resp.status_type === "positive" || resp.is_correct) {
          statusClass = "status-positive";
          statusBadge = "Positive Signal";
          statusIcon = "✓";
          statusDesc = "Positive answer signal";
        } else if (resp.status_type === "prereq_risk" || (resp.status && resp.status.includes("Prerequisite"))) {
          statusClass = "status-cascade";
          statusBadge = "Prerequisite Risk";
          statusIcon = "⚠";
          statusDesc = "Cascading from upstream";
        } else if (resp.status_type === "gap" || !resp.is_correct) {
          statusClass = "status-gap";
          statusBadge = "Likely Gap";
          statusIcon = "✕";
          statusDesc = "Misconception identified";
        } else {
          statusClass = "status-insufficient";
          statusBadge = "Insufficient Data";
          statusIcon = "—";
          statusDesc = "Unanswered item";
        }
      }

      const isPrimary = record && record.primary_likely_gap === cid;
      const primaryGlow = isPrimary ? "primary-target-node" : "";

      nodeCards += `
        <div class="concept-node ${statusClass} ${primaryGlow}" 
             style="left: ${pos.x}px; top: ${pos.y}px;"
             onclick="window.conceptMapInstance.showNodeDetail('${cid}')"
             title="Click to inspect ${pos.label}">
          <div class="node-header">
            <span class="node-tier-tag">Tier ${pos.tier}</span>
            <span class="node-icon">${statusIcon}</span>
          </div>
          <div class="node-title">${pos.short}</div>
          <div class="node-badge">${statusBadge}</div>
          ${isPrimary ? '<div class="node-priority-tag">★ Remediation Target</div>' : ''}
        </div>
      `;
    });

    this.container.innerHTML = `
      <div class="concept-map-wrapper">
        <div class="map-legend-bar">
          <div class="legend-item"><span class="legend-dot dot-positive"></span> Positive Answer Signal (Single Item)</div>
          <div class="legend-item"><span class="legend-dot dot-gap"></span> Likely Concept Gap</div>
          <div class="legend-item"><span class="legend-dot dot-cascade"></span> Prerequisite Risk (Cascade)</div>
          <div class="legend-item"><span class="legend-dot dot-untested"></span> Insufficient Evidence</div>
          <div class="legend-item"><span class="legend-dot dot-primary"></span> Primary Target</div>
        </div>

        <div class="map-canvas-area" style="position: relative; width: 1000px; height: 580px; margin: 0 auto;">
          <svg class="map-svg-edges" width="1000" height="580" style="position: absolute; top: 0; left: 0; pointer-events: none;">
            <defs>
              <marker id="arrow-gray" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#6B7280" />
              </marker>
              <marker id="arrow-red" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="#EF4444" />
              </marker>
            </defs>
            ${svgLines}
          </svg>
          ${nodeCards}
        </div>
      </div>
    `;
  }

  showNodeDetail(conceptId) {
    if (!this.currentRecord) return;
    const resp = this.currentRecord.item_responses[conceptId];
    const conceptObj = this.concepts.find(c => c.id === conceptId);
    if (!conceptObj) return;

    const modal = document.getElementById("node-detail-modal");
    const titleEl = document.getElementById("node-modal-title");
    const bodyEl = document.getElementById("node-modal-body");
    const lessonBtn = document.getElementById("node-modal-lesson-btn");

    if (titleEl) titleEl.textContent = `${conceptObj.name} (${conceptObj.id})`;
    if (bodyEl) {
      const q = conceptObj.diagnostic_question;
      const statusBadge = resp 
        ? `<span class="badge ${resp.is_correct ? 'badge-success' : 'badge-danger'}">${resp.status || 'Evaluated'}</span>`
        : `<span class="badge badge-secondary">Untested</span>`;

      let detailHtml = `
        <div class="modal-evidence-section">
          <div class="evidence-row">
            <strong>Diagnostic Status:</strong> ${statusBadge}
          </div>
          <div class="evidence-row">
            <strong>Domain Category:</strong> ${conceptObj.category} (Hierarchy Tier ${conceptObj.tier})
          </div>
          <div class="evidence-row">
            <strong>Prerequisites:</strong> ${conceptObj.prerequisites.length > 0 ? conceptObj.prerequisites.join(", ") : "None (Foundational Entry Concept)"}
          </div>
        </div>

        <div class="modal-quiz-snippet">
          <h4>Diagnostic Scenario Item</h4>
          <p class="quiz-snippet-text">${q.text}</p>
          <div class="snippet-answer-row">
            <strong>Student's Choice:</strong> Option ${resp ? resp.chosen_key : 'N/A'}: ${resp ? resp.chosen_text : 'Unanswered'}
          </div>
          ${resp && resp.misconception ? `
            <div class="snippet-misconception-box">
              <strong>Observed Misconception Pattern:</strong>
              <p>${resp.misconception}</p>
            </div>
          ` : ''}
          <div class="snippet-explanation-box">
            <strong>Architectural Concept Reference:</strong>
            <p>${q.explanation}</p>
          </div>
        </div>
      `;
      bodyEl.innerHTML = detailHtml;
    }

    if (lessonBtn) {
      lessonBtn.onclick = () => {
        closeNodeDetailModal();
        if (typeof window.openTargetedLesson === "function") {
          window.openTargetedLesson(conceptId);
        }
      };
    }

    if (modal) modal.classList.add("modal-open");
  }
}

function closeNodeDetailModal() {
  const modal = document.getElementById("node-detail-modal");
  if (modal) modal.classList.remove("modal-open");
}
window.closeNodeDetailModal = closeNodeDetailModal;
