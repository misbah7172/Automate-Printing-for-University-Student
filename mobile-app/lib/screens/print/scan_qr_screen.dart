import 'package:flutter/material.dart';
// import 'package:qr_code_scanner/qr_code_scanner.dart';  // Temporarily disabled

class ScanQRScreen extends StatefulWidget {
  const ScanQRScreen({super.key});

  @override
  State<ScanQRScreen> createState() => _ScanQRScreenState();
}

class _ScanQRScreenState extends State<ScanQRScreen> {
  final GlobalKey qrKey = GlobalKey(debugLabel: 'QR');
  QRViewController? controller;
  String? scannedData;
  bool isScanning = true;

  @override
  void dispose() {
    controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan QR Code'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            onPressed: () async {
              await controller?.toggleFlash();
            },
            icon: const Icon(Icons.flash_on),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            flex: 4,
            child: QRView(
              key: qrKey,
              onQRViewCreated: _onQRViewCreated,
              overlay: QrScannerOverlayShape(
                borderColor: Colors.blue,
                borderRadius: 10,
                borderLength: 30,
                borderWidth: 10,
                cutOutSize: 250,
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
                        controller?.resumeCamera();
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
                      'The scanner will automatically detect QR codes',
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

  void _onQRViewCreated(QRViewController controller) {
    this.controller = controller;
    controller.scannedDataStream.listen((scanData) {
      if (isScanning && scanData.code != null) {
        setState(() {
          scannedData = scanData.code;
          isScanning = false;
        });
        controller.pauseCamera();
        _processQRCode(scanData.code!);
      }
    });
  }

  void _processQRCode(String qrData) {
    // Process the QR code data
    // This could be a printer location, kiosk ID, or print job reference
    
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
              // Navigate to upload document with printer pre-selected
            },
            child: const Text('Print Document'),
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
              // Navigate to print queue with kiosk info
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
              // Navigate to specific print job details
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
}