/**
 * Bayesian Knowledge Tracing (BKT) Engine for GapPath AI
 * 
 * Implements the standard Corbett & Anderson BKT model:
 * 1. Posterior Bayesian update: P(L_t | obs)
 * 2. Learning transition: P(L_{t+1}) = P(L_t | obs) + (1 - P(L_t | obs)) * P(T)
 * 
 * Note: Estimates represent probabilistic model predictions, separate from raw quiz accuracy.
 */

const BKTEngine = (function () {
  // Default configuration per topic (can be overridden from data/bkt_parameters.json)
  const defaultParams = {
    p_init: 0.25,      // P(L_0): Initial mastery probability
    p_transit: 0.12,   // P(T): Learning transition probability
    p_guess: 0.20,     // P(G): Guess probability
    p_slip: 0.08,      // P(S): Slip probability
    mastery_threshold: 0.80 // Threshold for declaring concept mastered
  };

  let loadedTopicParams = {};
  let metadata = {
    model: "Bayesian Knowledge Tracing (Standard)",
    tuning_status: "Experimental (Synthetic Benchmark)",
    notice: "Probabilistic mastery estimate based on response history. Separate from raw quiz score."
  };

  // Attempt to load pre-tuned parameters from data/bkt_parameters.json
  async function init() {
    try {
      const resp = await fetch('data/bkt_parameters.json');
      if (resp.ok) {
        const data = await resp.json();
        if (data.metadata) metadata = data.metadata;
        if (data.subjects) {
          for (const sId in data.subjects) {
            const subj = data.subjects[sId];
            if (subj.topics) {
              for (const tId in subj.topics) {
                loadedTopicParams[tId] = subj.topics[tId];
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('BKT: Using default baseline parameters:', e);
    }
  }

  // Auto-init on script load
  if (typeof window !== 'undefined') {
    init();
  }

  /**
   * Retrieve configurable parameters for a given topic
   */
  function getTopicParams(topicId) {
    if (loadedTopicParams[topicId]) {
      return { ...defaultParams, ...loadedTopicParams[topicId] };
    }
    return { ...defaultParams };
  }

  /**
   * Allow teacher/system to configure parameters per topic
   */
  function setTopicParams(topicId, customParams) {
    loadedTopicParams[topicId] = {
      ...(loadedTopicParams[topicId] || defaultParams),
      ...customParams
    };
  }

  /**
   * Core BKT Bayesian Update for a single observation
   * @param {number} pKnown Current prior P(L_t)
   * @param {boolean} isCorrect Whether response was correct
   * @param {object} params Parameter overrides (p_transit, p_guess, p_slip)
   */
  function step(pKnown, isCorrect, params = {}) {
    const pSlip = params.p_slip ?? defaultParams.p_slip;
    const pGuess = params.p_guess ?? defaultParams.p_guess;
    const pTransit = params.p_transit ?? defaultParams.p_transit;

    let pPost;
    if (isCorrect) {
      // P(L_t | correct) = P(L_t) * (1 - P(S)) / [ P(L_t)*(1 - P(S)) + (1 - P(L_t))*P(G) ]
      const num = pKnown * (1.0 - pSlip);
      const denom = num + (1.0 - pKnown) * pGuess;
      pPost = denom > 0 ? num / denom : pKnown;
    } else {
      // P(L_t | incorrect) = P(L_t) * P(S) / [ P(L_t)*P(S) + (1 - P(L_t))*(1 - P(G)) ]
      const num = pKnown * pSlip;
      const denom = num + (1.0 - pKnown) * (1.0 - pGuess);
      pPost = denom > 0 ? num / denom : pKnown;
    }

    // Guard numerical boundaries [0.001, 0.999]
    pPost = Math.max(0.001, Math.min(0.999, pPost));

    // Learning transition: P(L_{t+1}) = P(L_t | obs) + (1 - P(L_t | obs)) * P(T)
    const pNext = pPost + (1.0 - pPost) * pTransit;
    const boundedNext = Math.max(0.001, Math.min(0.999, pNext));

    return {
      posterior: pPost,
      next: boundedNext
    };
  }

  /**
   * Process a sequence of responses for a specific topic
   * @param {Array<boolean>} responses Ordered list of booleans (true for correct, false for incorrect)
   * @param {string} topicId Topic identifier
   */
  function traceTopic(responses, topicId) {
    const params = getTopicParams(topicId);
    let currentMastery = params.p_init ?? defaultParams.p_init;
    const trajectory = [currentMastery];

    let correctCount = 0;
    for (const isCorrect of responses) {
      if (isCorrect) correctCount++;
      const res = step(currentMastery, isCorrect, params);
      currentMastery = res.next;
      trajectory.push(Math.round(currentMastery * 1000) / 1000);
    }

    const threshold = params.mastery_threshold ?? defaultParams.mastery_threshold;
    const isMastered = currentMastery >= threshold;

    let masteryStatus = "Developing (Model Estimate)";
    if (isMastered) {
      masteryStatus = "Mastered (Model Estimate)";
    } else if (currentMastery < 0.40) {
      masteryStatus = "Remedial Attention (Model Estimate)";
    }

    return {
      topicId,
      params,
      initialMastery: params.p_init,
      estimatedMastery: Math.round(currentMastery * 1000) / 1000,
      estimatedMasteryPct: Math.round(currentMastery * 100),
      masteryThresholdPct: Math.round(threshold * 100),
      isMastered,
      masteryStatus,
      attemptsCount: responses.length,
      correctCount,
      trajectory,
      disclaimer: "BKT topic-mastery is an algorithmic probability estimate, separate from raw quiz accuracy."
    };
  }

  return {
    init,
    getTopicParams,
    setTopicParams,
    step,
    traceTopic,
    getMetadata: () => metadata
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BKTEngine;
}
