# MOB-006: Mobile-Specific Features

**Epic:** EPIC-015 Mobile Applications
**Story Points:** 3
**Priority:** Medium
**Status:** Not Started

---

## User Story

**As a** mobile app user
**I want** mobile-specific features like camera QR scanning, offline ticket access, and biometric authentication
**So that** I have a seamless and convenient mobile experience optimized for on-the-go event attendance

---

## Acceptance Criteria

### 1. Mobile Camera QR Code Scanner
- [ ] In-app QR code scanner using device camera
- [ ] Real-time QR code detection
- [ ] Flashlight toggle for low-light scanning
- [ ] Autofocus and tap-to-focus support
- [ ] Haptic feedback on successful scan
- [ ] Error handling for invalid QR codes
- [ ] Gallery image QR code scanning
- [ ] Permission handling for camera access

### 2. Offline Ticket Storage
- [ ] Download tickets for offline access
- [ ] Encrypted local storage for tickets
- [ ] Offline QR code display
- [ ] Sync tickets when online
- [ ] Offline mode indicator
- [ ] Auto-download purchased tickets
- [ ] Manual refresh option
- [ ] Storage size management (< 50MB)

### 3. Biometric Authentication
- [ ] Face ID support (iOS)
- [ ] Touch ID support (iOS)
- [ ] Fingerprint authentication (Android)
- [ ] Face unlock support (Android)
- [ ] Fallback to PIN/password
- [ ] Biometric settings in app
- [ ] Quick login with biometrics
- [ ] Secure credential storage

### 4. Mobile Wallet Integration
- [ ] Add tickets to Apple Wallet (iOS)
- [ ] Add tickets to Google Wallet (Android)
- [ ] Wallet pass with QR code
- [ ] Automatic wallet updates
- [ ] Pass expiration handling
- [ ] Pass deletion after event
- [ ] Location-based pass display
- [ ] Lock screen pass access

### 5. Location-Based Features
- [ ] Geofencing for event venues
- [ ] Auto check-in when near venue (optional)
- [ ] Distance to venue display
- [ ] Venue directions integration
- [ ] Nearby events discovery
- [ ] Location-based notifications
- [ ] Permission handling
- [ ] Battery-efficient location tracking

### 6. Device-Specific Optimizations
- [ ] Haptic feedback for interactions
- [ ] 3D Touch / Haptic Touch quick actions
- [ ] App shortcuts for home screen
- [ ] Widgets for upcoming events
- [ ] Picture-in-Picture support (if applicable)
- [ ] Split-screen / multi-window support
- [ ] Landscape mode support
- [ ] Tablet-optimized layouts

### 7. Native Sharing
- [ ] Native share sheet integration
- [ ] Share event links
- [ ] Share tickets with friends
- [ ] Share to social media
- [ ] Share via messaging apps
- [ ] QR code sharing
- [ ] Deep link generation for sharing
- [ ] Share analytics tracking

### 8. Performance & UX
- [ ] Smooth 60fps animations
- [ ] Fast image loading (<1s)
- [ ] Lazy loading for lists
- [ ] Pull-to-refresh on lists
- [ ] Shimmer loading states
- [ ] Error boundaries with retry
- [ ] Network status handling
- [ ] Battery optimization

---

## Technical Specifications

### QR Code Scanner
```typescript
// src/features/QRScanner/QRScannerScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Vibration } from 'react-native';
import { Camera, useCameraDevices, useCodeScanner } from 'react-native-vision-camera';
import { useNavigation } from '@react-navigation/native';

export const QRScannerScreen: React.FC = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const devices = useCameraDevices();
  const device = devices.back;
  const navigation = useNavigation();

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const status = await Camera.requestCameraPermission();
    setHasPermission(status === 'authorized');
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: (codes) => {
      if (codes.length > 0) {
        const qrCode = codes[0].value;
        handleQRCodeScanned(qrCode);
      }
    },
  });

  const handleQRCodeScanned = async (qrCode: string) => {
    // Haptic feedback
    Vibration.vibrate(100);

    try {
      // Validate QR code with backend
      const response = await fetch('/api/tickets/validate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode }),
      });

      const data = await response.json();

      if (response.ok) {
        navigation.navigate('TicketDetail', { ticketId: data.ticketId });
      } else {
        Alert.alert('Invalid QR Code', data.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to validate QR code');
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text>Camera permission required</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <Text>Camera not available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        codeScanner={codeScanner}
        torch={torchOn ? 'on' : 'off'}
      />

      {/* Overlay with scanning area */}
      <View style={styles.overlay}>
        <View style={styles.scanArea} />
        <Text style={styles.instructions}>
          Align QR code within the frame
        </Text>
        <TouchableOpacity
          style={styles.torchButton}
          onPress={() => setTorchOn(!torchOn)}
        >
          <Text style={styles.torchText}>
            {torchOn ? 'Flash Off' : 'Flash On'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
  },
  instructions: {
    marginTop: 20,
    color: '#fff',
    fontSize: 16,
  },
  torchButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 8,
  },
  torchText: {
    color: '#fff',
    fontSize: 14,
  },
});
```

### Offline Ticket Storage
```typescript
// src/features/Tickets/OfflineTicketService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { AES } from 'react-native-aes-crypto';

interface Ticket {
  id: string;
  eventName: string;
  qrCode: string;
  eventDate: string;
  venueName: string;
  imageUrl?: string;
}

export class OfflineTicketService {
  private static readonly STORAGE_KEY = 'offline_tickets';
  private static readonly ENCRYPTION_KEY = 'your-encryption-key'; // Should be from secure storage

  static async downloadTicket(ticketId: string): Promise<void> {
    // Fetch ticket from API
    const response = await fetch(`/api/tickets/${ticketId}`);
    const ticket: Ticket = await response.json();

    // Download event image for offline use
    if (ticket.imageUrl) {
      const imagePath = await this.downloadImage(ticket.imageUrl, ticketId);
      ticket.imageUrl = imagePath;
    }

    // Encrypt ticket data
    const encryptedTicket = await this.encryptTicket(ticket);

    // Store encrypted ticket
    await this.storeTicket(ticketId, encryptedTicket);
  }

  static async getOfflineTicket(ticketId: string): Promise<Ticket | null> {
    const encryptedTicket = await this.retrieveTicket(ticketId);
    if (!encryptedTicket) return null;

    return await this.decryptTicket(encryptedTicket);
  }

  static async getAllOfflineTickets(): Promise<Ticket[]> {
    const ticketsJson = await AsyncStorage.getItem(this.STORAGE_KEY);
    if (!ticketsJson) return [];

    const ticketIds = JSON.parse(ticketsJson);
    const tickets = await Promise.all(
      ticketIds.map((id: string) => this.getOfflineTicket(id))
    );

    return tickets.filter((t): t is Ticket => t !== null);
  }

  static async syncTickets(): Promise<void> {
    const tickets = await this.getAllOfflineTickets();

    for (const ticket of tickets) {
      try {
        // Check if ticket is still valid
        const response = await fetch(`/api/tickets/${ticket.id}/status`);
        if (!response.ok) {
          // Remove invalid ticket
          await this.removeTicket(ticket.id);
        }
      } catch (error) {
        console.error('Failed to sync ticket:', ticket.id);
      }
    }
  }

  private static async downloadImage(url: string, ticketId: string): Promise<string> {
    const filename = `ticket_${ticketId}.jpg`;
    const path = `${RNFS.DocumentDirectoryPath}/${filename}`;

    await RNFS.downloadFile({
      fromUrl: url,
      toFile: path,
    }).promise;

    return `file://${path}`;
  }

  private static async encryptTicket(ticket: Ticket): Promise<string> {
    const json = JSON.stringify(ticket);
    return await AES.encrypt(json, this.ENCRYPTION_KEY, {});
  }

  private static async decryptTicket(encrypted: string): Promise<Ticket> {
    const json = await AES.decrypt(encrypted, this.ENCRYPTION_KEY, {});
    return JSON.parse(json);
  }

  private static async storeTicket(ticketId: string, encrypted: string): Promise<void> {
    await AsyncStorage.setItem(`ticket_${ticketId}`, encrypted);

    // Add to ticket list
    const ticketsJson = await AsyncStorage.getItem(this.STORAGE_KEY);
    const ticketIds = ticketsJson ? JSON.parse(ticketsJson) : [];
    if (!ticketIds.includes(ticketId)) {
      ticketIds.push(ticketId);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(ticketIds));
    }
  }

  private static async retrieveTicket(ticketId: string): Promise<string | null> {
    return await AsyncStorage.getItem(`ticket_${ticketId}`);
  }

  private static async removeTicket(ticketId: string): Promise<void> {
    await AsyncStorage.removeItem(`ticket_${ticketId}`);

    const ticketsJson = await AsyncStorage.getItem(this.STORAGE_KEY);
    if (ticketsJson) {
      const ticketIds = JSON.parse(ticketsJson);
      const filtered = ticketIds.filter((id: string) => id !== ticketId);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
    }
  }

  static async clearAllTickets(): Promise<void> {
    const tickets = await this.getAllOfflineTickets();
    for (const ticket of tickets) {
      await this.removeTicket(ticket.id);
    }
    await AsyncStorage.removeItem(this.STORAGE_KEY);
  }
}
```

### Location-Based Features
```typescript
// src/features/Location/GeofencingService.ts
import Geolocation from '@react-native-community/geolocation';
import BackgroundGeolocation from 'react-native-background-geolocation';
import { PermissionsAndroid, Platform } from 'react-native';

interface VenueLocation {
  latitude: number;
  longitude: number;
  radius: number; // meters
  venueId: string;
  venueName: string;
}

export class GeofencingService {
  static async initialize(): Promise<void> {
    await this.requestLocationPermission();

    BackgroundGeolocation.ready({
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 50,
      stopTimeout: 5,
      debug: false,
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      stopOnTerminate: false,
      startOnBoot: true,
    }).then((state) => {
      BackgroundGeolocation.start();
    });
  }

  static async requestLocationPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization();
      return auth === 'granted' || auth === 'whenInUse';
    } else {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
  }

  static async addGeofence(venue: VenueLocation): Promise<void> {
    await BackgroundGeolocation.addGeofence({
      identifier: venue.venueId,
      radius: venue.radius,
      latitude: venue.latitude,
      longitude: venue.longitude,
      notifyOnEntry: true,
      notifyOnExit: false,
      notifyOnDwell: true,
      loiteringDelay: 300000, // 5 minutes
    });
  }

  static onGeofenceEnter(callback: (geofence: any) => void): void {
    BackgroundGeolocation.onGeofence((event) => {
      if (event.action === 'ENTER' || event.action === 'DWELL') {
        callback(event);
      }
    });
  }

  static async getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  }

  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }
}
```

### Apple Wallet Pass Generation (Backend)
```typescript
// lib/services/wallet-pass.service.ts
import { PKPass } from 'passkit-generator';
import { readFileSync } from 'fs';
import path from 'path';

export class WalletPassService {
  static async generateApplePass(ticket: any): Promise<Buffer> {
    const pass = new PKPass(
      {
        'pass.json': readFileSync(path.join(__dirname, 'templates/pass.json')),
      },
      {
        signerCert: readFileSync(path.join(__dirname, 'certs/signerCert.pem')),
        signerKey: readFileSync(path.join(__dirname, 'certs/signerKey.pem')),
        wwdr: readFileSync(path.join(__dirname, 'certs/wwdr.pem')),
        signerKeyPassphrase: process.env.PASS_SIGNER_KEY_PASSPHRASE,
      }
    );

    pass.type = 'eventTicket';
    pass.serialNumber = ticket.id;
    pass.description = ticket.eventName;
    pass.organizationName = 'SteppersLife Events';
    pass.logoText = 'SteppersLife';

    // Primary fields
    pass.primaryFields.push({
      key: 'event',
      label: 'EVENT',
      value: ticket.eventName,
    });

    // Secondary fields
    pass.secondaryFields.push({
      key: 'date',
      label: 'DATE',
      value: new Date(ticket.eventDate).toLocaleDateString(),
    });

    pass.secondaryFields.push({
      key: 'time',
      label: 'TIME',
      value: new Date(ticket.eventDate).toLocaleTimeString(),
    });

    // Auxiliary fields
    pass.auxiliaryFields.push({
      key: 'venue',
      label: 'VENUE',
      value: ticket.venueName,
    });

    // Back fields
    pass.backFields.push({
      key: 'terms',
      label: 'TERMS AND CONDITIONS',
      value: 'For terms and conditions, visit events.stepperslife.com/terms',
    });

    // Barcode
    pass.barcodes = [
      {
        format: 'PKBarcodeFormatQR',
        message: ticket.qrCode,
        messageEncoding: 'iso-8859-1',
      },
    ];

    // Location for lock screen display
    if (ticket.venue.latitude && ticket.venue.longitude) {
      pass.locations = [
        {
          latitude: ticket.venue.latitude,
          longitude: ticket.venue.longitude,
          relevantText: `Check in for ${ticket.eventName}`,
        },
      ];
    }

    // Generate pass
    return await pass.getAsBuffer();
  }
}
```

### App Shortcuts (iOS)
```xml
<!-- ios/EventsSteppersLife/Info.plist -->
<key>UIApplicationShortcutItems</key>
<array>
    <dict>
        <key>UIApplicationShortcutItemType</key>
        <string>com.stepperslife.events.mytickets</string>
        <key>UIApplicationShortcutItemTitle</key>
        <string>My Tickets</string>
        <key>UIApplicationShortcutItemIconType</key>
        <string>UIApplicationShortcutIconTypeTicket</string>
    </dict>
    <dict>
        <key>UIApplicationShortcutItemType</key>
        <string>com.stepperslife.events.scan</string>
        <key>UIApplicationShortcutItemTitle</key>
        <string>Scan QR Code</string>
        <key>UIApplicationShortcutItemIconType</key>
        <string>UIApplicationShortcutIconTypeSearch</string>
    </dict>
    <dict>
        <key>UIApplicationShortcutItemType</key>
        <string>com.stepperslife.events.browse</string>
        <key>UIApplicationShortcutItemTitle</key>
        <string>Browse Events</string>
        <key>UIApplicationShortcutItemIconType</key>
        <string>UIApplicationShortcutIconTypeCompose</string>
    </dict>
</array>
```

### App Shortcuts Handler
```typescript
// src/navigation/ShortcutHandler.ts
import { Linking } from 'react-native';
import QuickActions from 'react-native-quick-actions';

export class ShortcutHandler {
  static setup(navigation: any): void {
    QuickActions.setShortcutItems([
      {
        type: 'com.stepperslife.events.mytickets',
        title: 'My Tickets',
        icon: 'Ticket',
      },
      {
        type: 'com.stepperslife.events.scan',
        title: 'Scan QR Code',
        icon: 'Search',
      },
      {
        type: 'com.stepperslife.events.browse',
        title: 'Browse Events',
        icon: 'Compose',
      },
    ]);

    QuickActions.popInitialAction((action) => {
      if (action) {
        this.handleShortcut(action.type, navigation);
      }
    });
  }

  static handleShortcut(type: string, navigation: any): void {
    switch (type) {
      case 'com.stepperslife.events.mytickets':
        navigation.navigate('MyTickets');
        break;
      case 'com.stepperslife.events.scan':
        navigation.navigate('QRScanner');
        break;
      case 'com.stepperslife.events.browse':
        navigation.navigate('EventsList');
        break;
    }
  }
}
```

---

## Testing Requirements

### Camera Permission Tests
```typescript
describe('QRScanner', () => {
  it('should request camera permission', async () => {
    const { getByText } = render(<QRScannerScreen />);
    expect(Camera.requestCameraPermission).toHaveBeenCalled();
  });

  it('should handle QR code scan', async () => {
    // Test QR code scanning
  });
});
```

### Offline Storage Tests
```typescript
describe('OfflineTicketService', () => {
  it('should download and encrypt ticket', async () => {
    await OfflineTicketService.downloadTicket('ticket123');
    const ticket = await OfflineTicketService.getOfflineTicket('ticket123');
    expect(ticket).toBeDefined();
  });

  it('should sync tickets when online', async () => {
    await OfflineTicketService.syncTickets();
    // Assert sync completed
  });
});
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] QR scanner working on iOS and Android
- [ ] Offline tickets encrypted and accessible
- [ ] Biometric authentication functional
- [ ] Location features battery-efficient
- [ ] All permissions properly requested
- [ ] Unit tests passing (>80% coverage)
- [ ] Performance benchmarks met
- [ ] Documentation complete

---

## Dependencies

- MOB-002: iOS app development (prerequisite)
- MOB-003: Android app development (prerequisite)
- AUTH-002: Biometric authentication (parallel)

---

## Estimated Timeline

- Week 1: QR scanner and camera integration
- Week 2: Offline storage and encryption
- Week 3: Location-based features
- Week 4: Wallet integration and testing

**Total Duration:** 4 weeks
**Story Points:** 3