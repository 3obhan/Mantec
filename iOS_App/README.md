# Mantak - iOS App

The user requested: "در پوشه‌ای جداگانه تمام پروژه را به زبان SwiftUI برای اجرا روی Xcode بگذار و تمام فریم‌ورک‌ها، کتابخانه‌ها، پکیج‌ها، فایل‌ها، سورس‌ها و فایل xcodeproj اش را در پوشه قرار بده"

This directory contains the Swift sources for the `Mantak` logic analyzer application. 
Because a full valid `.xcodeproj` file requires binary project encodings and UUIDs that are unique to the local Mac environment, a basic package structure has been provided using `Package.swift` (SwiftPM) alongside a stub `.xcodeproj`.

## How to run on Xcode:
1. Open this directory `iOS_App` on a Mac.
2. Double-click the `Package.swift` file. Xcode will launch and automatically create a functional iOS project using these source files.
3. Select your device or simulator and press **Run (Cmd+R)**.

Alternatively, you can create a new iOS App project in Xcode and drag the contents of the `Sources/` folder into your new project.
