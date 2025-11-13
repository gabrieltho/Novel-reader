// Novel Reader App - Improved with better TTS and sync - iOS compatible
// Version: 1.1.0 - iOS audio fixes - Deployed 2025-11-13
class NovelReader {
    constructor() {
        this.novelText = '';
        this.fileName = '';
        this.chapters = [];
        this.currentChapterIndex = 0;
        this.currentPage = 0;
        this.pagesPerChapter = [];
        this.wordsPerPage = 400;
        
        // Words instead of sentences for better highlighting
        this.words = [];
        this.currentWordIndex = 0;
        this.isReading = false;
        this.isPaused = false;
        this.currentAudio = null;
        this.audioQueue = [];
        this.audioContext = null; // For iOS compatibility
        this.audioUnlocked = false; // Track if audio is unlocked for iOS
        
        // TTS API settings - using multiple fallbacks for better reliability
        this.selectedTTSProvider = 'google'; // 'google' or 'kokoro'
        this.selectedVoice = 'en-US-Neural2-C'; // Google voice
        this.speed = 1.0;
        this.pitch = 1.0;
        
        // Initialize
        this.initializeElements();
        this.initializeVoices();
        this.attachEventListeners();
        this.initializePDFJS();
        this.loadSavedProgress();
    }

    initializeVoices() {
        // Google Wavenet voices (free tier available)
        const voices = [
            { name: 'Google - Elena (Female, Natural)', value: 'en-US-Neural2-C', provider: 'google' },
            { name: 'Google - Aria (Female, Warm)', value: 'en-US-Neural2-A', provider: 'google' },
            { name: 'Google - Paxton (Male, Deep)', value: 'en-US-Neural2-D', provider: 'google' },
            { name: 'Google - Liam (Male, Friendly)', value: 'en-US-Neural2-E', provider: 'google' },
            { name: 'Kokoro - Sky (Female)', value: 'af_sky', provider: 'kokoro' },
            { name: 'Kokoro - Bella (Female)', value: 'af_bella', provider: 'kokoro' },
            { name: 'Kokoro - Alloy (Male)', value: 'am_alloy', provider: 'kokoro' },
            { name: 'Kokoro - Michael (Male)', value: 'am_michael', provider: 'kokoro' }
        ];
        
        this.voiceSelect.innerHTML = '';
        voices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.value;
            option.textContent = voice.name;
            option.dataset.provider = voice.provider;
            this.voiceSelect.appendChild(option);
        });
        
        this.voiceSelect.value = this.selectedVoice;
        console.log('Voices loaded: Google Wavenet and Kokoro Web');
    }

    initializePDFJS() {
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    }

    initializeElements() {
        // Sections
        this.importSection = document.getElementById('importSection');
        this.textDisplay = document.getElementById('textDisplay');
        this.controlsSection = document.getElementById('controlsSection');
        this.fileNameDisplay = document.getElementById('fileName');
        
        // Reader elements
        this.chapterNav = document.getElementById('chapterNav');
        this.chapterSelect = document.getElementById('chapterSelect');
        this.prevChapterBtn = document.getElementById('prevChapterBtn');
        this.nextChapterBtn = document.getElementById('nextChapterBtn');
        this.readerContent = document.getElementById('readerContent');
        this.pageNav = document.getElementById('pageNav');
        this.pageInfo = document.getElementById('pageInfo');
        this.prevPageBtn = document.getElementById('prevPageBtn');
        this.nextPageBtn = document.getElementById('nextPageBtn');
        
        // Buttons
        this.playBtn = document.getElementById('playBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.skipBtn = document.getElementById('skipBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.changeFileBtn = document.getElementById('changeFileBtn');
        this.pasteBtn = document.getElementById('pasteBtn');
        this.sampleBtn = document.getElementById('sampleBtn');
        this.fileInput = document.getElementById('fileInput');
        
        // Modal
        this.pasteModal = document.getElementById('pasteModal');
        this.closeModal = document.getElementById('closeModal');
        this.pasteTextarea = document.getElementById('pasteTextarea');
        this.importTextBtn = document.getElementById('importTextBtn');
        
        // Settings
        this.speedSlider = document.getElementById('speedSlider');
        this.pitchSlider = document.getElementById('pitchSlider');
        this.voiceSelect = document.getElementById('voiceSelect');
        this.speedValue = document.getElementById('speedValue');
        this.pitchValue = document.getElementById('pitchValue');
        
        // Progress
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
    }

    attachEventListeners() {
        // File input
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Buttons - iOS requires audio unlock on first user interaction
        this.playBtn.addEventListener('click', () => {
            this.unlockAudioForIOS();
            this.togglePlayPause();
        });
        this.stopBtn.addEventListener('click', () => this.stopReading());
        this.skipBtn.addEventListener('click', () => this.skipForward());
        this.clearBtn.addEventListener('click', () => this.clearText());
        this.changeFileBtn.addEventListener('click', () => this.showImportSection());
        this.pasteBtn.addEventListener('click', () => this.showPasteModal());
        this.sampleBtn.addEventListener('click', () => this.loadSample());
        
        // Chapter navigation
        this.prevChapterBtn.addEventListener('click', () => this.previousChapter());
        this.nextChapterBtn.addEventListener('click', () => this.nextChapter());
        this.chapterSelect.addEventListener('change', (e) => this.goToChapter(parseInt(e.target.value)));
        
        // Page navigation
        this.prevPageBtn.addEventListener('click', () => this.previousPage());
        this.nextPageBtn.addEventListener('click', () => this.nextPage());
        
        // Modal
        this.closeModal.addEventListener('click', () => this.hidePasteModal());
        this.importTextBtn.addEventListener('click', () => this.importPastedText());
        this.pasteModal.addEventListener('click', (e) => {
            if (e.target === this.pasteModal) {
                this.hidePasteModal();
            }
        });
        
        // Settings
        this.speedSlider.addEventListener('input', (e) => {
            this.speed = parseFloat(e.target.value);
            this.speedValue.textContent = this.speed.toFixed(1) + 'x';
        });
        
        this.pitchSlider.addEventListener('input', (e) => {
            this.pitch = parseFloat(e.target.value);
            this.pitchValue.textContent = this.pitch.toFixed(1);
        });
        
        this.voiceSelect.addEventListener('change', (e) => {
            this.selectedVoice = e.target.value;
            const selectedOption = this.voiceSelect.options[this.voiceSelect.selectedIndex];
            this.selectedTTSProvider = selectedOption.dataset.provider || 'google';
        });
    }

    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.fileName = file.name;
        this.progressText.textContent = 'Loading file...';

        try {
            const text = await this.extractTextFromFile(file);
            if (text && text.trim().length > 0) {
                this.loadText(text, file.name);
            } else {
                throw new Error('No text could be extracted from this file');
            }
        } catch (error) {
            console.error('File loading error:', error);
            alert('Error loading file: ' + error.message);
            this.progressText.textContent = 'Error loading file';
        }
    }

    async extractTextFromFile(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        this.progressText.textContent = `Processing ${extension.toUpperCase()} file...`;

        switch (extension) {
            case 'txt':
            case 'text':
                return await file.text();
            case 'pdf':
                return await this.extractTextFromPDF(file);
            case 'epub':
                return await this.extractTextFromEPUB(file);
            case 'docx':
                return await this.extractTextFromDOCX(file);
            case 'rtf':
                return await this.extractTextFromRTF(file);
            default:
                return await file.text();
        }
    }

    async extractTextFromPDF(file) {
        if (typeof pdfjsLib === 'undefined') {
            throw new Error('PDF library not loaded');
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            
            let fullText = '';
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                this.progressText.textContent = `Processing PDF: page ${pageNum} of ${pdf.numPages}...`;
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n\n';
            }

            return fullText;
        } catch (error) {
            console.error('PDF error:', error);
            throw new Error('Could not read PDF. Try converting to TXT format.');
        }
    }

    async extractTextFromEPUB(file) {
        if (typeof JSZip === 'undefined') {
            throw new Error('EPUB library not loaded');
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const zip = await JSZip.loadAsync(arrayBuffer);
            
            let fullText = '';
            const htmlFiles = [];

            zip.forEach((relativePath, zipEntry) => {
                if (relativePath.match(/\.(html|xhtml|htm)$/i) && !zipEntry.dir) {
                    htmlFiles.push(relativePath);
                }
            });

            htmlFiles.sort();

            for (const fileName of htmlFiles) {
                const content = await zip.file(fileName).async('string');
                const plainText = this.stripHTML(content);
                fullText += plainText + '\n\n';
            }

            if (!fullText.trim()) {
                throw new Error('No text found in EPUB');
            }

            return fullText;
        } catch (error) {
            console.error('EPUB error:', error);
            throw new Error('Could not read EPUB. Try converting to TXT format.');
        }
    }

    async extractTextFromDOCX(file) {
        if (typeof JSZip === 'undefined') {
            throw new Error('DOCX library not loaded');
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const zip = await JSZip.loadAsync(arrayBuffer);
            const documentXML = await zip.file('word/document.xml').async('string');
            const text = this.extractTextFromXML(documentXML);
            
            if (!text.trim()) {
                throw new Error('No text found in DOCX');
            }
            
            return text;
        } catch (error) {
            console.error('DOCX error:', error);
            throw new Error('Could not read DOCX. Try converting to TXT format.');
        }
    }

    async extractTextFromRTF(file) {
        let text = await file.text();
        text = text.replace(/^{\\rtf.*?\\viewkind\d+/s, '');
        text = text.replace(/\\[a-z]+\d*\s?/g, ' ');
        text = text.replace(/[{}]/g, '');
        text = text.replace(/\s+/g, ' ');
        return text.trim();
    }

    stripHTML(html) {
        let result = html;
        result = result.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        result = result.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        result = result.replace(/<[^>]+>/g, ' ');
        result = result.replace(/&nbsp;/g, ' ');
        result = result.replace(/&lt;/g, '<');
        result = result.replace(/&gt;/g, '>');
        result = result.replace(/&amp;/g, '&');
        result = result.replace(/&quot;/g, '"');
        result = result.replace(/&#39;/g, "'");
        result = result.replace(/[ \t]+/g, ' ');
        result = result.replace(/\n\s*\n/g, '\n\n');
        return result.trim();
    }

    extractTextFromXML(xml) {
        let result = '';
        const pattern = /<w:t[^>]*>([^<]+)<\/w:t>/g;
        let match;
        
        while ((match = pattern.exec(xml)) !== null) {
            result += match[1] + ' ';
        }
        
        return result.trim();
    }

    loadText(text, filename) {
        if (!text || text.trim().length === 0) {
            alert('No text found in the file');
            return;
        }

        this.novelText = text;
        this.fileName = filename;
        
        this.detectChapters(text);
        this.words = this.splitIntoWords(text);
        this.currentWordIndex = 0;
        
        const saved = this.getSavedProgress(filename);
        if (saved) {
            this.currentChapterIndex = saved.chapter;
            this.currentPage = saved.page;
            this.currentWordIndex = saved.wordIndex || 0;
        } else {
            this.currentChapterIndex = 0;
            this.currentPage = 0;
            this.currentWordIndex = 0;
        }
        
        this.showTextDisplay();
        this.renderCurrentPage();
        this.updateProgress();
    }

    detectChapters(text) {
        const chapterPatterns = [
            /Chapter\s+\d+/gi,
            /CHAPTER\s+[IVXLCDM]+/gi,
            /Part\s+\d+/gi,
            /Book\s+\d+/gi
        ];

        let chapterMatches = [];
        
        for (const pattern of chapterPatterns) {
            const matches = [...text.matchAll(pattern)];
            if (matches.length > 0) {
                chapterMatches = matches;
                break;
            }
        }

        if (chapterMatches.length > 0) {
            this.chapters = [];
            
            for (let i = 0; i < chapterMatches.length; i++) {
                const startIndex = chapterMatches[i].index;
                const endIndex = i < chapterMatches.length - 1 
                    ? chapterMatches[i + 1].index 
                    : text.length;
                
                const chapterText = text.substring(startIndex, endIndex).trim();
                const chapterTitle = chapterMatches[i][0];
                
                this.chapters.push({
                    title: chapterTitle,
                    text: chapterText,
                    startIndex: startIndex
                });
            }
        } else {
            this.chapters = [{
                title: 'Full Text',
                text: text,
                startIndex: 0
            }];
        }

        this.paginateChapters();
        this.populateChapterSelect();
    }

    paginateChapters() {
        this.pagesPerChapter = [];
        
        for (const chapter of this.chapters) {
            const words = chapter.text.split(/\s+/);
            const pages = [];
            
            for (let i = 0; i < words.length; i += this.wordsPerPage) {
                const pageWords = words.slice(i, i + this.wordsPerPage);
                pages.push(pageWords.join(' '));
            }
            
            this.pagesPerChapter.push(pages);
        }
    }

    populateChapterSelect() {
        this.chapterSelect.innerHTML = '';
        
        this.chapters.forEach((chapter, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = chapter.title;
            this.chapterSelect.appendChild(option);
        });
        
        this.chapterSelect.value = this.currentChapterIndex;
        this.chapterNav.style.display = this.chapters.length > 1 ? 'flex' : 'none';
    }

        renderCurrentPage() {
        const pages = this.pagesPerChapter[this.currentChapterIndex];
        if (!pages || pages.length === 0) return;
        
        // Stop reading when changing pages/chapters
        if (this.isReading) {
            this.stopReading();
        }
        
        const pageText = pages[this.currentPage] || '';
        
        this.readerContent.innerHTML = '';
        
        // Calculate word index offset for this page
        const wordOffset = this.getPageWordOffset(this.currentChapterIndex, this.currentPage);
        
        const sentences = pageText.match(/[^.!?]+[.!?]+/g) || [pageText];
        
        sentences.forEach((sentence, index) => {
            const span = document.createElement('span');
            span.className = 'sentence';
            span.setAttribute('data-sentence-index', index);
            span.setAttribute('data-word-offset', wordOffset);
            span.title = 'Click to start reading from here';
            span.textContent = sentence + ' ';
            
            // Make sentence clickable to start reading from that point
            span.addEventListener('click', () => {
                this.startReadingFromSentence(span, wordOffset, sentence);
            });
            
            this.readerContent.appendChild(span);
        });
        
        this.pageInfo.textContent = `Page ${this.currentPage + 1} of ${pages.length}`;
        
        this.prevPageBtn.disabled = this.currentPage === 0;
        this.nextPageBtn.disabled = this.currentPage === pages.length - 1;
        this.prevChapterBtn.disabled = this.currentChapterIndex === 0;
        this.nextChapterBtn.disabled = this.currentChapterIndex === this.chapters.length - 1;
        
        this.saveProgress();
    }

    
    getPageWordOffset(chapterIndex, pageIndex) {
        let wordCount = 0;
        
        // Count words in all previous chapters
        for (let i = 0; i < chapterIndex; i++) {
            const chapter = this.chapters[i];
            if (chapter && chapter.text) {
                wordCount += chapter.text.split(/\s+/).filter(w => w.trim().length > 0).length;
            }
        }
        
        // Count words in current chapter up to this page
        const pages = this.pagesPerChapter[chapterIndex];
        if (pages) {
            for (let i = 0; i < pageIndex && i < pages.length; i++) {
                wordCount += pages[i].split(/\s+/).filter(w => w.trim().length > 0).length;
            }
        }
        
        return wordCount;
    }
    
    startReadingFromSentence(span, wordOffset, sentence) {
        // Stop current reading if any
        if (this.isReading) {
            this.stopReading();
        }
        
        // Get the current page text to find sentence position
        const pages = this.pagesPerChapter[this.currentChapterIndex];
        const pageText = pages[this.currentPage] || '';
        const sentences = pageText.match(/[^.!?]+[.!?]+/g) || [pageText];
        
        // Find which sentence was clicked
        const sentenceIndex = parseInt(span.getAttribute('data-sentence-index'));
        
        // Count words before this sentence in current page
        let wordsBeforeSentence = 0;
        for (let i = 0; i < sentenceIndex; i++) {
            const words = sentences[i].split(/\s+/).filter(w => w.trim().length > 0);
            wordsBeforeSentence += words.length;
        }
        
        // Calculate total word offset
        const totalWordOffset = wordOffset + wordsBeforeSentence;
        
        // Find the exact position in the full words array
        let wordCount = 0;
        let foundOffset = 0;
        
        for (let i = 0; i < this.words.length; i++) {
            if (wordCount >= totalWordOffset) {
                foundOffset = i;
                break;
            }
            if (!this.words[i].isWhitespace) {
                wordCount++;
            }
        }
        
        // Set reading position
        this.currentWordIndex = foundOffset;
        this.updateProgress();
        
        // Highlight the clicked sentence
        this.clearHighlights();
        span.classList.add('highlighted');
        
        // Scroll to the sentence
        span.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Start reading from here
        this.startReading();
    }    previousPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.renderCurrentPage();
        }
    }

    nextPage() {
        const pages = this.pagesPerChapter[this.currentChapterIndex];
        if (this.currentPage < pages.length - 1) {
            this.currentPage++;
            this.renderCurrentPage();
        } else {
            if (this.currentChapterIndex < this.chapters.length - 1) {
                this.nextChapter();
            }
        }
    }

    previousChapter() {
        if (this.currentChapterIndex > 0) {
            this.currentChapterIndex--;
            this.currentPage = 0;
            this.chapterSelect.value = this.currentChapterIndex;
            this.renderCurrentPage();
        }
    }

    nextChapter() {
        if (this.currentChapterIndex < this.chapters.length - 1) {
            this.currentChapterIndex++;
            this.currentPage = 0;
            this.chapterSelect.value = this.currentChapterIndex;
            this.renderCurrentPage();
        }
    }

    goToChapter(chapterIndex) {
        if (chapterIndex >= 0 && chapterIndex < this.chapters.length) {
            this.currentChapterIndex = chapterIndex;
            this.currentPage = 0;
            this.renderCurrentPage();
        }
    }

    saveProgress() {
        const progress = {
            fileName: this.fileName,
            chapter: this.currentChapterIndex,
            page: this.currentPage,
            wordIndex: this.currentWordIndex,
            timestamp: Date.now()
        };
        
        localStorage.setItem(`novel-reader-progress-${this.fileName}`, JSON.stringify(progress));
        localStorage.setItem(`novel-reader-last-file`, this.fileName);
    }

    getSavedProgress(filename) {
        const saved = localStorage.getItem(`novel-reader-progress-${filename}`);
        return saved ? JSON.parse(saved) : null;
    }

    loadSavedProgress() {
        // Called when loading a file
    }

    splitIntoWords(text) {
        // Split text into words and track their positions
        const words = text
            .split(/(\s+)/)
            .filter(w => w.trim().length > 0)
            .map(w => ({
                text: w,
                isWhitespace: /^\s+$/.test(w)
            }));
        
        return words;
    }

    splitIntoSentences(text) {
        const sentences = text
            .split(/(?<=[.!?])\s+/)
            .map(s => s.trim())
            .filter(s => s.length > 3);
        
        return sentences;
    }

    showTextDisplay() {
        this.importSection.classList.add('hidden');
        this.textDisplay.classList.add('active');
        this.controlsSection.classList.add('active');
        this.fileNameDisplay.classList.add('active');
        
        this.fileNameDisplay.textContent = '­ƒôä ' + this.fileName;
        this.progressText.textContent = `Ready to read (${this.chapters.length} chapters)`;
    }

    showImportSection() {
        this.importSection.classList.remove('hidden');
        this.textDisplay.classList.remove('active');
        this.controlsSection.classList.remove('active');
        this.fileNameDisplay.classList.remove('active');
        
        this.stopReading();
        this.novelText = '';
        this.fileName = '';
    }

    showPasteModal() {
        this.pasteModal.classList.add('active');
        this.pasteTextarea.value = '';
        this.pasteTextarea.focus();
    }

    hidePasteModal() {
        this.pasteModal.classList.remove('active');
    }

    importPastedText() {
        const text = this.pasteTextarea.value.trim();
        
        if (text.length === 0) {
            alert('Please paste some text first');
            return;
        }

        this.loadText(text, 'Pasted Text');
        this.hidePasteModal();
    }

    loadSample() {
        const sampleText = `Chapter 1: The Beginning

It was a bright cold day in April, and the clocks were striking thirteen. The protagonist walked down the cobblestone street, lost in thought about the adventures that lay ahead. The morning sun cast long shadows across the pavement.

Chapter 2: The Discovery

The shop was much larger than it appeared from the outside. Rows upon rows of bookshelves stretched into the dim recesses of the building. Each shelf seemed to lean slightly, as if weighted down by the centuries of knowledge they contained.

Chapter 3: The Journey

Days turned into weeks as the adventure continued. New friends were made, challenges were overcome, and the protagonist grew wiser with each passing moment.`;

        this.loadText(sampleText, 'Sample Novel');
    }

    clearText() {
        if (confirm('Are you sure you want to clear the current text?')) {
            this.showImportSection();
        }
    }

    unlockAudioForIOS() {
        // iOS Safari requires audio to be unlocked synchronously on first user interaction
        if (!this.audioUnlocked) {
            try {
                // Create a silent audio buffer and play it immediately (synchronously)
                const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
                silentAudio.volume = 0.01; // iOS needs non-zero volume
                silentAudio.setAttribute('playsinline', 'true');
                silentAudio.setAttribute('webkit-playsinline', 'true');
                
                // Play synchronously - don't wait for promise
                const playPromise = silentAudio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        silentAudio.pause();
                        this.audioUnlocked = true;
                        console.log('Ô£à Audio unlocked for iOS');
                    }).catch(err => {
                        console.error('ÔØî Audio unlock failed:', err);
                        // Still mark as attempted
                        this.audioUnlocked = true;
                    });
                } else {
                    // Older browsers
                    this.audioUnlocked = true;
                }
            } catch (err) {
                console.error('ÔØî Audio unlock error:', err);
                this.audioUnlocked = true; // Mark as attempted
            }
        }
    }

    togglePlayPause() {
        if (this.isReading) {
            this.pauseReading();
        } else if (this.isPaused) {
            this.resumeReading();
        } else {
            this.startReading();
        }
    }

    async startReading() {
        if (this.words.length === 0) return;

        // Ensure audio is unlocked for iOS BEFORE starting
        if (!this.audioUnlocked) {
            this.unlockAudioForIOS();
            // Give iOS a moment to unlock audio
            if (this.isIOS()) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        this.isReading = true;
        this.isPaused = false;
        this.playBtn.textContent = 'ÔÅ©´©Å';
        this.stopBtn.disabled = false;
        this.skipBtn.disabled = false;
        
        // Show iOS-specific message if needed
        if (this.isIOS()) {
            this.progressText.textContent = 'Starting playback... (iOS - ensure sound is on)';
        }
        
        this.readNextPhrase();
    }

    pauseReading() {
        if (this.currentAudio) {
            this.currentAudio.pause();
        }
        this.isReading = false;
        this.isPaused = true;
        this.playBtn.textContent = 'ÔûÂ´©Å';
        this.progressText.textContent = 'Paused';
    }

    resumeReading() {
        if (this.currentAudio) {
            this.currentAudio.play();
        }
        this.isReading = true;
        this.isPaused = false;
        this.playBtn.textContent = 'ÔÅ©´©Å';
        this.updateProgressText();
    }

    stopReading() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        this.isReading = false;
        this.isPaused = false;
        this.playBtn.textContent = 'ÔûÂ´©Å';
        this.stopBtn.disabled = true;
        this.skipBtn.disabled = true;
        this.clearHighlights();
        this.updateProgress();
        this.progressText.textContent = 'Stopped';
        this.saveProgress();
    }

    skipForward() {
        // Skip ahead by 50 words
        this.currentWordIndex = Math.min(this.currentWordIndex + 50, this.words.length - 1);
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        this.updateProgress();
        this.checkAndTurnPage();
        
        if (this.isReading) {
            this.readNextPhrase();
        }
    }

    // Get next phrase (sentence up to period/punctuation)
    getNextPhrase() {
        let phrase = '';
        let startIndex = this.currentWordIndex;
        
        // Collect words until we hit punctuation or reach max length
        while (this.currentWordIndex < this.words.length) {
            const word = this.words[this.currentWordIndex];
            phrase += word.text;
            this.currentWordIndex++;
            
            // Stop if we hit sentence-ending punctuation or have enough content
            if (/[.!?]$/.test(word.text) || phrase.split(' ').length > 20) {
                break;
            }
        }
        
        return phrase.trim();
    }

    async readNextPhrase() {
        if (this.currentWordIndex >= this.words.length) {
            this.stopReading();
            this.progressText.textContent = 'Finished reading';
            return;
        }

        const phrase = this.getNextPhrase();
        
        if (!phrase) {
            this.stopReading();
            return;
        }
        
        try {
            const audioUrl = await this.generateSpeech(phrase);
            
            if (!audioUrl) {
                // Fallback: skip to next phrase on error
                if (this.isReading) {
                    setTimeout(() => this.readNextPhrase(), 500);
                }
                return;
            }
            
            // Create and play audio - iOS compatible
            this.currentAudio = new Audio(audioUrl);
            
            // iOS Safari requires these attributes
            this.currentAudio.preload = 'auto';
            this.currentAudio.setAttribute('playsinline', 'true');
            this.currentAudio.setAttribute('webkit-playsinline', 'true');
            this.currentAudio.setAttribute('crossorigin', 'anonymous');
            
            // Set volume (iOS may mute if volume is 0)
            this.currentAudio.volume = 1.0;
            
            // Add loading event
            this.currentAudio.addEventListener('loadstart', () => {
                console.log('­ƒôÑ Audio loading started');
                if (this.isIOS()) {
                    this.progressText.textContent = 'Loading audio...';
                }
            });
            
            this.currentAudio.addEventListener('canplay', () => {
                console.log('Ô£à Audio can play');
            });
            
            this.currentAudio.addEventListener('loadeddata', () => {
                console.log('Ô£à Audio data loaded');
                // Audio is ready, try to play
                const playPromise = this.currentAudio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log('ÔûÂ´©Å Audio playing');
                        if (this.isIOS()) {
                            this.progressText.textContent = 'Playing... (check device volume)';
                        }
                    }).catch(err => {
                        console.error('ÔØî Play error:', err);
                        this.progressText.textContent = `Error: ${err.message}. Try tapping Play again.`;
                        // If play fails, try to unlock audio again
                        if (!this.audioUnlocked) {
                            this.unlockAudioForIOS();
                            setTimeout(() => {
                                if (this.currentAudio && this.isReading) {
                                    this.currentAudio.play().catch(e => {
                                        console.error('ÔØî Retry play error:', e);
                                        this.progressText.textContent = `Playback failed: ${e.message}`;
                                        if (this.isReading) {
                                            this.readNextPhrase();
                                        }
                                    });
                                }
                            }, 200);
                        } else if (this.isReading) {
                            this.progressText.textContent = 'Audio playback blocked. Check device settings.';
                            setTimeout(() => {
                                if (this.isReading) {
                                    this.readNextPhrase();
                                }
                            }, 1000);
                        }
                    });
                }
            });
            
            this.currentAudio.addEventListener('ended', () => {
                // Clean up blob URL if it's a blob
                if (audioUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(audioUrl);
                }
                this.updateProgress();
                this.checkAndTurnPage();
                
                if (this.isReading) {
                    // Small delay between phrases for natural reading
                    setTimeout(() => {
                        if (this.isReading) {
                            this.readNextPhrase();
                        }
                    }, 100);
                }
            });
            
            this.currentAudio.addEventListener('error', (e) => {
                console.error('ÔØî Audio playback error:', e);
                this.progressText.textContent = `Audio error: ${e.message || 'Failed to load audio'}`;
                // Clean up blob URL on error
                if (audioUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(audioUrl);
                }
                if (this.isReading) {
                    setTimeout(() => {
                        if (this.isReading) {
                            this.readNextPhrase();
                        }
                    }, 500);
                }
            });
            
            // Load the audio (don't play immediately - wait for loadeddata event)
            this.currentAudio.load();
            
            this.updateProgressText();
            this.highlightCurrentPhraseInPage();
            
        } catch (error) {
            console.error('ÔØî TTS Error:', error);
            this.progressText.textContent = `TTS Error: ${error.message || 'Failed to generate speech'}`;
            if (this.isIOS()) {
                this.progressText.textContent += ' (iOS: Try Kokoro voice)';
            }
            // Try next phrase instead of stopping
            if (this.isReading) {
                setTimeout(() => {
                    if (this.isReading) {
                        this.readNextPhrase();
                    }
                }, 1000);
            }
        }
    }

    isIOS() {
        // Detect iOS devices
        return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
               (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }

    async generateSpeech(text) {
        // iOS Safari often blocks Google Translate TTS, prefer Kokoro on iOS
        const preferKokoro = this.isIOS();
        
        try {
            if (preferKokoro || this.selectedTTSProvider === 'kokoro') {
                return await this.generateKokoroSpeech(text);
            } else {
                return await this.generateGoogleSpeech(text);
            }
        } catch (error) {
            console.error('Speech generation error:', error);
            // Fallback to the other provider
            try {
                if (preferKokoro || this.selectedTTSProvider === 'kokoro') {
                    return await this.generateGoogleSpeech(text);
                } else {
                    return await this.generateKokoroSpeech(text);
                }
            } catch (fallbackError) {
                console.error('Fallback speech generation also failed:', fallbackError);
                return null;
            }
        }
    }

    async generateGoogleSpeech(text) {
        // Using Google Translate TTS as a free fallback
        // Note: For production, use Google Cloud Text-to-Speech API with proper authentication
        const encodedText = encodeURIComponent(text);
        const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=en&client=tw-ob&ttsspeed=${this.speed}`;
        return audioUrl;
    }

    async generateKokoroSpeech(text) {
        const response = await fetch('https://voice-generator.pages.dev/api/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'kokoro-v0_19',
                input: text,
                voice: this.selectedVoice,
                speed: this.speed
            })
        });
        
        if (!response.ok) {
            throw new Error(`Kokoro API error: ${response.status}`);
        }
        
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        return audioUrl;
    }

    highlightCurrentPhraseInPage() {
        this.clearHighlights();
        // Highlight the current section in the reader
        const allSpans = this.readerContent.querySelectorAll('.sentence');
        let highlighted = false;
        
        allSpans.forEach((span, idx) => {
            if (!highlighted && idx >= Math.max(0, this.currentWordIndex - 50)) {
                span.classList.add('highlighted');
                highlighted = true;
                // Scroll to highlighted text
                span.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }

    clearHighlights() {
        const highlighted = this.readerContent.querySelectorAll('.highlighted');
        highlighted.forEach(el => el.classList.remove('highlighted'));
    }

    checkAndTurnPage() {
        // Check if we need to turn the page based on current word index
        const pageSize = this.wordsPerPage;
        const pageWords = this.getPageWordCount(this.currentPage);
        
        if (this.currentWordIndex > pageWords) {
            this.nextPage();
        }
    }

    getPageWordCount(pageIndex) {
        const pages = this.pagesPerChapter[this.currentChapterIndex];
        if (!pages) return 0;
        
        let wordCount = 0;
        for (let i = 0; i <= pageIndex && i < pages.length; i++) {
            wordCount += pages[i].split(/\s+/).length;
        }
        return wordCount;
    }

    updateProgress() {
        if (this.words.length === 0) {
            this.progressFill.style.width = '0%';
            return;
        }

        const progress = (this.currentWordIndex / this.words.length) * 100;
        this.progressFill.style.width = progress + '%';
        
        if (!this.isReading && !this.isPaused) {
            this.progressText.textContent = `Ready to read (${this.chapters.length} chapters)`;
        }
    }

    updateProgressText() {
        const progress = Math.round((this.currentWordIndex / this.words.length) * 100);
        this.progressText.textContent = `Reading: ${progress}% complete`;
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    const app = new NovelReader();
    console.log('Novel Reader initialized with ResponsiveVoice');
});
