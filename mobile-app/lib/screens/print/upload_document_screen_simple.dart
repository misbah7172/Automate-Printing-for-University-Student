import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../services/student_service.dart';

class UploadDocumentScreen extends ConsumerStatefulWidget {
  const UploadDocumentScreen({super.key});

  @override
  ConsumerState<UploadDocumentScreen> createState() => _UploadDocumentScreenState();
}

class _UploadDocumentScreenState extends ConsumerState<UploadDocumentScreen> {
  String? selectedFileName;
  bool hasSelectedFile = false;
  bool isUploading = false;
  
  // Print settings
  int copies = 1;
  bool isDoubleSided = false;
  bool isColorPrint = false;
  String paperSize = 'A4';
  String orientation = 'Portrait';

  final List<String> paperSizes = ['A4', 'A3', 'Letter', 'Legal'];
  final List<String> orientations = ['Portrait', 'Landscape'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Upload Document'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.black,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildFileSelection(),
            const SizedBox(height: 24),
            if (hasSelectedFile) ...[
              _buildPrintSettings(),
              const SizedBox(height: 24),
              _buildCostEstimate(),
              const SizedBox(height: 32),
              _buildSubmitButton(),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildFileSelection() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: hasSelectedFile ? Colors.green : Colors.grey.withValues(alpha: 0.3),
          width: 2,
          style: BorderStyle.solid,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.1),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(
            hasSelectedFile ? Icons.check_circle : Icons.cloud_upload,
            size: 64,
            color: hasSelectedFile ? Colors.green : Colors.grey,
          ),
          const SizedBox(height: 16),
          Text(
            hasSelectedFile ? 'File Selected' : 'Select Document',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: hasSelectedFile ? Colors.green : Colors.grey[700],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            hasSelectedFile
                ? selectedFileName ?? 'sample_document.pdf'
                : 'Choose PDF, DOC, DOCX, or image files',
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: 14,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _simulateFilePicker,
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).primaryColor,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: Text(
                hasSelectedFile ? 'Change File' : 'Choose File',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPrintSettings() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withValues(alpha: 0.1),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
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
          const SizedBox(height: 20),
          
          // Copies
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Copies:', style: TextStyle(fontSize: 16)),
              Row(
                children: [
                  IconButton(
                    onPressed: copies > 1 ? () => setState(() => copies--) : null,
                    icon: const Icon(Icons.remove),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey.withValues(alpha: 0.3)),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      copies.toString(),
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                    ),
                  ),
                  IconButton(
                    onPressed: copies < 99 ? () => setState(() => copies++) : null,
                    icon: const Icon(Icons.add),
                  ),
                ],
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Paper Size
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Paper Size:', style: TextStyle(fontSize: 16)),
              DropdownButton<String>(
                value: paperSize,
                onChanged: (String? newValue) {
                  if (newValue != null) {
                    setState(() => paperSize = newValue);
                  }
                },
                items: paperSizes.map<DropdownMenuItem<String>>((String value) {
                  return DropdownMenuItem<String>(
                    value: value,
                    child: Text(value),
                  );
                }).toList(),
              ),
            ],
          ),
          
          const SizedBox(height: 20),
          
          // Switches
          SwitchListTile(
            title: const Text('Double-sided'),
            subtitle: const Text('Print on both sides'),
            value: isDoubleSided,
            onChanged: (bool value) => setState(() => isDoubleSided = value),
            contentPadding: EdgeInsets.zero,
          ),
          
          SwitchListTile(
            title: const Text('Color Print'),
            subtitle: const Text('Use color printer (additional cost)'),
            value: isColorPrint,
            onChanged: (bool value) => setState(() => isColorPrint = value),
            contentPadding: EdgeInsets.zero,
          ),
        ],
      ),
    );
  }

  Widget _buildCostEstimate() {
    final double baseCost = isColorPrint ? 0.25 : 0.10;
    final double totalCost = baseCost * copies * (isDoubleSided ? 2 : 1);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.blue.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Colors.blue.withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Estimated Cost',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '${copies} copies • ${isColorPrint ? 'Color' : 'B&W'} • ${isDoubleSided ? 'Double-sided' : 'Single-sided'}',
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 12,
                ),
              ),
            ],
          ),
          Text(
            '\$${totalCost.toStringAsFixed(2)}',
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.blue,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: isUploading ? null : _submitPrintJob,
        style: ElevatedButton.styleFrom(
          backgroundColor: Theme.of(context).primaryColor,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        ),
        child: isUploading
            ? const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  ),
                  SizedBox(width: 12),
                  Text('Uploading...'),
                ],
              )
            : const Text(
                'Submit Print Job',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
      ),
    );
  }

  Future<void> _simulateFilePicker() async {
    // Simulate file selection
    await Future.delayed(const Duration(milliseconds: 500));
    setState(() {
      hasSelectedFile = true;
      selectedFileName = 'sample_document.pdf';
    });
    _showMessage('File selected successfully!');
  }

  Future<void> _submitPrintJob() async {
    if (!hasSelectedFile) return;

    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      _showMessage('Please login first');
      return;
    }

    setState(() => isUploading = true);

    try {
      // Simulate file upload and print job submission
      await Future.delayed(const Duration(seconds: 2));

      final printSettings = {
        'copies': copies,
        'isDoubleSided': isDoubleSided,
        'isColorPrint': isColorPrint,
        'paperSize': paperSize,
        'orientation': orientation,
      };

      _showMessage('Print job submitted successfully!');
      Navigator.of(context).pop();
    } catch (e) {
      _showMessage('Error: $e');
    } finally {
      setState(() => isUploading = false);
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}