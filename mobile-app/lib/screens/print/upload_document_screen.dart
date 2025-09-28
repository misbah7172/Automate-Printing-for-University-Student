import 'package:flutter/material.dart';
// import 'package:file_picker/file_picker.dart';  // Temporarily disabled
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
  bool hasSelectedFile = false;  // Simulated file selection
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
          color: selectedFile != null ? Colors.green : Colors.grey.withOpacity(0.3),
          width: 2,
          style: BorderStyle.solid,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Icon(
            selectedFile != null ? Icons.check_circle : Icons.cloud_upload,
            size: 64,
            color: selectedFile != null ? Colors.green : Colors.grey,
          ),
          const SizedBox(height: 16),
          Text(
            selectedFile != null ? 'File Selected' : 'Select Document',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: selectedFile != null ? Colors.green : Colors.grey[700],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            selectedFile != null
                ? selectedFile!.name
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
              onPressed: _pickFile,
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).primaryColor,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: Text(
                selectedFile != null ? 'Change File' : 'Choose File',
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
            color: Colors.grey.withOpacity(0.1),
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
                      border: Border.all(color: Colors.grey.withOpacity(0.3)),
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
          
          const SizedBox(height: 16),
          
          // Orientation
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Orientation:', style: TextStyle(fontSize: 16)),
              DropdownButton<String>(
                value: orientation,
                onChanged: (String? newValue) {
                  if (newValue != null) {
                    setState(() => orientation = newValue);
                  }
                },
                items: orientations.map<DropdownMenuItem<String>>((String value) {
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
        color: Colors.blue.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: Colors.blue.withOpacity(0.3),
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

  Future<void> _pickFile() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
        allowMultiple: false,
      );

      if (result != null && result.files.isNotEmpty) {
        setState(() {
          selectedFile = result.files.first;
          selectedFileName = result.files.first.name;
        });
      }
    } catch (e) {
      _showMessage('Error selecting file: $e');
    }
  }

  Future<void> _submitPrintJob() async {
    if (selectedFile == null) return;

    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      _showMessage('Please login first');
      return;
    }

    setState(() => isUploading = true);

    try {
      // In a real app, you would upload the file to cloud storage first
      // For now, we'll simulate with a mock file URL
      final fileUrl = 'mock_file_url_${DateTime.now().millisecondsSinceEpoch}';

      final printSettings = {
        'copies': copies,
        'isDoubleSided': isDoubleSided,
        'isColorPrint': isColorPrint,
        'paperSize': paperSize,
        'orientation': orientation,
      };

      final result = await StudentService.submitPrintJob(
        uid: user.uid,
        fileName: selectedFile!.name,
        fileUrl: fileUrl,
        printSettings: printSettings,
      );

      if (result != null) {
        _showMessage('Print job submitted successfully!');
        Navigator.of(context).pop();
      } else {
        _showMessage('Failed to submit print job. Please try again.');
      }
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