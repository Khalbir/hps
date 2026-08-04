import 'dart:convert';
import 'dart:async';
import 'package:http/http.dart' as http;

class LatLng {
  final double lat;
  final double lng;

  LatLng({required this.lat, required this.lng});

  factory LatLng.fromJson(Map<String, dynamic> json) {
    return LatLng(
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {'lat': lat, 'lng': lng};
}

class AutocompleteSuggestion {
  final String placeId;
  final String description;
  final String mainText;
  final String secondaryText;
  final LatLng location;

  AutocompleteSuggestion({
    required this.placeId,
    required this.description,
    required this.mainText,
    required this.secondaryText,
    required this.location,
  });

  factory AutocompleteSuggestion.fromJson(Map<String, dynamic> json) {
    return AutocompleteSuggestion(
      placeId: json['placeId'] ?? '',
      description: json['description'] ?? '',
      mainText: json['mainText'] ?? '',
      secondaryText: json['secondaryText'] ?? '',
      location: LatLng.fromJson(json['location']),
    );
  }
}

class DispatchOffer {
  final String id;
  final String bookingId;
  final String artisanId;
  final String artisanName;
  final double score;
  final double distanceKm;
  final String status;
  final DateTime expiresAt;
  final int offerIndex;

  DispatchOffer({
    required this.id,
    required this.bookingId,
    required this.artisanId,
    required this.artisanName,
    required this.score,
    required this.distanceKm,
    required this.status,
    required this.expiresAt,
    required this.offerIndex,
  });

  factory DispatchOffer.fromJson(Map<String, dynamic> json) {
    return DispatchOffer(
      id: json['id'] ?? '',
      bookingId: json['bookingId'] ?? '',
      artisanId: json['artisanId'] ?? '',
      artisanName: json['artisanName'] ?? '',
      score: (json['score'] as num).toDouble(),
      distanceKm: (json['distanceKm'] as num).toDouble(),
      status: json['status'] ?? 'OFFERED',
      expiresAt: DateTime.parse(json['expiresAt']),
      offerIndex: json['offerIndex'] ?? 0,
    );
  }
}

class HandyHubLocationService {
  final String baseUrl;
  HandyHubLocationService({this.baseUrl = 'http://localhost:3000'});

  /// Fetch cached Google Places autocomplete suggestions
  Future<List<AutocompleteSuggestion>> fetchAutocomplete(String query) async {
    if (query.trim().isEmpty) return [];

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/location/autocomplete?q=${Uri.encodeComponent(query)}'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List suggestionsJson = data['suggestions'] ?? [];
        return suggestionsJson
            .map((item) => AutocompleteSuggestion.fromJson(item))
            .toList();
      }
      return [];
    } catch (e) {
      print('[LocationService Error]: $e');
      return [];
    }
  }

  /// Geocode address to LatLng coordinates
  Future<LatLng?> geocodeAddress(String address) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/location/geocode'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'address': address}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return LatLng.fromJson(data['location']);
      }
      return null;
    } catch (e) {
      print('[Geocode Error]: $e');
      return null;
    }
  }

  /// Dispatch matching & cascade offer trigger
  Future<DispatchOffer?> triggerDispatch({
    required String bookingId,
    required String serviceCategory,
    required LatLng location,
    int offerIndex = 0,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/location/dispatch'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'bookingId': bookingId,
          'serviceCategory': serviceCategory,
          'location': location.toJson(),
          'offerIndex': offerIndex,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['offer'] != null) {
          return DispatchOffer.fromJson(data['offer']);
        }
      }
      return null;
    } catch (e) {
      print('[Dispatch Error]: $e');
      return null;
    }
  }
}
