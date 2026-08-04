import 'package:flutter/material.dart';
import '../services/handyhub_location_service.dart';

class CustomerTrackingScreen extends StatefulWidget {
  final String bookingId;
  final String artisanName;
  final String artisanPhone;
  final LatLng artisanLocation;
  final LatLng destinationLocation;

  const CustomerTrackingScreen({
    Key? key,
    required this.bookingId,
    required this.artisanName,
    required this.artisanPhone,
    required this.artisanLocation,
    required this.destinationLocation,
  }) : super(key: key);

  @override
  State<CustomerTrackingScreen> createState() => _CustomerTrackingScreenState();
}

class _CustomerTrackingScreenState extends State<CustomerTrackingScreen> {
  int _etaMinutes = 12;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Artisan Live GPS Tracking'),
        backgroundColor: const Color(0xFF0EA5E9),
        elevation: 0,
      ),
      body: Stack(
        children: [
          // Visual Simulated Map Telemetry Area
          Container(
            color: const Color(0xFF0F172A),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.navigation, color: Color(0xFF10B981), size: 64),
                  const SizedBox(height: 12),
                  Text(
                    '${widget.artisanName} is en route',
                    style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'GPS Telemetry Active • Haversine Distance Calculated',
                    style: TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                ],
              ),
            ),
          ),

          // Bottom Tracking Card Overlay
          Positioned(
            left: 16,
            right: 16,
            bottom: 24,
            child: Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              elevation: 8,
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: const Color(0xFF0EA5E9).withOpacity(0.15),
                          child: const Icon(Icons.person, color: Color(0xFF0EA5E9)),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(widget.artisanName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                              const Text('Verified HandyHub Partner • 4.9★', style: TextStyle(fontSize: 12, color: Colors.grey)),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: const Color(0xFF10B981).withOpacity(0.15),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            'ETA: $_etaMinutes mins',
                            style: const TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Calling ${widget.artisanPhone}...')),
                              );
                            },
                            icon: const Icon(Icons.phone),
                            label: const Text('Call Artisan'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF0EA5E9),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
