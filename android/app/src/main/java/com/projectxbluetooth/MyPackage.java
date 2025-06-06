package com.projectxbluetooth;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import android.util.Log;
import java.util.Collections;
import java.util.List;
import java.util.Arrays;


public class MyPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        Log.d("MyPackage", "Initializing BluetoothModule & BLEModule");

        return Arrays.asList(
                new BluetoothModule(reactContext),  // Classic Bluetooth
                new BLEModule(reactContext)         // Bluetooth Low Energy (BLE)
        );
    }

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}

