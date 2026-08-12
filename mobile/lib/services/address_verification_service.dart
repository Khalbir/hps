import 'dart:convert';
import 'package:http/http.dart' as http;

enum PermanentAddressStatus {
  notSubmitted,
  pending,
  verified,
  rejected,
  suspended
}

enum ServiceRiskLevel { low, medium, high }

class PermanentAddressState {
  final String? permanentAddress;
  final String? permanentAddressProof;
  final PermanentAddressStatus status;
  final String? notes;
  final String? pendingAddress;
  final String? pendingProofUrl;
  final List<dynamic> bookingAddresses;
  final bool isVerified;

  PermanentAddressState({
    this.permanentAddress,
    this.permanentAddressProof,
    required this.status,
    this.notes,
    this.pendingAddress,
    this.pendingProofUrl,
    required this.bookingAddresses,
    required this.isVerified,
  });

  factory PermanentAddressState.fromJson(Map<String, dynamic> json) {
    PermanentAddressStatus statusEnum = PermanentAddressStatus.notSubmitted;
    String rawStatus = json['permanentAddressStatus'] ?? 'NOT_SUBMITTED';
    switch (rawStatus) {
      case 'PENDING':
        statusEnum = PermanentAddressStatus.pending;
        break;
      case 'VERIFIED':
        statusEnum = PermanentAddressStatus.verified;
        break;
      case 'REJECTED':
        statusEnum = PermanentAddressStatus.rejected;
        break;
      case 'SUSPENDED':
        statusEnum = PermanentAddressStatus.suspended;
        break;
    }

    return PermanentAddressState(
      permanentAddress: json['permanentAddress'],
      permanentAddressProof: json['permanentAddressProof'],
      status: statusEnum,
      notes: json['permanentAddressNotes'],
      pendingAddress: json['pendingPermanentAddress'],
      pendingProofUrl: json['pendingPermanentAddressProof'],
      bookingAddresses: json['bookingAddresses'] ?? [],
      isVerified: json['isVerified'] ?? false,
    );
  }
}

class AddressVerificationService {
  final String baseUrl;

  AddressVerificationService({required this.baseUrl});

  /// Fetches the user's permanent address state and booking locations
  Future<PermanentAddressState?> fetchAddressState(String userEmail) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/user/address?email=${Uri.encodeComponent(userEmail)}'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['addressState'] != null) {
          return PermanentAddressState.fromJson(data['addressState']);
        }
      }
    } catch (e) {
      print('AddressVerificationService error: $e');
    }
    return null;
  }

  /// Submits initial permanent address with proof document
  Future<bool> submitInitialPermanentAddress({
    required String email,
    required String permanentAddress,
    required String proofUrl,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/user/address'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'permanentAddress': permanentAddress,
          'permanentAddressProof': proofUrl,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Submit address error: $e');
      return false;
    }
  }

  /// Submits a request for address change (NON-DESTRUCTIVE: preserves existing verified address)
  Future<bool> requestPermanentAddressChange({
    required String email,
    required String proposedAddress,
    required String proposedProofUrl,
  }) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/api/user/address'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'proposedAddress': proposedAddress,
          'proposedProofUrl': proposedProofUrl,
        }),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Request address change error: $e');
      return false;
    }
  }

  /// Evaluates risk gating for mobile booking
  bool canProceedWithBooking({
    required String categorySlug,
    required PermanentAddressStatus addressStatus,
  }) {
    bool isHighRisk = ['electrical', 'security', 'solar', 'locksmith'].contains(categorySlug.toLowerCase());
    if (!isHighRisk) {
      // Low risk services allow booking while verification is pending or not submitted
      return true;
    }
    // High risk services require verified permanent address
    return addressStatus == PermanentAddressStatus.verified;
  }
}
