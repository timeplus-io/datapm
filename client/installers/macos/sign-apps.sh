#!/bin/zsh

########
# Run this from the ./client directory of the root of this project
########

# $1 The path to the file to be signed
function signFile {
    echo ""
echo "### Signing $1"
    /usr/bin/codesign --force --options runtime --entitlements ./installers/macos/macOS-x64/macos-runtime-entitlements.plist -s $APPLE_DEVELOPER_CERTIFICATE_ID --timestamp $1 -v
}


# Extract the certificates from environment variables
echo ""
echo "###   Extracting certificates from environment variables"
echo $MACOS_CERTIFICATE | base64 -D > certificate.p12
echo $MACOS_INSTALLER_CERTIFICATE | base64 -D > installer-certificate.p12

# Create a temporary keychain (will fail if the key chain already exists)
echo ""
echo "###   Creating temporary keychain"
security create-keychain -p $MACOS_KEYCHAIN_TEMPORARY_PASSWORD build.keychain 
security default-keychain -s build.keychain
security unlock-keychain -p $MACOS_KEYCHAIN_TEMPORARY_PASSWORD build.keychain

echo ""
echo "###   Importing app signing certificate"
security import certificate.p12 -k build.keychain -P $MACOS_CERTIFICATE_PWD -T /usr/bin/codesign

echo ""
echo "###   Importing installer signing certificate"
security import installer-certificate.p12 -k build.keychain -P $MACOS_INSTALLER_CERTIFICATE_PWD -T /usr/bin/codesign

echo ""
echo "###   Completing temporary keychain"
security set-key-partition-list -S apple-tool:,apple:,teamid:$APPLE_TEAM_ID -s -k $MACOS_KEYCHAIN_TEMPORARY_PASSWORD build.keychain

# Sign the application 
signFile ./pkg-mac64/datapm


# Sign the node modules as well
ar=( $(find pkg-mac64/**/*.node ) ); 
ar+=( $(find pkg-mac64/**/*.node.bak ) ); 
for i in "${ar[@]}"; do signFile $i; done

# Prepare for Installer creation
echo ""
echo "###   Preparing for installer creation"
mkdir -p ./installers/macos/macOS-x64/application
cp -R ./pkg-mac64/* ./installers/macos/macOS-x64/application

# Create the installer
echo ""
echo "###   Creating installer"
cd installers/macos/macOS-x64
./build-macos-x64.sh DataPM $DATAPM_VERSION
cd ../../../

# Submit the installer for notarization by Apple
echo ""
echo "###   Submitting installer for notarization"
xcrun notarytool submit ./installers/macos/macOS-x64/target/pkg-signed/*.pkg --apple-id $APPLE_ID --password $APPLE_ID_PASSWORD --team-id $APPLE_TEAM_ID --wait

echo ""
echo "###   Attaching notarization ticket"
xcrun stapler staple ./installers/macos/macOS-x64/target/pkg-signed/*.pkg