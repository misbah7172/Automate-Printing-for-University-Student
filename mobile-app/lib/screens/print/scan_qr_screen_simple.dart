import 'package:flutter/material.dart';

class ScanQRScreen extends StatefulWidget {
  const ScanQRScreen({super.key});

  @override
  State<ScanQRScreen> createState() => _ScanQRScreenState();
}

class _ScanQRScreenState extends State<ScanQRScreen> {
  String? scannedData;
  bool isScanning = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan QR Code'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            onPressed: () {
              _showMessage('Flash functionality not available in demo');
            },
            icon: const Icon(Icons.flash_on),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            flex: 4,
            child: Container(
              width: double.infinity,
              decoration: const BoxDecoration(
                color: Colors.black,
              ),
              child: Stack(
                children: [
                  Center(
                    child: Container(
                      width: 250,
                      height: 250,
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: Colors.blue,
                          width: 4,
                        ),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Center(
                        child: Text(
                          'QR Scanner\n(Demo Mode)',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 20,
                    left: 20,
                    right: 20,
                    child: ElevatedButton(
                      onPressed: _simulateQRScan,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      child: const Text(
                        'Simulate QR Scan',
                        style: TextStyle(fontSize: 16),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Expanded(
            flex: 1,
            child: Container(
              color: Colors.black,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  if (scannedData != null) ...[
                    Text(
                      'Scanned: $scannedData',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => Navigator.of(context).pop(scannedData),
                      child: const Text('Use This Code'),
                    ),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () {
                        setState(() {
                          scannedData = null;
                          isScanning = true;
                        });
                      },
                      child: const Text(
                        'Scan Again',
                        style: TextStyle(color: Colors.white),
                      ),
                    ),
                  ] else ...[
                    const Text(
                      'Point the camera at a QR code',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Tap "Simulate QR Scan" to test',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _simulateQRScan() {
    final qrCodes = [
      'printer:LIB-001',
      'kiosk:SCI-202',
      'printjob:PJ-123456',
      'http://example.com/printer',
    ];
    
    final randomCode = qrCodes[DateTime.now().millisecond % qrCodes.length];
    
    setState(() {
      scannedData = randomCode;
      isScanning = false;
    });
    
    _processQRCode(randomCode);
  }

  void _processQRCode(String qrData) {
    // Process the QR code data
    if (qrData.startsWith('printer:')) {
      _showPrinterInfo(qrData);
    } else if (qrData.startsWith('kiosk:')) {
      _showKioskInfo(qrData);
    } else if (qrData.startsWith('printjob:')) {
      _showPrintJobInfo(qrData);
    } else {
      _showGenericInfo(qrData);
    }
  }

  void _showPrinterInfo(String qrData) {
    final printerId = qrData.split(':')[1];
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Printer Found'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.print,
              size: 48,
              color: Colors.blue,
            ),
            const SizedBox(height: 16),
            Text('Printer ID: $printerId'),
            const SizedBox(height: 8),
            const Text('You can now print directly to this printer.'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              _showMessage('Printer selected: $printerId');
            },
            child: const Text('Select Printer'),
          ),
        ],
      ),
    );
  }

  void _showKioskInfo(String qrData) {
    final kioskId = qrData.split(':')[1];
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Kiosk Found'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.computer,
              size: 48,
              color: Colors.green,
            ),
            const SizedBox(height: 16),
            Text('Kiosk ID: $kioskId'),
            const SizedBox(height: 8),
            const Text('You can collect your printed documents from this kiosk.'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              _showMessage('Kiosk located: $kioskId');
            },
            child: const Text('View Queue'),
          ),
        ],
      ),
    );
  }

  void _showPrintJobInfo(String qrData) {
    final jobId = qrData.split(':')[1];
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Print Job'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.assignment,
              size: 48,
              color: Colors.orange,
            ),
            const SizedBox(height: 16),
            Text('Job ID: $jobId'),
            const SizedBox(height: 8),
            const Text('Print job details loaded.'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              _showMessage('Print job loaded: $jobId');
            },
            child: const Text('View Details'),
          ),
        ],
      ),
    );
  }

  void _showGenericInfo(String qrData) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('QR Code Scanned'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.qr_code,
              size: 48,
              color: Colors.grey,
            ),
            const SizedBox(height: 16),
            Text('Data: $qrData'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
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