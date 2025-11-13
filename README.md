# 📚 Novel Reader - AI Voice

A beautiful, progressive web app for reading novels and books aloud with natural-sounding AI voices.

## ✨ Features

- 🎵 **Multiple Natural Voices**: Choose from Google Wavenet and Kokoro TTS providers
- 📖 **Smart Book Reader**: Automatic chapter detection, page navigation, synchronized highlighting
- 🎯 **Precise Bookmarking**: Save your exact reading position and resume anytime
- 📱 **Progressive Web App**: Install on any device, works offline
- 📄 **Multi-Format Support**: TXT, PDF, EPUB, DOCX, RTF
- ⚡ **Fast & Responsive**: Smooth playback with auto-scrolling
- 🔄 **Auto-Fallback**: Seamlessly switches between TTS providers if one fails

## 🚀 Quick Start

### Online (No Installation)
Visit: **https://gabrieltho.github.io/novel-reader/**

### Local Setup
```bash
# Clone the repository
git clone https://github.com/gabrieltho/novel-reader.git
cd novel-reader

# Open in browser
open index.html
# or
start index.html
```

## 📖 How to Use

1. **Import a Book**
   - Click "Choose File" to upload TXT, PDF, EPUB, or DOCX
   - Or paste text directly
   - Or load the sample

2. **Customize Voice**
   - Select from available voices (Google or Kokoro)
   - Adjust speed and pitch with sliders
   - Changes apply immediately

3. **Read Aloud**
   - Click Play ▶️ to start reading
   - Click Pause ⏸️ to pause
   - Click Stop ⏹️ to stop and save position
   - Click Skip ⏭️ to jump ahead

4. **Navigate**
   - Use page buttons to browse
   - Use chapter dropdown to jump to chapters
   - Text auto-scrolls to reading position
   - Pages auto-advance with reading

5. **Resume Later**
   - Your position is automatically saved
   - Close and reopen the browser
   - Load the same file to resume exactly where you left off

## 🎵 Voice Options

### Google Wavenet (Recommended)
- Elena (Female, Natural) ⭐ Most natural
- Aria (Female, Warm)
- Paxton (Male, Deep)
- Liam (Male, Friendly)

### Kokoro TTS
- Sky (Female, Expressive)
- Bella (Female, Warm)
- Alloy (Male, Friendly)
- Michael (Male, Professional)

## 📱 Install as App

This is a Progressive Web App (PWA):

**Desktop Chrome/Edge:**
- Click the install icon in the address bar
- Or use the "Install App" button in the app

**iOS:**
- Open in Safari
- Tap Share → Add to Home Screen

**Android:**
- Open in Chrome
- Tap menu (⋮) → Install app

## 🌐 Supported Formats

| Format | Support | Notes |
|--------|---------|-------|
| TXT | ✅ Full | Plain text files |
| PDF | ✅ Full | Uses PDF.js library |
| EPUB | ✅ Full | Uses JSZip library |
| DOCX | ✅ Full | Microsoft Word documents |
| RTF | ✅ Full | Rich text format |
| HTML | ✅ Basic | Strips HTML tags |

## ⚙️ Technical Details

- **Frontend**: Vanilla JavaScript (no frameworks)
- **Storage**: Browser localStorage
- **TTS APIs**: Google Translate TTS, Kokoro Web API
- **Libraries**: PDF.js, JSZip, Howler.js
- **Architecture**: Progressive Web App (PWA)

## 📊 Browser Support

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome | ✅ Full | ✅ Full |
| Firefox | ✅ Full | ✅ Full |
| Safari | ✅ Full | ✅ Full |
| Edge | ✅ Full | ✅ Full |
| iOS Safari | ✅ Full | ✅ Full |
| Chrome Android | ✅ Full | ✅ Full |

## 🔒 Privacy

- **Your Data**: All processing happens in your browser
- **Text**: Only sent to TTS API for voice generation
- **Storage**: Progress saved locally in browser storage
- **No Tracking**: No analytics, no tracking pixels
- **No Login**: Works completely offline for locally stored books

## 🚀 Deployment

This app is automatically deployed to GitHub Pages:
- **URL**: https://gabrieltho.github.io/novel-reader/
- **Updates**: Automatically deployed on every push to main branch
- **SSL**: HTTPS enabled by default

## 🛠️ Development

### File Structure
```
novel-reader/
├── index.html          # Main application
├── app.js             # Application logic
├── manifest.json      # PWA manifest
├── sw.js             # Service worker
├── icon-192.png      # App icon (192x192)
├── icon-512.png      # App icon (512x512)
└── README.md         # This file
```

### Adding Features

To add new features:
1. Edit `app.js` or `index.html`
2. Test locally
3. Commit and push to GitHub
4. Changes auto-deploy to GitHub Pages

## 🐛 Troubleshooting

### TTS Not Working
- Check browser console (F12) for errors
- Try a different voice
- Refresh the page
- Clear browser cache

### File Won't Load
- Supported formats: TXT, PDF, EPUB, DOCX, RTF
- For large files, may take a moment
- Check browser console for error details

### Progress Not Saving
- Browser must allow localStorage
- Check privacy settings
- Try a different browser

## 📝 Known Limitations

- Kokoro API may have rate limits
- Google TTS works best for English
- Very large files (1000+ pages) may load slowly
- EPUB parsing depends on proper document structure

## 🔮 Future Enhancements

- [ ] Offline support (cache files locally)
- [ ] Notes and highlights
- [ ] Reading statistics
- [ ] Sleep timer
- [ ] Multiple language support
- [ ] Cloud sync for progress
- [ ] Audio effects and EQ
- [ ] Text formatting options

## 📧 Support

For issues or feature requests, visit the GitHub repository:
- GitHub: https://github.com/gabrieltho/novel-reader
- Issues: https://github.com/gabrieltho/novel-reader/issues

## 📄 License

MIT License - Feel free to use and modify for personal use.

---

**Enjoy reading!** 📚🎵

Made with ❤️ for book lovers everywhere.

