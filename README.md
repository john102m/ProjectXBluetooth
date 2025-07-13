# ProjectXBluetooth

A modular React Native application for communicating with an ESP32-C3 device over Bluetooth Low Energy (BLE). This project is part of a larger system integrating embedded firmware, mobile app control, and real-time sensor telemetry.

## 📱 Features

- Scan for nearby BLE peripherals
- Connect/disconnect from a selected device
- Send BLE commands and receive real-time notifications
- Monitor battery and sensor status
- Modular structure with reusable hooks and native modules
- Native Android BLE implementation for full control

## 🏗️ Architecture

- **React Native + TypeScript**
- BLE logic split into:
  - `useBluetooth`: overview and control of lower level modules
  - `useBLENotifications`: process incoming notifications
  - `useBLESubscription`: handle GATT notifications
  - `useBLEManager`: comms with native module
- Custom native Android BLE module (`BLEModule.java`) for low-level BLE control



## 🚀 Getting Started

### Prerequisites

- Node.js
- Yarn or npm
- Android Studio (for native BLE module)
- Physical Android device with BLE

### Installation

```bash
git clone https://github.com/john102m/ProjectXBluetooth.git
cd ProjectXBluetooth
yarn install

npx react-native run-android

🛠️ Related Projects
ESP32-C3 Firmware ("Project Y") – BLE GATT server and sensor logic

Project Z Website – Documentation and tutorials site built with Umbraco
