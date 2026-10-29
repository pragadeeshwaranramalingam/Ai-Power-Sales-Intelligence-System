const {
  calculateLeadIntelligence,
  evaluateSeniority,
  evaluateIndustryFit,
  evaluateDealValue,
  generateNextBestAction,
  computeUrgencyRank
} = require('../services/aiEngine');

describe('AI Sales Intelligence Engine Unit Tests', () => {
  describe('Seniority Authority Evaluation', () => {
    test('rewards C-suite / Founder titles with maximum seniority score', () => {
      const result = evaluateSeniority('Chief Technology Officer (CTO)');
      expect(result.score).toBe(15);
      expect(result.impact).toBe('positive');
      expect(result.description).toContain('C-Suite');
    });

    test('evaluates VP / Director tier appropriately', () => {
      const result = evaluateSeniority('Vice President of Sales');
      expect(result.score).toBe(12);
      expect(result.impact).toBe('positive');
    });

    test('assigns mid-level score to managers and leads', () => {
      const result = evaluateSeniority('Engineering Lead');
      expect(result.score).toBe(8);
      expect(result.impact).toBe('neutral');
    });
  });

  describe('Industry Fit Evaluation', () => {
    test('rewards high-propensity sectors with maximum score', () => {
      const resultTech = evaluateIndustryFit('Technology');
      expect(resultTech.score).toBe(15);
      expect(resultTech.impact).toBe('positive');

      const resultFin = evaluateIndustryFit('Finance');
      expect(resultFin.score).toBe(15);
    });

    test('evaluates mid-tier sectors properly', () => {
      const result = evaluateIndustryFit('Manufacturing');
      expect(result.score).toBe(11);
    });
  });

  describe('Deal Value Evaluation', () => {
    test('evaluates enterprise tier (>= $50k) with max 20 pts', () => {
      const result = evaluateDealValue(75000);
      expect(result.score).toBe(20);
      expect(result.impact).toBe('positive');
    });

    test('evaluates sub-$2000 deals with low score and negative impact', () => {
      const result = evaluateDealValue(1000);
      expect(result.score).toBe(3);
      expect(result.impact).toBe('negative');
    });
  });

  describe('End-to-End Intelligence Computation', () => {
    test('computes deterministic AI score, category, and factors for a high-value executive lead', () => {
      const highProfileLead = {
        name: 'Alexander Hamilton',
        email: 'alexander@treasury.gov',
        phone: '+1 555-010-9999',
        company: 'Hamilton Financial',
        jobTitle: 'Chief Executive Officer',
        industry: 'Finance',
        source: 'Referral',
        dealValue: 80000,
        status: 'Proposal',
        notes: 'High enterprise priority deal seeking compliance automation.'
      };

      const result = calculateLeadIntelligence(highProfileLead, []);

      expect(result.aiScore).toBeGreaterThanOrEqual(75);
      expect(result.aiCategory).toBe('Hot');
      expect(result.aiFactors).toHaveLength(6);
      expect(result.conversionLikelihood).toBeGreaterThan(60);
      expect(result.conversionSignals.positives.length).toBeGreaterThan(0);
      expect(result.nextBestAction).toBeDefined();
      expect(result.nextBestAction.action).toBeDefined();
    });

    test('correctly categorizes low-engagement generic leads as Cold or Warm', () => {
      const lowProfileLead = {
        name: 'John Doe',
        email: 'johndoe@test.com',
        phone: '',
        company: 'Unknown Co',
        jobTitle: 'Assistant',
        industry: 'Other',
        source: 'Cold Outreach',
        dealValue: 500,
        status: 'New',
        notes: ''
      };

      const result = calculateLeadIntelligence(lowProfileLead, []);
      expect(result.aiScore).toBeLessThan(50);
      expect(['Cold', 'Warm']).toContain(result.aiCategory);
      expect(result.conversionSignals.negatives.length).toBeGreaterThan(0);
    });
  });

  describe('Next-Best-Action Anti-Repeat Logic', () => {
    test('recommends demo when hot lead has already been called', () => {
      const lead = {
        status: 'Contacted',
        jobTitle: 'CTO',
        dealValue: 60000,
        lastContactedAt: new Date()
      };
      const recentActivities = [{ type: 'call', title: 'Initial phone call' }];

      const action = generateNextBestAction(lead, 85, 'Hot', recentActivities);
      expect(action.action).toContain('Demo');
    });

    test('recommends contract finalization for Negotiation stage', () => {
      const lead = {
        status: 'Negotiation',
        dealValue: 50000
      };

      const action = generateNextBestAction(lead, 70, 'Warm', []);
      expect(action.action).toContain('Finalize Contract Terms');
      expect(action.priority).toBe('Urgent');
    });
  });

  describe('Urgency Ranking', () => {
    test('penalizes overdue follow-ups and prioritizes large deals', () => {
      const overdueLead = {
        aiScore: 80,
        dealValue: 50000,
        lastContactedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        nextFollowUpAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Overdue
      };

      const standardLead = {
        aiScore: 50,
        dealValue: 10000,
        lastContactedAt: new Date(),
        nextFollowUpAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
      };

      const rankOverdue = computeUrgencyRank(overdueLead);
      const rankStandard = computeUrgencyRank(standardLead);

      expect(rankOverdue).toBeGreaterThan(rankStandard);
    });
  });
});
