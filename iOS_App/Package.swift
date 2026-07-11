// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "Mantak",
    platforms: [
        .iOS(.v16),
        .macOS(.v13)
    ],
    products: [
        .library(
            name: "Mantak",
            targets: ["Mantak"]
        ),
    ],
    dependencies: [],
    targets: [
        .target(
            name: "Mantak",
            dependencies: [],
            path: "Sources"
        )
    ]
)
