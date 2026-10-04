import urllib.request
import urllib.error
import json
import zipfile
import io
import os
import shutil

API_URL = "https://pwabuilder-cloudapk.azurewebsites.net/generateAppPackage"

payload = {
    "analysisId": None,
    "appVersion": "1.0.0",
    "appVersionCode": 1,
    "backgroundColor": "#000000",
    "display": "fullscreen",
    "enableNotifications": True,
    "enableSiteSettingsShortcut": False,
    "fallbackType": "webview",
    "host": "phryvos.in",
    "iconUrl": "https://phryvos.in/icon-512.png",
    "maskableIconUrl": "https://phryvos.in/icon-512.png",
    "includeSourceCode": True,
    "launcherName": "Phryvos",
    "name": "Phryvos",
    "navigationColor": "#000000",
    "packageId": "in.phryvos.app",
    "pwaUrl": "https://phryvos.in/",
    "signingMode": "new",
    "signing": {
        "fullName": "Phryvos Team",
        "organization": "Phryvos",
        "organizationalUnit": "Core",
        "countryCode": "IN",
        "keyPassword": "phryvospassword123",
        "storePassword": "phryvospassword123",
        "alias": "phryvos"
    },
    "splashScreenFadeOutDuration": 300,
    "startUrl": "/radar",
    "themeColor": "#000000",
    "webManifestUrl": "https://phryvos.in/manifest.json"
}

print("Initiating cloud build request to PWABuilder Android Service...")
req = urllib.request.Request(
    API_URL,
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json", "User-Agent": "PhryvosAPKBuilder/1.0"}
)

try:
    with urllib.request.urlopen(req, timeout=180) as response:
        content_type = response.headers.get("Content-Type", "")
        print(f"Response status: {response.status}, Content-Type: {content_type}")
        zip_bytes = response.read()
        print(f"Downloaded package archive ({len(zip_bytes)} bytes)")
        
        with open("phryvos_android_package.zip", "wb") as f:
            f.write(zip_bytes)
            
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as z:
            namelist = z.namelist()
            print("Archive contents:")
            for name in namelist[:20]:
                print(f" - {name}")
                
            # Find APK or AAB
            apk_files = [n for n in namelist if n.endswith(".apk")]
            aab_files = [n for n in namelist if n.endswith(".aab")]
            
            print(f"Found APKs: {apk_files}")
            print(f"Found AABs: {aab_files}")
            
            if apk_files:
                target_apk = apk_files[0]
                apk_data = z.read(target_apk)
                
                # Save to public/Phryvos.apk for web download
                os.makedirs("public/download", exist_ok=True)
                with open("public/download/Phryvos.apk", "wb") as f:
                    f.write(apk_data)
                print(f"Saved to public/download/Phryvos.apk ({len(apk_data)} bytes)")
                
                # Save to /storage/emulated/0/Download/Phryvos.apk for direct phone install
                phone_dl = "/storage/emulated/0/Download/Phryvos.apk"
                try:
                    with open(phone_dl, "wb") as f:
                        f.write(apk_data)
                    print(f"SUCCESS: Saved directly to phone: {phone_dl}")
                except Exception as err:
                    print(f"Could not write to {phone_dl}: {err}")
                    
            if 'assetlinks.json' in namelist:
                os.makedirs('public/.well-known', exist_ok=True)
                with open('public/.well-known/assetlinks.json', 'wb') as f:
                    f.write(z.read('assetlinks.json'))
                print("Updated public/.well-known/assetlinks.json with new certificate")
                    
except urllib.error.HTTPError as e:
    err_body = e.read().decode('utf-8', errors='ignore')
    print(f"HTTPError {e.code}: {e.reason}\nBody: {err_body}")
except Exception as e:
    print(f"Error: {e}")
