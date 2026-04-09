# Invoice Builder

A React Native mobile app for creating, customizing, and exporting professional invoices with PDF generation and device storage capabilities.

## Features

- **Dynamic invoice creation** - Add/remove line items with descriptions, weight, quantity, and pricing
- **Real-time calculations** - Automatic subtotal, VAT, discount, delivery charges, and due amounts
- **PDF generation** - Export invoices as PDF files using Expo Print
- **Save to device** - Download PDFs directly to device storage (Android/iOS)
- **Share invoices** - Share PDFs via email, messaging apps, or cloud storage
- **Customizable fields** - Brand name, invoice number, delivery partner, dates
- **Customer information** - Name, phone, address
- **Company footer** - Email and address for branding
- **Multi-platform** - Works on iOS, Android, and Web

## Tech Stack

- React Native
- Expo (Print, Sharing, FileSystem, MediaLibrary)
- @react-native-community/datetimepicker
- Expo Asset

## Installation

```bash
npx expo install expo-print expo-sharing expo-file-system expo-asset expo-media-library
npm install @react-native-community/datetimepicker
