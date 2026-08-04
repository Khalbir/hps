import 'dart:async';
import 'package:flutter/material.dart';
import '../services/handyhub_location_service.dart';

class ArtisanOfferDialog extends StatefulWidget {
  final DispatchOffer offer;
  final VoidCallback onAccept;
  final VoidCallback onDecline;

  const ArtisanOfferDialog({
    Key? key,
    required this.offer,
    required this.onAccept,
    required this.onDecline,
  }) : super(key: key);

  @override
  State<ArtisanOfferDialog> createState() => _ArtisanOfferDialogState();
}

class _ArtisanOfferDialogState extends State<ArtisanOfferDialog> {
  late Timer _countdownTimer;
  int _secondsRemaining = 120; // 2 minutes window

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    final now = DateTime.now();
    final difference = widget.offer.expiresAt.difference(now).inSeconds;
    _secondsRemaining = difference > 0 ? difference : 120;

    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsRemaining <= 1) {
        timer.cancel();
        widget.onDecline(); // Auto-decline / timeout cascade to next pro
      } else {
        setState(() => _secondsRemaining--);
      }
    });
  }

  @override
  void dispose() {
    _countdownTimer.cancel();
    super.dispose();
  }

  String get _formattedTime {
    final minutes = (_secondsRemaining ~/ 60).toString().padLeft(2, '0');
    final seconds = (_secondsRemaining % 60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    final progress = _secondsRemaining / 120.0;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.flash_on, color: Color(0xFFF97316), size: 48),
            const SizedBox(height: 12),
            const Text(
              'New High-Match Booking Offer!',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 6),
            Text(
              'Match Score: ${widget.offer.score.toStringAsFixed(0)}% • Distance: ${widget.offer.distanceKm} km away',
              style: const TextStyle(fontSize: 13, color: Colors.grey),
            ),
            const SizedBox(height: 20),

            // 2-Minute Response Timer Bar
            Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 90,
                  height: 90,
                  child: CircularProgressIndicator(
                    value: progress,
                    strokeWidth: 8,
                    backgroundColor: Colors.grey.shade200,
                    color: _secondsRemaining < 30 ? Colors.red : const Color(0xFF0EA5E9),
                  ),
                ),
                Text(
                  _formattedTime,
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 24),

            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: widget.onDecline,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red,
                      side: const BorderSide(color: Colors.red),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Decline'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: widget.onAccept,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Accept Job', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
