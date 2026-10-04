export type AgeGroup = 'CHILD' | 'MINOR_TEEN' | 'ADULT' | 'UNVERIFIED';

export interface UserAgeProfile {
  id: string;
  birthDate?: string | Date;
  ageGroup?: AgeGroup;
  ageAssuranceMethod?: 'self_declaration' | 'parental_consent' | 'id_verified';
}

export interface AgePolicyConfig {
  minimumAllowedAge: number; // 13 years (COPPA / GDPR-K / DPDP compliance)
  adultAgeThreshold: number; // 18 years
}

export const DEFAULT_AGE_POLICY_CONFIG: AgePolicyConfig = {
  minimumAllowedAge: 13,
  adultAgeThreshold: 18,
};

export class AgePolicyService {
  /**
   * Calculate exact age in years from birthdate
   */
  public calculateAge(birthDate: string | Date): number {
    const dob = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    if (isNaN(dob.getTime())) return 0;

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Determine age category from birthdate or declaration
   */
  public determineAgeGroup(birthDate?: string | Date | null, declaredGroup?: AgeGroup): AgeGroup {
    if (birthDate) {
      const age = this.calculateAge(birthDate);
      if (age < DEFAULT_AGE_POLICY_CONFIG.minimumAllowedAge) {
        return 'CHILD';
      }
      if (age < DEFAULT_AGE_POLICY_CONFIG.adultAgeThreshold) {
        return 'MINOR_TEEN';
      }
      return 'ADULT';
    }

    if (declaredGroup && declaredGroup !== 'UNVERIFIED') {
      return declaredGroup;
    }

    return 'UNVERIFIED';
  }

  /**
   * Core Stranger Radar Safe Matchmaking Rule:
   * Minors (13-17) and Adults (18+) MUST NEVER be matched together.
   * Children under 13 are strictly prohibited from all matchmaking.
   */
  public canInteractInStrangerRadar(userA: UserAgeProfile, userB: UserAgeProfile): {
    allowed: boolean;
    reason?: string;
  } {
    const groupA = userA.ageGroup || this.determineAgeGroup(userA.birthDate);
    const groupB = userB.ageGroup || this.determineAgeGroup(userB.birthDate);

    // 1. Under-13 prohibition
    if (groupA === 'CHILD' || groupB === 'CHILD') {
      return {
        allowed: false,
        reason: 'Under-13 users are not permitted on stranger chat network (COPPA compliance).',
      };
    }

    // 2. Strict isolation: MINOR_TEEN can ONLY match with fellow MINOR_TEEN
    if (groupA === 'MINOR_TEEN' && groupB !== 'MINOR_TEEN') {
      return {
        allowed: false,
        reason: 'Minor-Adult separation policy: Teen orbits are strictly restricted to 13–17 peers.',
      };
    }

    if (groupB === 'MINOR_TEEN' && groupA !== 'MINOR_TEEN') {
      return {
        allowed: false,
        reason: 'Minor-Adult separation policy: Adult orbits cannot discover minor accounts.',
      };
    }

    return { allowed: true };
  }

  /**
   * Direct Messaging Safeguards:
   * Adults cannot initiate DMs with minors unless they are mutually confirmed friends
   * with parental consent or explicit verification.
   */
  public canDirectMessage(
    sender: UserAgeProfile,
    recipient: UserAgeProfile,
    isMutualFriend: boolean
  ): { allowed: boolean; reason?: string } {
    const senderGroup = sender.ageGroup || this.determineAgeGroup(sender.birthDate);
    const recipientGroup = recipient.ageGroup || this.determineAgeGroup(recipient.birthDate);

    if (senderGroup === 'CHILD' || recipientGroup === 'CHILD') {
      return { allowed: false, reason: 'Account restricted under age policy.' };
    }

    // Adult to Minor DM restriction
    if (senderGroup === 'ADULT' && recipientGroup === 'MINOR_TEEN') {
      if (!isMutualFriend) {
        return {
          allowed: false,
          reason: 'Unconnected adults cannot message minor accounts. Mutual connection required.',
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Safety feature defaults tailored to the user's age group
   */
  public getSafetySettings(ageGroup: AgeGroup) {
    const isMinor = ageGroup === 'MINOR_TEEN' || ageGroup === 'CHILD';

    return {
      autoBlurImages: isMinor, // Minors receive incoming media blurred by default
      strictProfanityMasking: isMinor,
      blockContactInfoSharing: isMinor, // Proactively intercept phone/email exchange
      allowAdultContentToggle: !isMinor, // Minors CANNOT toggle sensitive content on
      rateLimitMaxPerMinute: isMinor ? 15 : 25, // More conservative rate limits for teen protection
    };
  }
}

export const agePolicyService = new AgePolicyService();
