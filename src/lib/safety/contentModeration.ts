export interface ContentModerationResult {
  cleanText: string;
  isToxic: boolean;
  hasGroomingCues: boolean;
  hasContactExchange: boolean;
  riskScore: number; // 0 to 100
  flaggedCues: string[];
  suggestedAction: 'ALLOW' | 'FLAG_FOR_REVIEW' | 'BLOCK_MESSAGE' | 'CRITICAL_ALERT';
}

export class ContentModerationService {
  // Comprehensive blocked profanity, slurs & harassment (English & Hinglish)
  private profanityList: string[] = [
    // Standard English
    'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy', 'nigger', 'faggot',
    'whore', 'slut', 'blowjob', 'cock', 'porn', 'porno', 'xxx', 'hentai', 'nude', 'nudes',
    // Hinglish & Indian slurs
    'chutiya', 'madarchod', 'bhenchod', 'bhosdike', 'harami', 'gandu', 'laude', 'lodu',
    'randi', 'gaand', 'chinal', 'saala', 'kamina', 'bhadwe', 'chut', 'lund', 'tatte',
  ];

  // Grooming & predatory behavior patterns
  private predatoryPatterns: { pattern: RegExp; cue: string; weight: number }[] = [
    { pattern: /(send|give\s+me)\s+(nude|pic|photo|selfie|snap)/i, cue: 'soliciting_private_media', weight: 40 },
    { pattern: /(are\s+you\s+alone|is\s+anyone\s+home|where\s+are\s+your\s+parents)/i, cue: 'probing_isolation', weight: 45 },
    { pattern: /(keep\s+this\s+a\s+secret|don't\s+tell\s+anyone|our\s+little\s+secret)/i, cue: 'secrecy_coercion', weight: 50 },
    { pattern: /(add\s+me\s+on\s+snap|snapchat|telegram|whatsapp|insta|instagram\s+handle)/i, cue: 'external_offplatform_lure', weight: 25 },
    { pattern: /(how\s+old\s+are\s+you|what's\s+your\s+age|which\s+grade|which\s+school)/i, cue: 'probing_age_school', weight: 20 },
    { pattern: /(where\s+do\s+you\s+live|your\s+address|send\s+location)/i, cue: 'probing_physical_location', weight: 35 },
    { pattern: /(i\s+can\s+buy\s+you|send\s+you\s+money|gift\s+card|crypto)/i, cue: 'grooming_financial_lure', weight: 40 },
  ];

  // Contact info patterns (PII leakage / off-platform migration)
  private contactPatterns: { pattern: RegExp; type: string }[] = [
    // Phone numbers (10 to 12 digits, with or without spaces/dashes)
    { pattern: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, type: 'phone_number' },
    // 10 digits continuous
    { pattern: /\b\d{10,12}\b/g, type: 'raw_phone' },
    // Email addresses
    { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g, type: 'email' },
    // External suspicious links
    { pattern: /https?:\/\/(?!phryvos\.in)[^\s]+/gi, type: 'external_url' },
  ];

  /**
   * Analyze message text for profanity, predatory cues, and PII
   */
  public analyzeText(text: string, isMinorParticipant: boolean = false): ContentModerationResult {
    let cleanText = text;
    let isToxic = false;
    let hasGroomingCues = false;
    let hasContactExchange = false;
    let riskScore = 0;
    const flaggedCues: string[] = [];

    // 1. Check Profanity & Slurs
    for (const badWord of this.profanityList) {
      // Catch direct or spaced occurrences (e.g. f u c k)
      const regex = new RegExp(`\\b${badWord.split('').join('\\s*')}\\b`, 'gi');
      if (regex.test(cleanText)) {
        isToxic = true;
        riskScore += 20;
        flaggedCues.push(`profanity:${badWord}`);
        cleanText = cleanText.replace(regex, '•••••');
      }
    }

    // 2. Check Predatory / Grooming Cues
    for (const item of this.predatoryPatterns) {
      if (item.pattern.test(text)) {
        hasGroomingCues = true;
        // Minor context amplifies predatory cue severity
        const multiplier = isMinorParticipant ? 1.5 : 1.0;
        riskScore += Math.round(item.weight * multiplier);
        flaggedCues.push(item.cue);
      }
    }

    // 3. Check Contact Info & PII
    for (const item of this.contactPatterns) {
      if (item.pattern.test(cleanText)) {
        hasContactExchange = true;
        riskScore += 15;
        flaggedCues.push(`pii:${item.type}`);
        cleanText = cleanText.replace(item.pattern, '••••••••••');
      }
    }

    // 4. Cap riskScore at 100
    riskScore = Math.min(100, riskScore);

    // 5. Determine Suggested Action
    let suggestedAction: ContentModerationResult['suggestedAction'] = 'ALLOW';
    if (riskScore >= 80 || (isMinorParticipant && hasGroomingCues && riskScore >= 50)) {
      suggestedAction = 'CRITICAL_ALERT';
    } else if (riskScore >= 50) {
      suggestedAction = 'BLOCK_MESSAGE';
    } else if (riskScore >= 25 || isToxic || hasContactExchange) {
      suggestedAction = 'FLAG_FOR_REVIEW';
    }

    return {
      cleanText,
      isToxic,
      hasGroomingCues,
      hasContactExchange,
      riskScore,
      flaggedCues,
      suggestedAction,
    };
  }

  /**
   * Media moderation heuristics
   */
  public inspectMediaPayload(mediaUrlOrData: string, isRecipientMinor: boolean): {
    allowed: boolean;
    needsBlur: boolean;
    reason?: string;
  } {
    // If recipient is a minor, always blur image until explicitly clicked with warning
    if (isRecipientMinor) {
      return {
        allowed: true,
        needsBlur: true,
        reason: 'Protected minor orbit: incoming media blurred by safety default.',
      };
    }

    return {
      allowed: true,
      needsBlur: false,
    };
  }
}

export const contentModerationService = new ContentModerationService();
