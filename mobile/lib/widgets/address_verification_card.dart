import 'package:flutter/material.dart';
import '../services/address_verification_service.dart';
import 'trust_badge_widget.dart';

class AddressVerificationCard extends StatelessWidget {
  final PermanentAddressState? state;
  final VoidCallback onSubmitPressed;
  final VoidCallback onChangePressed;

  const AddressVerificationCard({
    Key? key,
    required this.state,
    required this.onSubmitPressed,
    required this.onChangePressed,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    PermanentAddressStatus status = state?.status ?? PermanentAddressStatus.notSubmitted;

    return Card(
      elevation: 4.0,
      color: const Color(0xFF1E293B),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16.0),
        side: const BorderSide(color: Color(0xFF334155)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: const [
                    Icon(Icons.location_on, color: Color(0xFF0EA5E9)),
                    SizedBox(width: 8.0),
                    Text(
                      'Address Verification',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18.0,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                if (status == PermanentAddressStatus.verified)
                  const TrustBadgeWidget(type: TrustBadgeType.addressVerified, compact: true)
                else if (status == PermanentAddressStatus.pending)
                  const TrustBadgeWidget(type: TrustBadgeType.pending, compact: true),
              ],
            ),
            const SizedBox(height: 16.0),

            // Stepper indicator
            _buildStepper(status),

            const SizedBox(height: 20.0),

            // Status Body
            if (status == PermanentAddressStatus.verified) ...[
              Container(
                padding: const EdgeInsets.all(16.0),
                decoration: BoxDecoration(
                  color: const Color(0x0F10B981),
                  borderRadius: BorderRadius.circular(12.0),
                  border: Border.all(color: const Color(0x3D10B981)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'VERIFIED PERMANENT ADDRESS',
                      style: TextStyle(color: Color(0xFF10B981), fontSize: 10.0, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4.0),
                    Text(
                      state?.permanentAddress ?? 'Address On File',
                      style: const TextStyle(color: Colors.white, fontSize: 15.0, fontWeight: FontWeight.w600),
                    ),
                    if (state?.notes != null) ...[
                      const SizedBox(height: 4.0),
                      Text(state!.notes!, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12.0)),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 12.0),
              OutlinedButton.icon(
                onPressed: onChangePressed,
                icon: const Icon(Icons.edit_location_alt, size: 16.0, color: Color(0xFF0EA5E9)),
                label: const Text('Request Address Change', style: TextStyle(color: Color(0xFF0EA5E9))),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFF0EA5E9)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.0)),
                ),
              ),
            ] else if (status == PermanentAddressStatus.pending) ...[
              Container(
                padding: const EdgeInsets.all(16.0),
                decoration: BoxDecoration(
                  color: const Color(0x1FF59E0B),
                  borderRadius: BorderRadius.circular(12.0),
                  border: Border.all(color: const Color(0xFFF59E0B)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: const [
                        Icon(Icons.hourglass_top, color: Color(0xFFF59E0B), size: 18.0),
                        SizedBox(width: 8.0),
                        Text('Compliance Audit Pending ⏳', style: TextStyle(color: Color(0xFFF59E0B), fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 8.0),
                    Text(
                      'Submitted Address: ${state?.permanentAddress ?? ""}',
                      style: const TextStyle(color: Colors.white, fontSize: 13.0),
                    ),
                    const SizedBox(height: 4.0),
                    const Text(
                      'What happens next? You can book low-risk services immediately! High-risk services unlock automatically once audit completes (< 24 hrs).',
                      style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 12.0),
                    ),
                  ],
                ),
              ),
            ] else ...[
              ElevatedButton.icon(
                onPressed: onSubmitPressed,
                icon: const Icon(Icons.upload_file),
                label: const Text('Submit Permanent Address & Proof'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0EA5E9),
                  minimumSize: const Size(double.infinity, 44),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10.0)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStepper(PermanentAddressStatus status) {
    int activeStep = 1;
    if (status == PermanentAddressStatus.pending) activeStep = 2;
    if (status == PermanentAddressStatus.verified) activeStep = 3;

    return Row(
      children: [
        _buildStepCircle(1, 'Proof', activeStep >= 1),
        _buildLine(activeStep >= 2),
        _buildStepCircle(2, 'Audit', activeStep >= 2),
        _buildLine(activeStep >= 3),
        _buildStepCircle(3, 'Verified', activeStep >= 3),
      ],
    );
  }

  Widget _buildStepCircle(int step, String label, bool isActive) {
    return Column(
      children: [
        CircleAvatar(
          radius: 14.0,
          backgroundColor: isActive ? const Color(0xFF0EA5E9) : const Color(0xFF334155),
          child: Text(
            '$step',
            style: const TextStyle(color: Colors.white, fontSize: 12.0, fontWeight: FontWeight.bold),
          ),
        ),
        const SizedBox(height: 4.0),
        Text(label, style: TextStyle(color: isActive ? Colors.white : const Color(0xFF64748B), fontSize: 10.0)),
      ],
    );
  }

  Widget _buildLine(bool isActive) {
    return Expanded(
      child: Container(
        height: 2.0,
        color: isActive ? const Color(0xFF0EA5E9) : const Color(0xFF334155),
      ),
    );
  }
}
