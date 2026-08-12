import 'package:flutter/material.dart';

enum TrustBadgeType {
  addressVerified,
  identityVerified,
  artisanVerified,
  highRiskGated,
  pending,
}

class TrustBadgeWidget extends StatelessWidget {
  final TrustBadgeType type;
  final String? customLabel;
  final bool compact;

  const TrustBadgeWidget({
    Key? key,
    required this.type,
    this.customLabel,
    this.compact = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color border;
    Color textColor;
    IconData icon;
    String label;

    switch (type) {
      case TrustBadgeType.addressVerified:
        bg = const Color(0x1F10B981);
        border = const Color(0x4D10B981);
        textColor = const Color(0xFF10B981);
        icon = Icons.verified_user_rounded;
        label = customLabel ?? 'Verified Address';
        break;
      case TrustBadgeType.identityVerified:
        bg = const Color(0x1F0EA5E9);
        border = const Color(0x4D0EA5E9);
        textColor = const Color(0xFF0EA5E9);
        icon = Icons.badge_rounded;
        label = customLabel ?? 'Identity Verified';
        break;
      case TrustBadgeType.artisanVerified:
        bg = const Color(0x1FF59E0B);
        border = const Color(0x4DF59E0B);
        textColor = const Color(0xFFF59E0B);
        icon = Icons.stars_rounded;
        label = customLabel ?? 'Verified Artisan';
        break;
      case TrustBadgeType.highRiskGated:
        bg = const Color(0x1FEF4444);
        border = const Color(0x4DEF4444);
        textColor = const Color(0xFFEF4444);
        icon = Icons.lock_rounded;
        label = customLabel ?? 'High-Risk • Verification Required';
        break;
      case TrustBadgeType.pending:
        bg = const Color(0x1FF59E0B);
        border = const Color(0x4DF59E0B);
        textColor = const Color(0xFFF59E0B);
        icon = Icons.access_time_rounded;
        label = customLabel ?? 'Verification Pending ⏳';
        break;
    }

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 8.0 : 12.0,
        vertical: compact ? 4.0 : 6.0,
      ),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20.0),
        border: Border.all(color: border, width: 1.0),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: compact ? 12.0 : 16.0, color: textColor),
          const SizedBox(width: 6.0),
          Text(
            label,
            style: TextStyle(
              color: textColor,
              fontSize: compact ? 11.0 : 12.0,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
