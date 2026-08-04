import 'dart:async';
import 'package:flutter/material.dart';
import '../services/handyhub_location_service.dart';

class AddressAutocompleteField extends StatefulWidget {
  final String label;
  final String placeholder;
  final ValueChanged<AutocompleteSuggestion> onSuggestionSelected;
  final HandyHubLocationService locationService;

  const AddressAutocompleteField({
    Key? key,
    this.label = 'Service Address',
    this.placeholder = 'Type address... e.g. Maitama, Wuse 2, Jabi',
    required this.onSuggestionSelected,
    required this.locationService,
  }) : super(key: key);

  @override,
  State<AddressAutocompleteField> createState() => _AddressAutocompleteFieldState();
}

class _AddressAutocompleteFieldState extends State<AddressAutocompleteField> {
  final TextEditingController _controller = TextEditingController();
  List<AutocompleteSuggestion> _suggestions = [];
  bool _isLoading = false;
  Timer? _debounceTimer;

  void _onQueryChanged(String query) {
    if (_debounceTimer?.isActive ?? false) _debounceTimer!.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 300), () async {
      if (query.trim().length < 2) {
        setState(() => _suggestions = []);
        return;
      }

      setState(() => _isLoading = true);
      final results = await widget.locationService.fetchAutocomplete(query);
      if (mounted) {
        setState(() {
          _suggestions = results;
          _isLoading = false;
        });
      }
    });
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.label,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _controller,
          onChanged: _onQueryChanged,
          decoration: InputDecoration(
            hintText: widget.placeholder,
            prefixIcon: const Icon(Icons.location_on, color: Color(0xFF0EA5E9)),
            suffixIcon: _isLoading
                ? const Padding(
                    padding: EdgeInsets.all(12),
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : null,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF0EA5E9), width: 2),
            ),
          ),
        ),
        if (_suggestions.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(top: 4),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 10)],
            ),
            child: ListView.separated(
              shrinkWrap: true,
              itemCount: _suggestions.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final suggestion = _suggestions[index];
                return ListTile(
                  leading: const Icon(Icons.place, color: Color(0xFF0EA5E9)),
                  title: Text(suggestion.mainText, style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text(suggestion.secondaryText, style: const TextStyle(fontSize: 12)),
                  onTap: () {
                    _controller.text = suggestion.description;
                    setState(() => _suggestions = []);
                    widget.onSuggestionSelected(suggestion);
                  },
                );
              },
            ),
          ),
      ],
    );
  }
}
