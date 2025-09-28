import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../payment/payment_screen.dart';
import '../../services/payment_service.dart';

class SimpleUploadScreen extends StatefulWidget {
  const SimpleUploadScreen({super.key});

  @override
  State<SimpleUploadScreen> createState() => _SimpleUploadScreenState();
}

class _SimpleUploadScreenState extends State<SimpleUploadScreen> {
  PlatformFile? _selectedFile;
  bool _isLoading = false;
  
  // Print settings
  int _pages = 1;
  int _copies = 1;
  bool _isColor = false;
  bool _isDoubleSided = false;
  String _paperSize = 'A4';

  final List<String> _paperSizes = ['A4', 'A3', 'Letter'];

  Future<void> _pickFile() async {
    try {
      setState(() {
        _isLoading = true;
      });

      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'doc', 'docx', 'txt'],
        allowMultiple: false,
      );

      if (result != null && result.files.isNotEmpty) {
        setState(() {
          _selectedFile = result.files.first;
          // Estimate pages (for demo purposes)
          _pages = ((_selectedFile!.size / 1024 / 50).ceil()).clamp(1, 100);
        });
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error selecting file: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  double _calculateCost() {
    return PaymentService.calculatePrintCost(
      pages: _pages * _copies,
      isColor: _isColor,
      isDoubleSided: _isDoubleSided,
    );
  }

  void _proceedToPayment() {
    if (_selectedFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a file first'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    final printSettings = {
      'fileName': _selectedFile!.name,
      'pages': _pages * _copies,
      'copies': _copies,
      'isColor': _isColor,
      'isDoubleSided': _isDoubleSided,
      'paperSize': _paperSize,
    };

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => PaymentScreen(
          documentId: _selectedFile!.name, // In real app, this would be a proper ID
          amount: _calculateCost(),
          printSettings: printSettings,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Upload & Print'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // File Selection Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    if (_selectedFile == null) ...[
                      const Icon(
                        Icons.cloud_upload,
                        size: 64,
                        color: Colors.grey,
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Select Document to Print',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Supported: PDF, DOC, DOCX, TXT',
                        style: TextStyle(color: Colors.grey),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: _isLoading ? null : _pickFile,
                        icon: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Icon(Icons.folder_open),
                        label: Text(_isLoading ? 'Selecting...' : 'Choose File'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24,
                            vertical: 12,
                          ),
                        ),
                      ),
                    ] else ...[
                      const Icon(
                        Icons.description,
                        size: 48,
                        color: Colors.green,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _selectedFile!.name,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${(_selectedFile!.size / 1024).toStringAsFixed(1)} KB',
                        style: const TextStyle(color: Colors.grey),
                      ),
                      const SizedBox(height: 12),
                      TextButton.icon(
                        onPressed: () {
                          setState(() {
                            _selectedFile = null;
                          });
                        },
                        icon: const Icon(Icons.change_circle),
                        label: const Text('Change File'),
                      ),
                    ],
                  ],
                ),
              ),
            ),

            if (_selectedFile != null) ...[
              const SizedBox(height: 16),

              // Print Settings Card
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Print Settings',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Pages
                      Row(
                        children: [
                          const Icon(Icons.article, size: 20),
                          const SizedBox(width: 8),
                          const Text('Estimated Pages:'),
                          const Spacer(),
                          Container(
                            width: 60,
                            child: TextFormField(
                              initialValue: _pages.toString(),
                              keyboardType: TextInputType.number,
                              textAlign: TextAlign.center,
                              decoration: const InputDecoration(
                                border: OutlineInputBorder(),
                                contentPadding: EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 8,
                                ),
                              ),
                              onChanged: (value) {
                                setState(() {
                                  _pages = int.tryParse(value) ?? 1;
                                  if (_pages < 1) _pages = 1;
                                  if (_pages > 100) _pages = 100;
                                });
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Copies
                      Row(
                        children: [
                          const Icon(Icons.copy, size: 20),
                          const SizedBox(width: 8),
                          const Text('Copies:'),
                          const Spacer(),
                          Row(
                            children: [
                              IconButton(
                                onPressed: _copies > 1
                                    ? () => setState(() => _copies--)
                                    : null,
                                icon: const Icon(Icons.remove),
                                iconSize: 16,
                              ),
                              Text(
                                _copies.toString(),
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              IconButton(
                                onPressed: _copies < 10
                                    ? () => setState(() => _copies++)
                                    : null,
                                icon: const Icon(Icons.add),
                                iconSize: 16,
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Color
                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Row(
                          children: [
                            Icon(Icons.palette, size: 20),
                            SizedBox(width: 8),
                            Text('Color Print'),
                          ],
                        ),
                        subtitle: Text(
                          _isColor ? '+৳3 per page' : 'Standard price',
                          style: TextStyle(
                            color: _isColor ? Colors.orange : Colors.grey,
                            fontSize: 12,
                          ),
                        ),
                        value: _isColor,
                        onChanged: (value) => setState(() => _isColor = value),
                      ),

                      // Double-sided
                      SwitchListTile(
                        contentPadding: EdgeInsets.zero,
                        title: const Row(
                          children: [
                            Icon(Icons.flip_to_back, size: 20),
                            SizedBox(width: 8),
                            Text('Double-sided'),
                          ],
                        ),
                        subtitle: const Text(
                          '20% discount',
                          style: TextStyle(
                            color: Colors.green,
                            fontSize: 12,
                          ),
                        ),
                        value: _isDoubleSided,
                        onChanged: (value) => setState(() => _isDoubleSided = value),
                      ),

                      // Paper Size
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.crop_portrait, size: 20),
                          const SizedBox(width: 8),
                          const Text('Paper Size:'),
                          const Spacer(),
                          DropdownButton<String>(
                            value: _paperSize,
                            items: _paperSizes.map((size) {
                              return DropdownMenuItem(
                                value: size,
                                child: Text(size),
                              );
                            }).toList(),
                            onChanged: (value) {
                              if (value != null) {
                                setState(() => _paperSize = value);
                              }
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Cost Estimate Card
              Card(
                color: Colors.green[50],
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.calculate, color: Colors.green),
                          SizedBox(width: 8),
                          Text(
                            'Cost Estimate',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('${_pages * _copies} pages × ${_isColor ? '৳5' : '৳2'}'),
                          Text('৳${(_pages * _copies * (_isColor ? 5 : 2)).toStringAsFixed(2)}'),
                        ],
                      ),
                      if (_isDoubleSided) ...[
                        const SizedBox(height: 4),
                        const Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Double-sided discount (-20%)'),
                            Text('-৳', style: TextStyle(color: Colors.green)),
                          ],
                        ),
                      ],
                      const Divider(),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Total:',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                            ),
                          ),
                          Text(
                            '৳${_calculateCost().toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 20,
                              color: Colors.green,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Proceed Button
              ElevatedButton(
                onPressed: _proceedToPayment,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text(
                  'Proceed to Payment',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}