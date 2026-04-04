import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Clipboard,
  useWindowDimensions,
} from 'react-native';

interface Props {
  pendingCount: number;
  onReviewQueue: () => void;
  inviteLink?: string;
}

export default function VerificationAlertCard({
  pendingCount,
  onReviewQueue,
  inviteLink = 'hospilink.com/invite/staff-x23k',
}: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied]       = useState(false);
  const { width }                 = useWindowDimensions();
  const isTablet                  = width >= 700;

  const handleCopy = () => {
    Clipboard.setString(`https://${inviteLink}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.wrapper}>

      {/* ── Combined Row: Alert Card + Onboarding Side-by-side ── */}
      {!dismissed ? (
        <View style={[styles.rowContainer, isTablet && styles.rowContainerTablet]}>

          {/* LEFT — Verification Alert */}
          <View style={[styles.alertCard, isTablet && styles.alertCardTablet]}>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW APPLICATION</Text>
            </View>

            {/* Text + Shield watermark row */}
            <View style={styles.alertBody}>
              <View style={styles.alertLeft}>
                <Text style={styles.alertTitle}>
                  Verification Required: {pendingCount} Medical Specialists awaiting credential audit.
                </Text>
                <Text style={styles.alertDesc}>
                  Ensure all medical licenses and board certifications are cross-referenced with the national registry before approval.
                </Text>
                <View style={styles.alertActions}>
                  <TouchableOpacity style={styles.reviewBtn} onPress={onReviewQueue} activeOpacity={0.85}>
                    <Text style={styles.reviewBtnText}>Review Queue</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dismissBtn} onPress={() => setDismissed(true)} activeOpacity={0.75}>
                    <Text style={styles.dismissBtnText}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Shield watermark — always visible, sits right */}
              <View style={styles.shieldWrap}>
                <Text style={styles.shieldEmoji}>🛡️</Text>
              </View>
            </View>
          </View>

          {/* RIGHT — Onboarding Card */}
          <View style={[styles.onboardingCard, isTablet && styles.onboardingCardTablet]}>
            <Text style={styles.onboardingTitle}>Staff On-Boarding</Text>
            <Text style={styles.onboardingSubtitle}>
              Generate a quick invite link for new clinical personnel to self-register their credentials.
            </Text>
            <View style={styles.inviteBox}>
              <Text style={styles.inviteLabel}>INVITE LINK</Text>
              <Text style={styles.inviteLinkText} numberOfLines={1}>{inviteLink}</Text>
            </View>
            <TouchableOpacity
              style={[styles.copyBtn, copied && styles.copyBtnSuccess]}
              onPress={handleCopy}
              activeOpacity={0.85}
            >
              <Text style={styles.copyBtnText}>
                {copied ? '✓  Copied!' : '📋  Copy Link'}
              </Text>
            </TouchableOpacity>
          </View>

        </View>
      ) : (
        <TouchableOpacity style={styles.restoreBanner} onPress={() => setDismissed(false)} activeOpacity={0.8}>
          <Text style={styles.restoreText}>
            ⚠ {pendingCount} specialists pending —{' '}
            <Text style={styles.restoreLink}>Tap to restore</Text>
          </Text>
        </TouchableOpacity>
      )}

     

    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 12, paddingBottom: 8 },

  /* ── Row container: stacked on mobile, side-by-side on tablet ── */
  rowContainer: {
    flexDirection: 'column',
    gap: 14,
  },
  rowContainerTablet: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 14,
  },

  /* ── Alert Card ── */
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  alertCardTablet: { flex: 2 },

  newBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 12,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },

  alertBody: {
  flexDirection: 'row',
  alignItems: 'center',
},
  alertLeft: { flex: 1 },

  alertTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    lineHeight: 22,
    marginBottom: 8,
  },
  alertDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 18,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  reviewBtn: {
    backgroundColor: '#1D4ED8',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  reviewBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  dismissBtn: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  dismissBtnText: { color: '#374151', fontWeight: '600', fontSize: 13 },

  /* Shield watermark — large, faded, bottom-right */
 shieldWrap: {
  position: 'absolute',
  right: 20,
  top: '35%',
  opacity: 0.08,
},
  shieldEmoji: { fontSize: 72, lineHeight: 80 },

  /* Restore banner */
  restoreBanner: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 12,
  },
  restoreText: { fontSize: 13, color: '#92400E' },
  restoreLink: { color: '#1D4ED8', fontWeight: '700' },

  /* ── Onboarding Card ── */
  onboardingCard: {
    backgroundColor: '#1D4ED8',
    borderRadius: 16,
    padding: 18,
  },
  onboardingCardTablet: { flex: 1 },

  onboardingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  onboardingSubtitle: {
    fontSize: 13,
    color: '#BFDBFE',
    lineHeight: 18,
    marginBottom: 16,
  },
  inviteBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  inviteLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#93C5FD',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  inviteLinkText: { fontSize: 13, color: '#FFFFFF', fontWeight: '500' },
  copyBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  copyBtnSuccess: { backgroundColor: '#D1FAE5' },
  copyBtnText: { fontSize: 14, fontWeight: '700', color: '#1D4ED8' },

  
});
