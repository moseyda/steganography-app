# SteganoPro | Advanced Steganography App

![SteganoPro Banner](https://via.placeholder.com/800x200?text=SteganoPro+Advanced+Embedding)

## Description
SteganoPro is a high-performance, browser-based steganography tool that allows you to hide not just text, but **any file type (including .bat, .exe, .zip)** inside common image formats. It features enterprise-grade **AES-256 encryption** and a sleek, modern glassmorphic interface.

## Premium Features
- **File Embedding**: Hide any binary file within an image.
- **AES-256 Encryption**: Secure your payloads with industrial-strength passwords.
- **Metadata Header System**: Automatically stores file names and types for easy extraction.
- **Enhanced Capacity**: Optimized storage using R, G, and B color channels.
- **Premium UI**: Modern dark theme with glassmorphism and Outfit typography.
- **Privacy First**: Everything runs locally in your browser; no data ever leaves your machine.

## Usage
1. Open `index.html` in a modern browser.
2. **Encode**: 
   - Select a cover image.
   - Choose "File" mode.
   - Upload your secret file (e.g., `payload.bat`).
   - (Optional) Enter an encryption password.
   - Click "Generate Stegano-Image".
3. **Decode**:
   - Upload the steganographic image.
   - Enter the password if encryption was used.
   - Click "Extract Payload" to download your file.

## Technical Details
- **Architecture**: Vanilla JS, HTML5 Canvas API, CSS3 Glassmorphism.
- **Encryption**: CryptoJS (AES-256).
- **Format**: Custom binary header (`STEG` v1) followed by metadata and payload.

## Legal Usage
This project is for educational and privacy-oriented purposes. The author is not responsible for any misuse of this tool.

## Contact
Maintainer: [Mo](mailto:moseyda.developer@gmail.com)
